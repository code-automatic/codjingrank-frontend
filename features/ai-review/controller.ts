import type { ApiClient, RequestOptions } from "@/lib/api";
import type { AiReviewModel, SubmissionModel } from "@/lib/api/adapters/judge";
import { ApiError } from "@/lib/api/client";
import { withDeadline } from "@/lib/api/deadline";
import {
  AI_REVIEW_MAX_POLLS,
  AI_REVIEW_POLL_INTERVAL_MS,
} from "./aiReviewModel";

export type AiReviewPhase =
  "loading" | "polling" | "paused" | "ready" | "ineligible" | "error";

export type AiReviewState = {
  phase: AiReviewPhase;
  submission: SubmissionModel | null;
  review: AiReviewModel | null;
  error: unknown;
  pollError: unknown;
  exhausted: boolean;
  selectedFindingId: string | null;
};

type AiReviewContext = {
  userId: string;
  submissionId: string;
};

export type AiReviewControllerOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  maxPolls?: number;
};

const INITIAL_AI_REVIEW_STATE: AiReviewState = {
  phase: "loading",
  submission: null,
  review: null,
  error: null,
  pollError: null,
  exhausted: false,
  selectedFindingId: null,
};

export function createAiReviewController(
  api: Pick<ApiClient, "judge">,
  context: AiReviewContext,
  options: AiReviewControllerOptions = {},
) {
  let state: AiReviewState = { ...INITIAL_AI_REVIEW_STATE };
  const listeners = new Set<() => void>();
  const controllers = new Set<AbortController>();
  const intervalMs = options.intervalMs ?? AI_REVIEW_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? 15_000;
  const maxPolls = options.maxPolls ?? AI_REVIEW_MAX_POLLS;

  let active = true;
  let epoch = 0;
  let polls = 0;
  let inFlight = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function publish(patch: Partial<AiReviewState>) {
    if (!active) return;
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }

  function clearScheduledPoll() {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  function abortPendingRequests() {
    controllers.forEach((controller) => controller.abort());
    controllers.clear();
  }

  async function request<T>(
    fn: (opts: RequestOptions) => Promise<T>,
  ): Promise<T> {
    const controller = new AbortController();
    controllers.add(controller);
    try {
      return await withDeadline(
        controller,
        () => fn({ signal: controller.signal }),
        timeoutMs,
      );
    } finally {
      controllers.delete(controller);
    }
  }

  function verifySubmission(row: SubmissionModel) {
    if (row.id !== context.submissionId || row.userId !== context.userId) {
      throw new ApiError(200, "INVALID_CONTRACT_DATA", {
        field: "submission",
        reason: "owner_or_id_mismatch",
      });
    }
  }

  function verifyReview(review: AiReviewModel | null) {
    if (review !== null && review.submissionId !== context.submissionId) {
      throw new ApiError(200, "INVALID_CONTRACT_DATA", {
        field: "review.submissionId",
        reason: "submission_mismatch",
      });
    }
  }

  function scheduleNextPoll(gen: number) {
    clearScheduledPoll();
    timer = setTimeout(() => {
      void pollOnce(gen);
    }, intervalMs);
  }

  function handleReviewPayload(review: AiReviewModel | null, gen: number) {
    if (!active || gen !== epoch) return;

    if (review === null || review.shouldPoll) {
      const canContinue = polls < maxPolls;
      publish({
        phase: canContinue ? "polling" : "paused",
        review,
        pollError: null,
        exhausted: !canContinue,
        selectedFindingId: null,
      });
      if (canContinue) {
        scheduleNextPoll(gen);
      }
      return;
    }

    const firstFindingId =
      review.isCompleted && review.findings.length > 0
        ? (review.findings[0]?.id ?? null)
        : null;

    publish({
      phase: "ready",
      review,
      pollError: null,
      exhausted: false,
      selectedFindingId:
        state.selectedFindingId &&
        review.findings.some((item) => item.id === state.selectedFindingId)
          ? state.selectedFindingId
          : firstFindingId,
    });
  }

  function handleReviewFetchError(err: unknown, gen: number) {
    if (!active || gen !== epoch) return;
    if (err instanceof Error && err.name === "AbortError") return;

    if (err instanceof ApiError && err.code === "AI_REVIEW_NOT_ELIGIBLE") {
      publish({
        phase: "ineligible",
        review: null,
        error: null,
        pollError: null,
        exhausted: false,
        selectedFindingId: null,
      });
      return;
    }

    if (
      err instanceof ApiError &&
      (err.status === 401 ||
        err.status === 403 ||
        err.status === 404 ||
        err.code === "INVALID_CONTRACT_DATA")
    ) {
      publish({
        phase: "error",
        error: err,
        pollError: null,
        exhausted: false,
      });
      return;
    }

    // Transient network / 429 / 5xx / timeout while reading AI review keeps the Accepted submission visible.
    publish({
      phase: "paused",
      pollError: err,
      exhausted: false,
    });
  }

  async function pollOnce(gen: number) {
    if (!active || gen !== epoch || inFlight) return;
    inFlight = true;
    try {
      polls += 1;
      const review = await request((opts) =>
        api.judge.getAiReview(context.submissionId, opts),
      );
      verifyReview(review);
      handleReviewPayload(review, gen);
    } catch (err) {
      handleReviewFetchError(err, gen);
    } finally {
      if (gen === epoch) {
        inFlight = false;
      }
    }
  }

  async function start() {
    if (!active) return;
    clearScheduledPoll();
    abortPendingRequests();
    const gen = ++epoch;
    polls = 0;
    inFlight = true;

    publish({
      phase: "loading",
      error: null,
      pollError: null,
      exhausted: false,
      selectedFindingId: null,
    });

    try {
      const submission = await request((opts) =>
        api.judge.getSubmission(context.submissionId, opts),
      );
      if (!active || gen !== epoch) return;
      verifySubmission(submission);

      if (!submission.isAccepted) {
        publish({
          phase: "ineligible",
          submission,
          review: null,
          error: null,
          pollError: null,
          exhausted: false,
          selectedFindingId: null,
        });
        return;
      }

      publish({ submission, error: null });

      const review = await request((opts) =>
        api.judge.getAiReview(context.submissionId, opts),
      );
      if (!active || gen !== epoch) return;
      verifyReview(review);
      handleReviewPayload(review, gen);
    } catch (err) {
      if (!active || gen !== epoch) return;
      if (err instanceof Error && err.name === "AbortError") return;

      if (state.submission && state.submission.isAccepted) {
        handleReviewFetchError(err, gen);
        return;
      }

      publish({
        phase: "error",
        submission: null,
        review: null,
        error: err,
        pollError: null,
        exhausted: false,
        selectedFindingId: null,
      });
    } finally {
      if (gen === epoch) {
        inFlight = false;
      }
    }
  }

  function pause() {
    if (!active || state.phase !== "polling") return;
    epoch += 1;
    inFlight = false;
    clearScheduledPoll();
    abortPendingRequests();
    publish({
      phase: "paused",
      exhausted: false,
    });
  }

  async function resume() {
    if (!active) return;
    if (!state.submission || state.phase === "error") {
      await start();
      return;
    }
    if (!state.submission.isAccepted) return;

    clearScheduledPoll();
    abortPendingRequests();
    const gen = ++epoch;
    polls = 0;
    inFlight = false;
    publish({
      phase: "polling",
      pollError: null,
      exhausted: false,
    });
    await pollOnce(gen);
  }

  async function retryRead() {
    await resume();
  }

  function selectFinding(findingId: string | null) {
    if (!active) return;
    publish({ selectedFindingId: findingId });
  }

  function activate() {
    active = true;
  }

  function dispose() {
    active = false;
    epoch += 1;
    inFlight = false;
    clearScheduledPoll();
    abortPendingRequests();
    state = { ...INITIAL_AI_REVIEW_STATE };
  }

  return {
    context,
    getSnapshot: () => state,
    getServerSnapshot: () => INITIAL_AI_REVIEW_STATE,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    activate,
    start,
    pause,
    resume,
    retryRead,
    selectFinding,
    dispose,
  };
}

export type AiReviewController = ReturnType<typeof createAiReviewController>;
