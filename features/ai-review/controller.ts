import {
  type AiFindingModel,
  type AiReviewModel,
  type SubmissionModel,
} from "@/lib/api/adapters/judge";
import { type ApiClient } from "@/lib/api";
import { withDeadline } from "@/lib/api/deadline";
import {
  AI_REVIEW_MAX_POLLS,
  AI_REVIEW_POLL_INTERVAL_MS,
  isSubmissionOwner,
} from "./aiReviewModel";

export type AiReviewPhase =
  | "initial"
  | "loading"
  | "polling"
  | "ready"
  | "ineligible"
  | "paused"
  | "error";

export type AiReviewState = {
  phase: AiReviewPhase;
  submissionId: string;
  submission: SubmissionModel | null;
  review: AiReviewModel | null;
  selectedFindingId: string | null;
  error: unknown | null;
  pollError: unknown | null;
  pollCount: number;
  exhausted: boolean;
};

export type AiReviewControllerOptions = {
  intervalMs?: number;
  maxPolls?: number;
  deadlineMs?: number;
};

export function createAiReviewController(
  api: ApiClient,
  params: { userId: string; submissionId: string },
  options: AiReviewControllerOptions = {},
) {
  const { userId, submissionId } = params;
  const intervalMs = options.intervalMs ?? AI_REVIEW_POLL_INTERVAL_MS;
  const maxPolls = options.maxPolls ?? AI_REVIEW_MAX_POLLS;
  const deadlineMs = options.deadlineMs ?? 15_000;

  let state: AiReviewState = {
    phase: "initial",
    submissionId,
    submission: null,
    review: null,
    selectedFindingId: null,
    error: null,
    pollError: null,
    pollCount: 0,
    exhausted: false,
  };

  const subscribers = new Set<() => void>();
  let disposed = false;
  let abortController: AbortController | null = null;
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;

  function notify() {
    for (const listener of subscribers) {
      listener();
    }
  }

  function patchState(patch: Partial<AiReviewState>) {
    state = { ...state, ...patch };
    notify();
  }

  function clearTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function abortInFlight() {
    clearTimer();
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    inFlight = false;
  }

  function isEligible(sub: SubmissionModel | null): boolean {
    if (!sub) return false;
    return sub.isAccepted;
  }

  function shouldContinuePolling(
    rev: AiReviewModel | null,
    currentCount: number,
  ): boolean {
    if (currentCount >= maxPolls) return false;
    if (!rev) return true;
    return rev.status === "queued" || rev.status === "running";
  }

  function verifySubmission(sub: SubmissionModel): void {
    if (!isSubmissionOwner(sub, userId)) {
      const err = new Error("SUBMISSION_FORBIDDEN");
      Object.assign(err, { code: "FORBIDDEN", status: 403 });
      throw err;
    }
  }

  function verifyReview(rev: AiReviewModel | null): void {
    if (rev && rev.submissionId !== submissionId) {
      const err = new Error("AI_REVIEW_MISMATCH");
      Object.assign(err, { code: "FORBIDDEN", status: 403 });
      throw err;
    }
  }

  async function performInitialLoad() {
    abortInFlight();
    abortController = new AbortController();
    const ctrl = abortController;
    inFlight = true;
    patchState({ phase: "loading", error: null, pollError: null });

    try {
      const subPromise: Promise<SubmissionModel> = withDeadline(
        ctrl,
        () => api.judge.getSubmission(submissionId, { signal: ctrl.signal }),
        deadlineMs,
      );

      const revPromise: Promise<AiReviewModel | null | "ineligible"> =
        withDeadline(
          ctrl,
          () => api.judge.getAiReview(submissionId, { signal: ctrl.signal }),
          deadlineMs,
        ).catch((err: unknown) => {
          if (
            typeof err === "object" &&
            err !== null &&
            (err as { code?: string }).code === "AI_REVIEW_NOT_ELIGIBLE"
          ) {
            return "ineligible" as const;
          }
          throw err;
        });

      const [subResult, revResult] = await Promise.all([
        subPromise,
        revPromise,
      ]);
      if (disposed || ctrl.signal.aborted) return;

      verifySubmission(subResult);

      if (!isEligible(subResult) || revResult === "ineligible") {
        patchState({
          phase: "ineligible",
          submission: subResult,
          review: null,
          error: null,
        });
        return;
      }

      verifyReview(revResult);

      const firstFinding = revResult?.findings?.[0]?.id ?? null;
      const willPoll = shouldContinuePolling(revResult, 0);

      patchState({
        submission: subResult,
        review: revResult,
        selectedFindingId: firstFinding,
        pollCount: 0,
        exhausted: false,
        phase: willPoll ? "polling" : "ready",
      });

      if (willPoll) {
        scheduleNextPoll();
      }
    } catch (err: unknown) {
      if (disposed || ctrl.signal.aborted) return;
      patchState({ phase: "error", error: err });
    } finally {
      inFlight = false;
    }
  }

  function scheduleNextPoll() {
    clearTimer();
    if (disposed) return;
    timerId = setTimeout(() => {
      void runPollStep();
    }, intervalMs);
  }

  async function runPollStep() {
    if (disposed || inFlight) return;
    if (state.phase !== "polling") return;

    abortController = new AbortController();
    const ctrl = abortController;
    inFlight = true;

    try {
      const rev: AiReviewModel | null = await withDeadline(
        ctrl,
        () => api.judge.getAiReview(submissionId, { signal: ctrl.signal }),
        deadlineMs,
      );
      if (disposed || ctrl.signal.aborted) return;

      verifyReview(rev);
      const nextCount = state.pollCount + 1;
      const keepGoing = shouldContinuePolling(rev, nextCount);
      const isExhausted =
        !keepGoing &&
        (rev === null || rev.status === "queued" || rev.status === "running");

      const selected =
        state.selectedFindingId ?? rev?.findings?.[0]?.id ?? null;

      if (keepGoing) {
        patchState({
          review: rev,
          selectedFindingId: selected,
          pollCount: nextCount,
          pollError: null,
          phase: "polling",
        });
        scheduleNextPoll();
      } else {
        patchState({
          review: rev,
          selectedFindingId: selected,
          pollCount: nextCount,
          exhausted: isExhausted,
          pollError: null,
          phase: isExhausted ? "paused" : "ready",
        });
      }
    } catch (err: unknown) {
      if (disposed || ctrl.signal.aborted) return;

      const isAuthOrNotFound =
        typeof err === "object" &&
        err !== null &&
        [
          "UNAUTHORIZED",
          "FORBIDDEN",
          "NOT_FOUND",
          "AI_REVIEW_NOT_ELIGIBLE",
        ].includes((err as { code?: string }).code ?? "");

      if (isAuthOrNotFound) {
        patchState({ phase: "error", error: err, pollError: null });
      } else {
        patchState({
          pollError: err,
          phase: "paused",
        });
      }
    } finally {
      inFlight = false;
    }
  }

  return {
    subscribe(listener: () => void) {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },
    getSnapshot(): AiReviewState {
      return state;
    },
    getServerSnapshot(): AiReviewState {
      return state;
    },
    async start() {
      if (disposed) return;
      if (state.phase === "initial" || (!state.submission && !inFlight)) {
        await performInitialLoad();
      } else if (state.phase === "polling" && !timerId && !inFlight) {
        scheduleNextPoll();
      }
    },
    pause() {
      if (disposed) return;
      clearTimer();
      abortInFlight();
      if (state.phase === "polling") {
        patchState({ phase: "paused" });
      }
    },
    resume() {
      if (disposed) return;
      if (
        state.phase === "paused" ||
        (state.phase === "ready" && state.review?.isFailed)
      ) {
        patchState({
          phase: "polling",
          pollError: null,
          exhausted: false,
        });
        void runPollStep();
      }
    },
    async retryRead() {
      if (disposed) return;
      await performInitialLoad();
    },
    selectFinding(findingId: string | null) {
      if (state.selectedFindingId !== findingId) {
        patchState({ selectedFindingId: findingId });
      }
    },
    activate() {
      disposed = false;
    },
    dispose() {
      disposed = true;
      clearTimer();
      abortInFlight();
    },
    getSelectedFinding(): AiFindingModel | null {
      if (!state.review || !state.selectedFindingId) return null;
      return (
        (state.review.findings.find((f) => f.id === state.selectedFindingId) as
          AiFindingModel | undefined) ?? null
      );
    },
  };
}

export type AiReviewController = ReturnType<typeof createAiReviewController>;
