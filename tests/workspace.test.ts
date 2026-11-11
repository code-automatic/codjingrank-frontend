import { describe, expect, it, vi } from "vitest";
import type {
  CodeTemplateModel,
  LanguageModel,
  ProblemDetailModel,
} from "@/lib/api/adapters/catalog";
import { ApiError } from "@/lib/api/client";
import {
  createDraftStore,
  type DraftStore,
  type KeyValueStorage,
} from "@/features/editor/draft-store";
import {
  createWorkspaceController,
  type WorkspaceCatalogApi,
} from "@/features/editor/workspace";

const PROBLEM_ID = "11111111-1111-4111-8111-111111111111";
const PACKAGE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const LEVEL_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PYTHON_ID = "22222222-2222-4222-8222-222222222222";
const CPP_ID = "33333333-3333-4333-8333-333333333333";

const STARTERS: Record<string, { code: string; fileName: string }> = {
  [PYTHON_ID]: { code: "print('py')", fileName: "main.py" },
  [CPP_ID]: { code: "int main() {}", fileName: "main.cpp" },
};

function language(id: string, slug: string, name: string): LanguageModel {
  return {
    id,
    slug,
    name,
    runtimeVersion: "1.0",
    fileExtension: slug === "python3" ? ".py" : ".cpp",
    displayLabel: `${name} (1.0)`,
  };
}

function makeProblem(
  languages = [
    language(PYTHON_ID, "python3", "Python 3"),
    language(CPP_ID, "cpp", "C++"),
  ],
): ProblemDetailModel {
  return {
    problem: {
      id: PROBLEM_ID,
      slug: "sum-two",
      title: "Sum two numbers",
      packageId: PACKAGE_ID,
      packageSlug: "arrays",
      levelId: LEVEL_ID,
      difficulty: "easy",
      tags: [],
      solved: false,
      unlocked: true,
      acceptanceRate: 50,
      canOpen: true,
      formattedAcceptanceRate: "50%",
    },
    statementMd: "Read two integers and print their sum.",
    executionMode: "stdin_stdout",
    functionName: null,
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    outputLimitBytes: 1_048_576,
    sampleTestCases: [],
    languages,
    isFunctionMode: false,
    hasSamples: false,
  };
}

function makeTemplate(languageId: string): CodeTemplateModel {
  const starter = STARTERS[languageId] ?? {
    code: "// starter",
    fileName: "main.txt",
  };
  return {
    problemId: PROBLEM_ID,
    languageId,
    starterCode: starter.code,
    fileName: starter.fileName,
  };
}

type CatalogCalls = {
  problems: string[];
  templates: string[];
};

function fakeCatalog(
  handlers: {
    problem?: (slug: string) => Promise<ProblemDetailModel>;
    template?: (slug: string, languageId: string) => Promise<CodeTemplateModel>;
  } = {},
): WorkspaceCatalogApi & { calls: CatalogCalls } {
  const calls: CatalogCalls = { problems: [], templates: [] };
  return {
    calls,
    async getProblem(slug) {
      calls.problems.push(slug);
      if (handlers.problem) return handlers.problem(slug);
      return makeProblem();
    },
    async getTemplate(slug, languageId) {
      calls.templates.push(languageId);
      if (handlers.template) return handlers.template(slug, languageId);
      return makeTemplate(languageId);
    },
  };
}

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error("Timed out waiting for condition");
}

function makeController(
  catalog: WorkspaceCatalogApi,
  drafts: DraftStore,
  now = 1_000,
) {
  return createWorkspaceController({
    catalog,
    drafts,
    now: () => now,
    debounceMs: 5,
  });
}

describe("problem workspace controller", () => {
  it("reset cancels a pending autosave and reports failed removal", async () => {
    vi.useFakeTimers();
    const drafts = createDraftStore(memoryStorage());
    const controller = makeController(fakeCatalog(), drafts);
    try {
      await controller.open("sum-two");
      controller.changeCode("must not return");
      controller.resetStarter();
      await vi.advanceTimersByTimeAsync(10);
      expect(drafts.read(PROBLEM_ID, PYTHON_ID)).toBeNull();
      expect(controller.getSnapshot().code).toBe("print('py')");
      vi.spyOn(drafts, "remove").mockReturnValue(false);
      controller.changeCode("custom");
      controller.resetStarter();
      expect(controller.getSnapshot().saveState).toBe("error");
    } finally {
      controller.dispose();
      vi.useRealTimers();
    }
  });
  it("retains per-language edits in memory when storage is unavailable", async () => {
    const controller = makeController(fakeCatalog(), createDraftStore(null));
    try {
      await controller.open("sum-two");
      controller.changeCode("private unsaved python");
      await controller.selectLanguage(CPP_ID);
      controller.changeCode("private unsaved cpp");
      await controller.selectLanguage(PYTHON_ID);
      expect(controller.getSnapshot().code).toBe("private unsaved python");
      expect(controller.getSnapshot().saveState).toBe("unavailable");
      controller.resetStarter();
      await controller.selectLanguage(CPP_ID);
      expect(controller.getSnapshot().code).toBe("private unsaved cpp");
      await controller.selectLanguage(PYTHON_ID);
      expect(controller.getSnapshot().code).toBe("print('py')");
    } finally {
      controller.dispose();
    }
  });

  it("writes a dirty draft once and avoids saving unchanged code on pagehide/dispose", async () => {
    const drafts = createDraftStore(memoryStorage());
    const write = vi.spyOn(drafts, "write");
    const controller = makeController(fakeCatalog(), drafts);
    await controller.open("sum-two");
    controller.changeCode("custom");
    controller.flushDraft();
    controller.flushDraft();
    controller.dispose();
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("does not save pending edits or accept late templates after session disposal", async () => {
    const late = deferred<CodeTemplateModel>();
    const catalog = fakeCatalog({
      template: async (_slug, id) =>
        id === CPP_ID ? late.promise : makeTemplate(id),
    });
    const drafts = createDraftStore(memoryStorage());
    const controller = makeController(catalog, drafts);
    await controller.open("sum-two");
    controller.changeCode("secret edit");
    controller.dispose(false);
    controller.flushDraft();
    expect(drafts.read(PROBLEM_ID, PYTHON_ID)).toBeNull();
    await controller.open("sum-two");
    const switching = controller.selectLanguage(CPP_ID);
    controller.dispose(false);
    late.resolve(makeTemplate(CPP_ID));
    await switching;
    expect(controller.getSnapshot()).toMatchObject({
      problem: null,
      code: "",
      starterCode: "",
    });
  });

  it.each(["detail", "template"])(
    "bounds a hanging %s request and allows retry",
    async (target) => {
      vi.useFakeTimers();
      let hanging = true;
      const controller = createWorkspaceController({
        drafts: createDraftStore(null),
        timeoutMs: 50,
        catalog: fakeCatalog({
          problem: () =>
            target === "detail" && hanging
              ? new Promise(() => {})
              : Promise.resolve(makeProblem()),
          template: (_slug, id) =>
            target === "template" && hanging
              ? new Promise(() => {})
              : Promise.resolve(makeTemplate(id)),
        }),
      });
      try {
        const opening = controller.open("sum-two");
        await vi.advanceTimersByTimeAsync(51);
        await opening;
        const snapshot = controller.getSnapshot();
        expect(
          target === "detail" ? snapshot.problemError : snapshot.templateError,
        ).toMatchObject({ code: "REQUEST_TIMEOUT" });
        hanging = false;
        if (target === "detail") await controller.open("sum-two");
        else await controller.retryTemplate();
        expect(controller.getSnapshot().templatePhase).toBe("ready");
        expect(vi.getTimerCount()).toBe(0);
      } finally {
        controller.dispose();
        vi.useRealTimers();
      }
    },
  );
  it("does not project a successful detail payload for a locked or different problem", async () => {
    for (const change of [{ unlocked: false }, { slug: "another-problem" }]) {
      const problem = makeProblem();
      const catalog = fakeCatalog({
        problem: async () => ({
          ...problem,
          problem: { ...problem.problem, ...change },
        }),
      });
      const controller = makeController(
        catalog,
        createDraftStore(memoryStorage()),
      );
      try {
        await controller.open("sum-two");
        expect(controller.getSnapshot().phase).toBe("error");
        expect(controller.getSnapshot().problem).toBeNull();
        expect(catalog.calls.templates).toHaveLength(0);
      } finally {
        controller.dispose();
      }
    }
  });

  it("removes detail and editor data when template access is revoked", async () => {
    for (const error of [
      new ApiError(401, "UNAUTHORIZED"),
      new ApiError(403, "LEVEL_LOCKED"),
    ]) {
      const catalog = fakeCatalog({
        template: async () => {
          throw error;
        },
      });
      const controller = makeController(
        catalog,
        createDraftStore(memoryStorage()),
      );
      try {
        await controller.open("sum-two");
        expect(controller.getSnapshot()).toMatchObject({
          phase: "error",
          problem: null,
          code: "",
          starterCode: "",
        });
      } finally {
        controller.dispose();
      }
    }
  });
  it("loads the problem and restores a draft for the default language", async () => {
    const catalog = fakeCatalog();
    const drafts = createDraftStore(memoryStorage());
    drafts.write(PROBLEM_ID, PYTHON_ID, {
      code: "print('draft')",
      savedAt: 50,
    });

    const controller = makeController(catalog, drafts);
    try {
      await controller.open("sum-two");

      const snapshot = controller.getSnapshot();
      expect(snapshot.phase).toBe("ready");
      expect(snapshot.problem?.problem.slug).toBe("sum-two");
      expect(snapshot.selectedLanguageId).toBe(PYTHON_ID);
      expect(snapshot.code).toBe("print('draft')");
      expect(snapshot.draftRestored).toBe(true);
      expect(snapshot.savedAt).toBe(50);
      expect(snapshot.fileName).toBe("main.py");
      expect(snapshot.templatePhase).toBe("ready");
      expect(catalog.calls.templates).toEqual([PYTHON_ID]);
      expect(drafts.readPreferredLanguage(PROBLEM_ID)).toBe(PYTHON_ID);
    } finally {
      controller.dispose();
    }
  });

  it("saves per language and restores each draft when switching back", async () => {
    const catalog = fakeCatalog();
    const drafts = createDraftStore(memoryStorage());
    const controller = makeController(catalog, drafts);

    try {
      await controller.open("sum-two");
      expect(controller.getSnapshot().code).toBe("print('py')");

      controller.changeCode("print('saved py')");
      controller.flushDraft();
      expect(drafts.read(PROBLEM_ID, PYTHON_ID)?.code).toBe(
        "print('saved py')",
      );

      await controller.selectLanguage(CPP_ID);
      let snapshot = controller.getSnapshot();
      expect(snapshot.selectedLanguageId).toBe(CPP_ID);
      expect(snapshot.code).toBe("int main() {}");
      expect(snapshot.draftRestored).toBe(false);
      expect(drafts.read(PROBLEM_ID, PYTHON_ID)?.code).toBe(
        "print('saved py')",
      );
      expect(drafts.readPreferredLanguage(PROBLEM_ID)).toBe(CPP_ID);

      controller.changeCode("int main() { return 0; }");
      controller.flushDraft();
      await controller.selectLanguage(PYTHON_ID);

      snapshot = controller.getSnapshot();
      expect(snapshot.code).toBe("print('saved py')");
      expect(snapshot.draftRestored).toBe(true);
      expect(drafts.read(PROBLEM_ID, CPP_ID)?.code).toBe(
        "int main() { return 0; }",
      );
    } finally {
      controller.dispose();
    }
  });

  it("reset removes only the current language draft and restores the starter", async () => {
    const catalog = fakeCatalog();
    const drafts = createDraftStore(memoryStorage());
    drafts.write(PROBLEM_ID, PYTHON_ID, { code: "custom", savedAt: 10 });
    drafts.write(PROBLEM_ID, CPP_ID, { code: "cpp custom", savedAt: 11 });
    const controller = makeController(catalog, drafts);

    try {
      await controller.open("sum-two");
      controller.resetStarter();

      const snapshot = controller.getSnapshot();
      expect(snapshot.code).toBe("print('py')");
      expect(snapshot.draftRestored).toBe(false);
      expect(snapshot.savedAt).toBeNull();
      expect(snapshot.saveState).toBe("starter");
      expect(drafts.read(PROBLEM_ID, PYTHON_ID)).toBeNull();
      expect(drafts.read(PROBLEM_ID, CPP_ID)?.code).toBe("cpp custom");
    } finally {
      controller.dispose();
    }
  });

  it("ignores a slow template response after switching language", async () => {
    const pythonTemplate = deferred<CodeTemplateModel>();
    const cppTemplate = deferred<CodeTemplateModel>();
    const catalog = fakeCatalog({
      template: (_slug, languageId) =>
        languageId === PYTHON_ID ? pythonTemplate.promise : cppTemplate.promise,
    });
    const drafts = createDraftStore(memoryStorage());
    const controller = makeController(catalog, drafts);

    try {
      const opening = controller.open("sum-two");
      await waitFor(() => catalog.calls.templates.length === 1);
      expect(catalog.calls.templates).toEqual([PYTHON_ID]);

      const switching = controller.selectLanguage(CPP_ID);
      await waitFor(() => catalog.calls.templates.length === 2);
      expect(catalog.calls.templates).toEqual([PYTHON_ID, CPP_ID]);

      cppTemplate.resolve(makeTemplate(CPP_ID));
      await switching;
      expect(controller.getSnapshot().code).toBe("int main() {}");

      pythonTemplate.resolve(makeTemplate(PYTHON_ID));
      await opening;

      const snapshot = controller.getSnapshot();
      expect(snapshot.selectedLanguageId).toBe(CPP_ID);
      expect(snapshot.code).toBe("int main() {}");
    } finally {
      controller.dispose();
    }
  });

  it("exposes a template error and retries without losing the problem", async () => {
    let attempts = 0;
    const catalog = fakeCatalog({
      template: async (_slug, languageId) => {
        attempts += 1;
        if (attempts === 1) {
          throw new ApiError(500, "INTERNAL_ERROR");
        }
        return makeTemplate(languageId);
      },
    });
    const controller = makeController(
      catalog,
      createDraftStore(memoryStorage()),
    );

    try {
      await controller.open("sum-two");

      let snapshot = controller.getSnapshot();
      expect(snapshot.phase).toBe("ready");
      expect(snapshot.problem).not.toBeNull();
      expect(snapshot.templatePhase).toBe("error");
      expect(snapshot.code).toBe("");

      await controller.retryTemplate();
      snapshot = controller.getSnapshot();
      expect(snapshot.templatePhase).toBe("ready");
      expect(snapshot.code).toBe("print('py')");
    } finally {
      controller.dispose();
    }
  });

  it("classifies a locked problem without treating it as a generic failure", async () => {
    const catalog = fakeCatalog({
      problem: async () => {
        throw new ApiError(403, "LEVEL_LOCKED");
      },
    });
    const controller = makeController(
      catalog,
      createDraftStore(memoryStorage()),
    );

    try {
      await controller.open("sum-two");

      const snapshot = controller.getSnapshot();
      expect(snapshot.phase).toBe("error");
      expect(snapshot.errorKind).toBe("locked");
      expect(snapshot.problem).toBeNull();
      expect(catalog.calls.templates).toEqual([]);
    } finally {
      controller.dispose();
    }
  });

  it("rejects a malformed slug before making a request", async () => {
    const catalog = fakeCatalog();
    const controller = makeController(
      catalog,
      createDraftStore(memoryStorage()),
    );

    try {
      await controller.open("Not A Slug");
      const snapshot = controller.getSnapshot();
      expect(snapshot.phase).toBe("error");
      expect(snapshot.errorKind).toBe("invalid");
      expect(catalog.calls.problems).toEqual([]);
    } finally {
      controller.dispose();
    }
  });

  it("rejects a template that belongs to another language", async () => {
    const catalog = fakeCatalog({
      template: async (_slug, languageId) => ({
        ...makeTemplate(CPP_ID),
        languageId: CPP_ID === languageId ? PYTHON_ID : CPP_ID,
      }),
    });
    const controller = makeController(
      catalog,
      createDraftStore(memoryStorage()),
    );

    try {
      await controller.open("sum-two");
      const snapshot = controller.getSnapshot();
      expect(snapshot.templatePhase).toBe("error");
      expect(snapshot.templateError).toMatchObject({
        code: "INVALID_CONTRACT_DATA",
      });
    } finally {
      controller.dispose();
    }
  });

  it("reuses the last selected language for the same problem", async () => {
    const catalog = fakeCatalog();
    const drafts = createDraftStore(memoryStorage());
    drafts.writePreferredLanguage(PROBLEM_ID, CPP_ID);
    const controller = makeController(catalog, drafts);

    try {
      await controller.open("sum-two");
      expect(controller.getSnapshot().selectedLanguageId).toBe(CPP_ID);
      expect(catalog.calls.templates).toEqual([CPP_ID]);
    } finally {
      controller.dispose();
    }
  });

  it("reports a storage write failure without discarding the code", async () => {
    const failingStore: DraftStore = {
      available: true,
      read: () => null,
      write: () => false,
      remove: () => false,
      readPreferredLanguage: () => null,
      writePreferredLanguage: () => {},
    };
    const controller = makeController(fakeCatalog(), failingStore);

    try {
      await controller.open("sum-two");
      controller.changeCode("print('still here')");
      controller.flushDraft();

      const snapshot = controller.getSnapshot();
      expect(snapshot.code).toBe("print('still here')");
      expect(snapshot.saveState).toBe("error");
    } finally {
      controller.dispose();
    }
  });

  it("treats a problem without supported languages as an invalid payload", async () => {
    const catalog = fakeCatalog({
      problem: async () => makeProblem([]),
    });
    const controller = makeController(
      catalog,
      createDraftStore(memoryStorage()),
    );

    try {
      await controller.open("sum-two");
      const snapshot = controller.getSnapshot();
      expect(snapshot.phase).toBe("error");
      expect(snapshot.errorKind).toBe("generic");
      expect(snapshot.problemError).toMatchObject({
        code: "INVALID_CONTRACT_DATA",
      });
    } finally {
      controller.dispose();
    }
  });
});
