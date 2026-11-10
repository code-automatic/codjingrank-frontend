import type {
  CodeTemplateModel,
  LanguageModel,
  ProblemDetailModel,
} from "@/lib/api/adapters/catalog";
import { ApiError, type RequestOptions } from "@/lib/api/client";
import { assertSlugParam } from "@/lib/api/domains/preflight";
import { isUuid } from "@/lib/api/guards";
import type { DraftStore } from "./draft-store";

export type WorkspaceCatalogApi = {
  getProblem(
    slug: string,
    options?: RequestOptions,
  ): Promise<ProblemDetailModel>;
  getTemplate(
    slug: string,
    languageId: string,
    options?: RequestOptions,
  ): Promise<CodeTemplateModel>;
};

export type WorkspaceErrorKind =
  | "locked"
  | "not_found"
  | "invalid"
  | "generic";

export type WorkspacePhase = "loading" | "ready" | "error";
export type TemplatePhase = "idle" | "loading" | "ready" | "error";

export type DraftSaveState =
  | "idle"
  | "saving"
  | "saved"
  | "starter"
  | "error"
  | "unavailable";

export type WorkspaceSnapshot = {
  phase: WorkspacePhase;
  problem: ProblemDetailModel | null;
  problemError: unknown;
  errorKind: WorkspaceErrorKind | null;
  languages: LanguageModel[];
  selectedLanguageId: string | null;
  templatePhase: TemplatePhase;
  templateError: unknown;
  starterCode: string;
  code: string;
  fileName: string;
  draftRestored: boolean;
  savedAt: number | null;
  saveState: DraftSaveState;
  draftAvailable: boolean;
};

export type WorkspaceController = {
  getSnapshot(): WorkspaceSnapshot;
  getServerSnapshot(): WorkspaceSnapshot;
  subscribe(listener: () => void): () => void;
  open(slug: string): Promise<void>;
  selectLanguage(languageId: string): Promise<void>;
  changeCode(code: string): void;
  resetStarter(): void;
  retryTemplate(): Promise<void>;
  flushDraft(): void;
  dispose(): void;
};

export type WorkspaceControllerDeps = {
  catalog: WorkspaceCatalogApi;
  drafts: DraftStore;
  now?: () => number;
  debounceMs?: number;
};

function createInitial(draftAvailable: boolean): WorkspaceSnapshot {
  return {
    phase: "loading",
    problem: null,
    problemError: null,
    errorKind: null,
    languages: [],
    selectedLanguageId: null,
    templatePhase: "idle",
    templateError: null,
    starterCode: "",
    code: "",
    fileName: "",
    draftRestored: false,
    savedAt: null,
    saveState: draftAvailable ? "idle" : "unavailable",
    draftAvailable,
  };
}

const SERVER_SNAPSHOT = createInitial(false);

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as { name?: unknown }).name === "AbortError";
}

function classifyProblemError(error: unknown): WorkspaceErrorKind {
  if (error instanceof ApiError) {
    if (error.status === 403 && error.code === "LEVEL_LOCKED") return "locked";
    if (error.status === 404) return "not_found";
    if (error.status === 400 && error.code === "VALIDATION_ERROR")
      return "invalid";
  }
  return "generic";
}

function templateIdentityError(): ApiError {
  return new ApiError(200, "INVALID_CONTRACT_DATA", {
    field: "codeTemplate",
    reason: "template_does_not_match_problem_language",
  });
}

export function createWorkspaceController(
  deps: WorkspaceControllerDeps,
): WorkspaceController {
  const { catalog, drafts } = deps;
  const now = deps.now ?? Date.now;
  const debounceMs = deps.debounceMs ?? 500;

  let state = createInitial(drafts.available);
  const listeners = new Set<() => void>();
  let problemEpoch = 0;
  let templateEpoch = 0;
  let problemAbort: AbortController | undefined;
  let templateAbort: AbortController | undefined;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  const patch = (next: Partial<WorkspaceSnapshot>) => {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  };

  const cancelScheduledSave = () => {
    if (saveTimer !== undefined) {
      clearTimeout(saveTimer);
      saveTimer = undefined;
    }
  };

  const flushDraft = () => {
    cancelScheduledSave();
    const problem = state.problem;
    const languageId = state.selectedLanguageId;
    if (!problem || !languageId || state.templatePhase !== "ready") return;

    if (!state.draftAvailable) {
      patch({ saveState: "unavailable" });
      return;
    }

    if (state.code === state.starterCode) {
      drafts.remove(problem.problem.id, languageId);
      patch({ saveState: "starter", savedAt: null });
      return;
    }

    const savedAt = now();
    const written = drafts.write(problem.problem.id, languageId, {
      code: state.code,
      savedAt,
    });
    patch({
      saveState: written ? "saved" : "error",
      savedAt: written ? savedAt : state.savedAt,
    });
  };

  const scheduleSave = () => {
    cancelScheduledSave();
    if (!state.draftAvailable) return;
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      flushDraft();
    }, debounceMs);
  };

  const loadTemplate = async (
    problem: ProblemDetailModel,
    language: LanguageModel,
  ): Promise<void> => {
    const requestId = ++templateEpoch;
    templateAbort?.abort();
    const abort = new AbortController();
    templateAbort = abort;

    cancelScheduledSave();
    patch({
      templatePhase: "loading",
      templateError: null,
      starterCode: "",
      code: "",
      fileName: "",
      draftRestored: false,
      savedAt: null,
      saveState: state.draftAvailable ? "idle" : "unavailable",
    });

    try {
      const template = await catalog.getTemplate(
        problem.problem.slug,
        language.id,
        { signal: abort.signal },
      );
      if (requestId !== templateEpoch) return;
      if (
        template.problemId !== problem.problem.id ||
        template.languageId !== language.id
      ) {
        throw templateIdentityError();
      }

      const draft = drafts.read(problem.problem.id, language.id);
      patch({
        templatePhase: "ready",
        starterCode: template.starterCode,
        fileName: template.fileName,
        code: draft ? draft.code : template.starterCode,
        draftRestored: Boolean(draft),
        savedAt: draft ? draft.savedAt : null,
        saveState: draft
          ? "saved"
          : state.draftAvailable
            ? "idle"
            : "unavailable",
      });
    } catch (error) {
      if (requestId !== templateEpoch || isAbortError(error)) return;
      patch({
        templatePhase: "error",
        templateError: error,
        starterCode: "",
        code: "",
        fileName: "",
        draftRestored: false,
        savedAt: null,
      });
    }
  };

  const open = async (slug: string): Promise<void> => {
    flushDraft();
    problemEpoch += 1;
    templateEpoch += 1;
    problemAbort?.abort();
    templateAbort?.abort();
    problemAbort = undefined;
    templateAbort = undefined;
    patch(createInitial(drafts.available));

    let cleanSlug: string;
    try {
      cleanSlug = assertSlugParam(slug);
    } catch (error) {
      patch({
        phase: "error",
        problemError: error,
        errorKind: "invalid",
      });
      return;
    }

    const requestId = problemEpoch;
    const abort = new AbortController();
    problemAbort = abort;

    try {
      const problem = await catalog.getProblem(cleanSlug, {
        signal: abort.signal,
      });
      if (requestId !== problemEpoch) return;

      if (problem.languages.length === 0) {
        throw new ApiError(200, "INVALID_CONTRACT_DATA", {
          field: "problem.languages",
          reason: "problem_has_no_supported_language",
        });
      }

      const preferred = drafts.readPreferredLanguage(problem.problem.id);
      const selected =
        problem.languages.find((language) => language.id === preferred) ??
        problem.languages[0];
      drafts.writePreferredLanguage(problem.problem.id, selected.id);

      patch({
        phase: "ready",
        problem,
        problemError: null,
        errorKind: null,
        languages: problem.languages,
        selectedLanguageId: selected.id,
        templatePhase: "loading",
      });
      await loadTemplate(problem, selected);
    } catch (error) {
      if (requestId !== problemEpoch || isAbortError(error)) return;
      patch({
        phase: "error",
        problemError: error,
        errorKind: classifyProblemError(error),
      });
    }
  };

  const selectLanguage = async (languageId: string): Promise<void> => {
    if (!isUuid(languageId)) return;
    if (state.phase !== "ready" || !state.problem) return;
    if (state.selectedLanguageId === languageId) return;

    const language = state.languages.find((item) => item.id === languageId);
    if (!language) return;

    flushDraft();
    drafts.writePreferredLanguage(state.problem.problem.id, language.id);
    patch({ selectedLanguageId: language.id });
    await loadTemplate(state.problem, language);
  };

  const changeCode = (code: string) => {
    if (state.templatePhase !== "ready") return;
    if (typeof code !== "string" || code === state.code) return;
    patch({
      code,
      saveState: state.draftAvailable ? "saving" : "unavailable",
    });
    scheduleSave();
  };

  const resetStarter = () => {
    if (state.templatePhase !== "ready" || !state.problem) return;
    const languageId = state.selectedLanguageId;
    cancelScheduledSave();
    if (languageId) drafts.remove(state.problem.problem.id, languageId);
    patch({
      code: state.starterCode,
      draftRestored: false,
      savedAt: null,
      saveState: state.draftAvailable ? "starter" : "unavailable",
    });
  };

  const retryTemplate = async (): Promise<void> => {
    if (state.templatePhase !== "error" || !state.problem) return;
    const language = state.languages.find(
      (item) => item.id === state.selectedLanguageId,
    );
    if (!language) return;
    await loadTemplate(state.problem, language);
  };

  const dispose = () => {
    flushDraft();
    cancelScheduledSave();
    problemEpoch += 1;
    templateEpoch += 1;
    problemAbort?.abort();
    templateAbort?.abort();
    problemAbort = undefined;
    templateAbort = undefined;
  };

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => SERVER_SNAPSHOT,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    open,
    selectLanguage,
    changeCode,
    resetStarter,
    retryTemplate,
    flushDraft,
    dispose,
  };
}
