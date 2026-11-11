import type { ApiClient, ExecuteRequest, PaginatedData } from "@/lib/api";
import type { PackageDetailModel } from "@/lib/api/adapters/catalog";
import type {
  SubmissionModel,
  SubmissionSummaryModel,
} from "@/lib/api/adapters/judge";
import { ApiError, type RequestOptions } from "@/lib/api/client";
import { withDeadline } from "@/lib/api/deadline";
import { assertExecutePayload } from "@/lib/api/domains/preflight";

export type SubmissionState = {
  phase: "idle" | "submitting" | "polling" | "paused" | "terminal";
  submission: SubmissionModel | null;
  error: unknown;
  uncertain: boolean;
  cooldownUntil: number;
  history: PaginatedData<SubmissionSummaryModel> | null;
  historyLoading: boolean;
  historyError: unknown;
  progress: PackageDetailModel | null;
  progressLoading: boolean;
  progressError: unknown;
  unlockedLevels: number[];
  initialized: boolean;
};

type Context = { userId: string; problemId: string; packageSlug: string };
export function createSubmissionController(
  api: Pick<ApiClient, "judge" | "catalog">,
  context: Context,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
    maxPolls?: number;
    now?: () => number;
  } = {},
) {
  const initial: SubmissionState = {
    phase: "idle",
    submission: null,
    error: null,
    uncertain: false,
    cooldownUntil: 0,
    history: null,
    historyLoading: false,
    historyError: null,
    progress: null,
    progressLoading: false,
    progressError: null,
    unlockedLevels: [],
    initialized: false,
  };
  let state = initial;
  const listeners = new Set<() => void>();
  const now = options.now ?? Date.now;
  const controllers = new Set<AbortController>();
  let active = true,
    epoch = 0,
    historyGen = 0,
    progressGen = 0,
    polls = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let tracking = false;
  let viewAbort: AbortController | undefined;
  let acceptedProgressId: string | undefined;
  let baselineLevels: PackageDetailModel["levels"] | undefined;

  function publish(patch: Partial<SubmissionState>) {
    if (!active) return;
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }
  async function request<T>(
    fn: (options: RequestOptions) => Promise<T>,
    controller = new AbortController(),
  ) {
    controllers.add(controller);
    try {
      return await withDeadline(
        controller,
        () => fn({ signal: controller.signal }),
        options.timeoutMs ?? 15_000,
      );
    } finally {
      controllers.delete(controller);
    }
  }
  function verify(row: SubmissionSummaryModel, id?: string) {
    if (
      row.userId !== context.userId ||
      row.problemId !== context.problemId ||
      (id && row.id !== id)
    )
      throw new ApiError(200, "INVALID_CONTRACT_DATA");
  }
  function cancelTracking() {
    epoch++;
    clearTimeout(timer);
    viewAbort?.abort();
    tracking = false;
  }
  async function loadHistory(page = 1) {
    const gen = ++historyGen;
    publish({ historyLoading: true, historyError: null, history: null });
    try {
      const result = await request((opts) =>
        api.judge.listMySubmissions(
          { problemId: context.problemId, page, size: 10 },
          opts,
        ),
      );
      result.items.forEach((row) => verify(row));
      if (!active || gen !== historyGen) return;
      publish({ history: result, historyLoading: false });
    } catch (error) {
      if (active && gen === historyGen)
        publish({ historyLoading: false, historyError: error });
    }
  }
  async function loadProgress() {
    const gen = ++progressGen;
    publish({ progressLoading: true, progressError: null });
    try {
      const result = await request((opts) =>
        api.catalog.getPackageLevels(context.packageSlug, opts),
      );
      if (result.package.slug !== context.packageSlug)
        throw new ApiError(200, "INVALID_CONTRACT_DATA");
      if (!active || gen !== progressGen) return;
      const unlockedLevels = baselineLevels
        ? result.levels
            .filter(
              (level) =>
                level.unlocked &&
                baselineLevels!.some(
                  (old) =>
                    old.levelNo === level.levelNo &&
                    old.id === level.id &&
                    !old.unlocked,
                ),
            )
            .map((level) => level.levelNo)
        : [];
      baselineLevels = result.levels;
      publish({ progress: result, progressLoading: false, unlockedLevels });
    } catch (error) {
      if (active && gen === progressGen)
        publish({ progressLoading: false, progressError: error });
    }
  }
  function receive(row: SubmissionModel, gen: number) {
    if (!active || gen !== epoch) return;
    publish({
      submission: row,
      phase: row.shouldPoll ? "polling" : "terminal",
      error: null,
    });
    if (!row.shouldPoll) {
      void loadHistory();
      if (row.isAccepted && acceptedProgressId !== row.id) {
        acceptedProgressId = row.id;
        void loadProgress(); // Verdict is already visible; progress/AI never block it.
      }
      return;
    }
    if (polls >= (options.maxPolls ?? 80)) {
      publish({ phase: "paused" });
      return;
    }
    timer = setTimeout(
      () => void poll(row.id, gen),
      options.intervalMs ?? 1500,
    );
  }
  async function poll(id: string, gen: number) {
    if (!active || gen !== epoch) return;
    const controller = new AbortController();
    viewAbort = controller;
    try {
      polls++;
      const row = await request(
        (opts) => api.judge.getSubmission(id, opts),
        controller,
      );
      verify(row, id);
      receive(row, gen);
    } catch (error) {
      if (active && gen === epoch) publish({ phase: "paused", error });
    }
  }
  async function select(id: string) {
    if (!active || !state.initialized || state.phase === "submitting") return;
    cancelTracking();
    polls = 0;
    const gen = epoch;
    publish({ phase: "polling", submission: null, error: null });
    await poll(id, gen);
  }
  async function reconcile() {
    if (!active || tracking || state.phase === "submitting") return;
    cancelTracking();
    polls = 0;
    tracking = true;
    const gen = epoch;
    const controller = new AbortController();
    viewAbort = controller;
    publish({ error: null, phase: "polling" });
    try {
      const latest = await request(
        (opts) =>
          api.judge.getLatestSubmission(context.problemId, undefined, opts),
        controller,
      );
      if (!active || gen !== epoch) return;
      if (latest) {
        verify(latest);
        publish({ uncertain: false });
        receive(latest, gen);
      } else publish({ phase: "idle", submission: null, uncertain: false });
    } catch (error) {
      if (active && gen === epoch)
        publish({ phase: "paused", error, uncertain: true });
    } finally {
      if (active && gen === epoch) {
        tracking = false;
        publish({ initialized: true });
      }
    }
  }
  async function submit(payload: ExecuteRequest) {
    if (
      !active ||
      !state.initialized ||
      tracking ||
      state.uncertain ||
      state.phase === "submitting" ||
      state.phase === "polling" ||
      (state.submission?.shouldPoll && state.phase === "paused") ||
      now() < state.cooldownUntil
    )
      return;
    try {
      assertExecutePayload(payload);
      if (payload.problemId !== context.problemId)
        throw new ApiError(400, "VALIDATION_ERROR");
    } catch (error) {
      publish({ error });
      return;
    }
    cancelTracking();
    polls = 0;
    const gen = epoch;
    publish({
      phase: "submitting",
      submission: null,
      error: null,
      unlockedLevels: [],
      cooldownUntil: now() + 10_000,
    });
    try {
      const row = await request((opts) =>
        api.judge.submitCode({ ...payload }, opts),
      );
      verify(row);
      if (row.languageId !== payload.languageId)
        throw new ApiError(200, "INVALID_CONTRACT_DATA");
      receive(row, gen);
    } catch (error) {
      if (!active || gen !== epoch) return;
      // POST may have committed even when its response is lost. Never auto-resend.
      const uncertain =
        !(error instanceof ApiError) ||
        error.status === 0 ||
        error.status >= 500 ||
        error.code === "INVALID_CONTRACT_DATA";
      const retry =
        error instanceof ApiError && error.status === 429
          ? (error.retryAfterSec ?? 10)
          : 10;
      publish({
        phase: "paused",
        error,
        uncertain,
        cooldownUntil: now() + Math.min(86_400, Math.max(1, retry)) * 1000,
      });
    }
  }
  async function start() {
    active = true;
    await Promise.all([reconcile(), loadHistory(), loadProgress()]);
  }
  function dispose() {
    cancelTracking();
    active = false;
    historyGen++;
    progressGen++;
    controllers.forEach((controller) => controller.abort());
    controllers.clear();
    state = { ...initial };
    baselineLevels = undefined;
    acceptedProgressId = undefined;
  }
  return {
    getSnapshot: () => state,
    getServerSnapshot: () => initial,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start,
    submit,
    select,
    reconcile,
    loadHistory,
    loadProgress,
    resume() {
      if (state.initialized && state.submission?.shouldPoll)
        void select(state.submission.id);
      else void reconcile();
    },
    pause() {
      if (state.phase !== "polling") return;
      cancelTracking();
      publish({ phase: "paused" });
    },
    dispose,
  };
}
