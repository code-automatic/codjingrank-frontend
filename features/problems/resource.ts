import { ApiError } from "@/lib/api/client";
import type {
  ApiClient,
  CodeTemplateModel,
  ProblemDetailModel,
} from "@/lib/api";

export type ProblemState = {
  status: "loading" | "ready" | "error";
  detail: ProblemDetailModel | null;
  error: unknown;
  languageId: string;
  templateStatus: "idle" | "loading" | "ready" | "error";
  template: CodeTemplateModel | null;
  templateError: unknown;
};

// One resource per mounted problem/user. No persistent or shared user cache.
export function createProblemResource(
  api: Pick<ApiClient, "catalog">,
  slug: string,
) {
  let state: ProblemState = {
    status: "loading",
    detail: null,
    error: null,
    languageId: "",
    templateStatus: "idle",
    template: null,
    templateError: null,
  };
  const initial = state;
  const listeners = new Set<() => void>();
  let generation = 0;
  let templateRevision = 0;
  let detailAbort: AbortController | undefined;
  let templateAbort: AbortController | undefined;
  function publish(patch: Partial<ProblemState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }
  function cancel() {
    generation++;
    templateRevision++;
    detailAbort?.abort();
    templateAbort?.abort();
  }
  function failClosed(error: unknown) {
    return (
      error instanceof ApiError &&
      (error.status === 401 ||
        (error.status === 403 && error.code === "LEVEL_LOCKED"))
    );
  }
  async function selectLanguage(languageId: string) {
    const detail = state.detail;
    if (
      !detail ||
      !detail.languages.some((language) => language.id === languageId)
    )
      return;
    templateAbort?.abort();
    const controller = new AbortController();
    templateAbort = controller;
    const revision = ++templateRevision;
    const epoch = generation;
    publish({
      languageId,
      templateStatus: "loading",
      template: null,
      templateError: null,
    });
    try {
      const template = await api.catalog.getTemplate(slug, languageId, {
        signal: controller.signal,
      });
      if (
        controller.signal.aborted ||
        epoch !== generation ||
        revision !== templateRevision
      )
        return;
      if (
        template.problemId !== detail.problem.id ||
        template.languageId !== languageId
      ) {
        throw new ApiError(200, "INVALID_CONTRACT_DATA");
      }
      publish({ templateStatus: "ready", template });
    } catch (error) {
      if (
        controller.signal.aborted ||
        epoch !== generation ||
        revision !== templateRevision
      )
        return;
      if (failClosed(error)) {
        publish({ ...initial, status: "error", error });
      } else {
        publish({
          templateStatus: "error",
          templateError: error,
          template: null,
        });
      }
    }
  }
  async function load() {
    cancel();
    const epoch = generation;
    const controller = new AbortController();
    detailAbort = controller;
    publish(initial);
    try {
      const detail = await api.catalog.getProblem(slug, {
        signal: controller.signal,
      });
      if (controller.signal.aborted || epoch !== generation) return;
      if (detail.problem.slug !== slug)
        throw new ApiError(200, "INVALID_CONTRACT_DATA");
      if (!detail.problem.unlocked) throw new ApiError(403, "LEVEL_LOCKED");
      publish({ status: "ready", detail });
      const language = detail.languages[0];
      if (language) await selectLanguage(language.id);
    } catch (error) {
      if (controller.signal.aborted || epoch !== generation) return;
      publish({ ...initial, status: "error", error });
    }
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
    load,
    selectLanguage,
    cancel,
  };
}
