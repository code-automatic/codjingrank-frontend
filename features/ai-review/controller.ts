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
  params: { userId: string; submissionId: string; role?: string },
  options: AiReviewControllerOptions = {},
) {
  const { userId, submissionId, role } = params;
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
  let generation = 0;

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
    generation++;
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
    if (
      sub.id !== submissionId ||
      (!isSubmissionOwner(sub, userId) && role !== "admin")
    ) {
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
    const operation = generation;
    abortController = new AbortController();
    const ctrl = abortController;
    inFlight = true;
    patchState({ phase: "loading", error: null, pollError: null });

    try {
      const subResult = await withDeadline(
        ctrl,
        () => api.judge.getSubmission(submissionId, { signal: ctrl.signal }),
        deadlineMs,
      );
      if (disposed || operation !== generation) return;
      verifySubmission(subResult);
      patchState({ submission: subResult });
      if (!isEligible(subResult)) {
        patchState({ phase: "ineligible", review: null, error: null });
        return;
      }
      const revResult: AiReviewModel | null | "ineligible" = await withDeadline(
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
      if (disposed || operation !== generation) return;

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
      if (disposed || operation !== generation) return;
      patchState({ phase: "error", error: err });
    } finally {
      if (operation === generation) {
        inFlight = false;
        abortController = null;
      }
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
    const operation = generation;

    abortController = new AbortController();
    const ctrl = abortController;
    inFlight = true;

    try {
      const rev: AiReviewModel | null = await withDeadline(
        ctrl,
        () => api.judge.getAiReview(submissionId, { signal: ctrl.signal }),
        deadlineMs,
      );
      if (disposed || operation !== generation) return;

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
      if (disposed || operation !== generation) return;

      const isAuthOrNotFound =
        (typeof err === "object" &&
          err !== null &&
          [
            "UNAUTHORIZED",
            "FORBIDDEN",
            "NOT_FOUND",
            "AI_REVIEW_NOT_ELIGIBLE",
          ].includes((err as { code?: string }).code ?? "")) ||
        (typeof err === "object" &&
          err !== null &&
          [401, 403, 404, 409].includes(
            (err as { status?: number }).status ?? 0,
          ));

      if (isAuthOrNotFound) {
        patchState({ phase: "error", error: err, pollError: null });
      } else {
        patchState({
          pollError: err,
          phase: "paused",
        });
      }
    } finally {
      if (operation === generation) {
        inFlight = false;
        abortController = null;
      }
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
      if (
        state.phase === "initial" ||
        (state.phase === "loading" && !inFlight) ||
        (!state.submission && !inFlight)
      ) {
        await performInitialLoad();
      } else if (state.phase === "polling" && !timerId && !inFlight) {
        scheduleNextPoll();
      }
    },
    pause() {
      if (disposed) return;
      clearTimer();
      abortInFlight();
      if (state.phase === "polling" || state.phase === "loading") {
        patchState({ phase: "paused" });
      }
    },
    resume() {
      if (disposed) return;
      if (state.phase === "paused" && !state.submission) {
        void performInitialLoad();
        return;
      }
      if (
        state.phase === "paused" ||
        (state.phase === "ready" && state.review?.isFailed)
      ) {
        patchState({
          phase: "polling",
          pollError: null,
          exhausted: false,
          pollCount: 0,
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
