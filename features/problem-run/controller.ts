import type { ApiClient, ExecuteRequest, RunDataModel } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { withDeadline } from "@/lib/api/deadline";
import { assertExecutePayload } from "@/lib/api/domains/preflight";
import { isAbortError, validateCodeBeforeRun } from "./runModel";

export type RunPhase = "idle" | "running" | "completed" | "cancelled" | "error";

export type RunState = {
  phase: RunPhase;
  result: RunDataModel | null;
  resultLanguageId: string | null;
  resultCode: string | null;
  error: unknown;
  validationMessage: string | null;
  notice: string | null;
};

type RunContext = {
  userId: string;
  problemId: string;
};

export type RunControllerOptions = {
  timeoutMs?: number;
};

const INITIAL_RUN_STATE: RunState = {
  phase: "idle",
  result: null,
  resultLanguageId: null,
  resultCode: null,
  error: null,
  validationMessage: null,
  notice: null,
};

export function createRunController(
  api: Pick<ApiClient, "judge">,
  context: RunContext,
  options: RunControllerOptions = {},
) {
  let state: RunState = { ...INITIAL_RUN_STATE };
  const listeners = new Set<() => void>();
  let active = true;
  let epoch = 0;
  let cancelRequested = false;
  let activeAbort: AbortController | undefined;
  let trackedLanguageId: string | null = null;

  function publish(patch: Partial<RunState>) {
    if (!active) return;
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }

  async function run(payload: ExecuteRequest): Promise<void> {
    if (!active || state.phase === "running") return;

    const precheck = validateCodeBeforeRun(payload.code);
    try {
      if (payload.problemId !== context.problemId) {
        throw new ApiError(400, "VALIDATION_ERROR", { field: "problemId" });
      }
      if (!precheck.ok) {
        throw new ApiError(
          payload.code.trim().length === 0 ? 400 : 413,
          payload.code.trim().length === 0
            ? "VALIDATION_ERROR"
            : "REQUEST_TOO_LARGE",
          { field: "code" },
        );
      }
      assertExecutePayload(payload);
    } catch (error) {
      publish({
        phase: "error",
        result: null,
        resultLanguageId: null,
        resultCode: null,
        error,
        validationMessage: precheck.ok ? null : precheck.message,
        notice: null,
      });
      return;
    }

    trackedLanguageId = payload.languageId;
    const gen = ++epoch;
    const abort = new AbortController();
    activeAbort = abort;
    cancelRequested = false;

    const snapshotCode = payload.code;
    const snapshotLanguageId = payload.languageId;

    publish({
      phase: "running",
      result: null,
      resultLanguageId: null,
      resultCode: null,
      error: null,
      validationMessage: null,
      notice: null,
    });

    try {
      const data = await withDeadline(
        abort,
        () =>
          api.judge.runSamples(
            {
              problemId: payload.problemId,
              languageId: snapshotLanguageId,
              code: snapshotCode,
            },
            { signal: abort.signal },
          ),
        options.timeoutMs ?? 15_000,
      );
      if (!active || gen !== epoch || cancelRequested) return;
      if (
        trackedLanguageId !== null &&
        trackedLanguageId !== snapshotLanguageId
      ) {
        return;
      }
      publish({
        phase: "completed",
        result: data,
        resultLanguageId: snapshotLanguageId,
        resultCode: snapshotCode,
        error: null,
        validationMessage: null,
        notice: null,
      });
    } catch (error) {
      if (!active || gen !== epoch) return;
      if (cancelRequested || isAbortError(error)) return;
      publish({
        phase: "error",
        result: null,
        resultLanguageId: null,
        resultCode: null,
        error,
        validationMessage: null,
        notice: null,
      });
    } finally {
      if (activeAbort === abort) {
        activeAbort = undefined;
      }
    }
  }

  function cancel() {
    if (!active || state.phase !== "running") return;
    cancelRequested = true;
    epoch += 1;
    const controller = activeAbort;
    activeAbort = undefined;
    controller?.abort();
    publish({
      phase: "cancelled",
      result: null,
      resultLanguageId: null,
      resultCode: null,
      error: null,
      validationMessage: null,
      notice: "Đã hủy lượt chạy thử mẫu.",
    });
  }

  function syncLanguage(languageId: string | null) {
    if (!active) return;
    if (trackedLanguageId === null) {
      trackedLanguageId = languageId;
      return;
    }
    if (languageId === trackedLanguageId) return;

    const wasRunning = state.phase === "running";
    const hadFeedback = Boolean(
      wasRunning || state.result || state.error || state.notice,
    );
    trackedLanguageId = languageId;
    epoch += 1;

    if (wasRunning) {
      cancelRequested = true;
      const controller = activeAbort;
      activeAbort = undefined;
      controller?.abort();
    }

    if (!hadFeedback) return;

    publish({
      phase: "idle",
      result: null,
      resultLanguageId: null,
      resultCode: null,
      error: null,
      validationMessage: null,
      notice: wasRunning
        ? "Đã dừng lượt chạy trước vì bạn vừa đổi ngôn ngữ."
        : "Đã đổi ngôn ngữ — bấm «▶ Chạy thử mẫu» để kiểm tra trên ngôn ngữ mới.",
    });
  }

  function syncCode(code: string) {
    if (!active) return;
    if (
      state.phase === "error" &&
      state.validationMessage !== null &&
      validateCodeBeforeRun(code).ok
    ) {
      publish({
        phase: "idle",
        error: null,
        validationMessage: null,
      });
    }
  }

  function activate() {
    active = true;
  }

  function dispose() {
    active = false;
    epoch += 1;
    cancelRequested = true;
    activeAbort?.abort();
    activeAbort = undefined;
    trackedLanguageId = null;
    state = { ...INITIAL_RUN_STATE };
  }

  return {
    context,
    getSnapshot: () => state,
    getServerSnapshot: () => INITIAL_RUN_STATE,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    activate,
    run,
    cancel,
    syncLanguage,
    syncCode,
    dispose,
  };
}

export type RunController = ReturnType<typeof createRunController>;
