import { describe, expect, it, vi } from "vitest";
import {
  createDraftStore,
  createUserDraftStore,
  clearBrowserDrafts,
  draftKey,
  preferredLanguageKey,
  type KeyValueStorage,
} from "@/features/editor/draft-store";

const PROBLEM_A = "11111111-1111-4111-8111-111111111111";
const PROBLEM_B = "22222222-2222-4222-8222-222222222222";
const PYTHON = "33333333-3333-4333-8333-333333333333";
const CPP = "44444444-4444-4444-8444-444444444444";

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

describe("draft store", () => {
  it("clears only the departing account on logout", () => {
    const storage = memoryStorage();
    const userA = PROBLEM_A.replace(/.$/, "a");
    const userB = PROBLEM_A.replace(/.$/, "b");
    const a = createUserDraftStore(storage, userA);
    const b = createUserDraftStore(storage, userB);
    a.write(PROBLEM_A, PYTHON, { code: "A", savedAt: 1 });
    a.writePreferredLanguage(PROBLEM_A, PYTHON);
    b.write(PROBLEM_A, PYTHON, { code: "B", savedAt: 1 });
    storage.setItem("unrelated", "keep");
    vi.stubGlobal("window", {
      localStorage: {
        get length() {
          return storage.data.size;
        },
        key: (index: number) => [...storage.data.keys()][index] ?? null,
        removeItem: storage.removeItem,
      },
    });
    try {
      clearBrowserDrafts(userA);
      expect(a.read(PROBLEM_A, PYTHON)).toBeNull();
      expect(a.readPreferredLanguage(PROBLEM_A)).toBeNull();
      expect(b.read(PROBLEM_A, PYTHON)?.code).toBe("B");
      expect(storage.getItem("unrelated")).toBe("keep");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rejects timestamps outside JavaScript Date range", () => {
    const store = createDraftStore(memoryStorage());
    expect(
      store.write(PROBLEM_A, PYTHON, { code: "bad", savedAt: 1e100 }),
    ).toBe(false);
  });
  it("isolates accounts and does not import legacy unowned drafts", () => {
    const storage = memoryStorage();
    const userA = PROBLEM_A.replace(/.$/, "a");
    const userB = PROBLEM_A.replace(/.$/, "b");
    createDraftStore(storage).write(PROBLEM_A, PYTHON, {
      code: "legacy",
      savedAt: 1,
    });
    const a = createUserDraftStore(storage, userA);
    const b = createUserDraftStore(storage, userB);
    expect(a.read(PROBLEM_A, PYTHON)).toBeNull();
    a.write(PROBLEM_A, PYTHON, { code: "private A", savedAt: 2 });
    expect(b.read(PROBLEM_A, PYTHON)).toBeNull();
    b.write(PROBLEM_A, PYTHON, { code: "private B", savedAt: 3 });
    expect(
      createUserDraftStore(storage, userA).read(PROBLEM_A, PYTHON)?.code,
    ).toBe("private A");
    expect(createUserDraftStore(storage, "invalid").available).toBe(false);
  });

  it("reports removal failures instead of claiming the draft was deleted", () => {
    const storage = memoryStorage();
    const store = createDraftStore(storage);
    store.write(PROBLEM_A, PYTHON, { code: "old", savedAt: 1 });
    storage.removeItem = () => {
      throw new Error("blocked");
    };
    expect(store.remove(PROBLEM_A, PYTHON)).toBe(false);
    expect(store.read(PROBLEM_A, PYTHON)?.code).toBe("old");
  });
  it("round-trips code and savedAt for one problem-language pair", () => {
    const storage = memoryStorage();
    const store = createDraftStore(storage);

    expect(store.available).toBe(true);
    expect(
      store.write(PROBLEM_A, PYTHON, { code: "print('a')", savedAt: 100 }),
    ).toBe(true);
    expect(store.read(PROBLEM_A, PYTHON)).toEqual({
      code: "print('a')",
      savedAt: 100,
    });
  });

  it("isolates drafts by both problemId and languageId", () => {
    const store = createDraftStore(memoryStorage());
    store.write(PROBLEM_A, PYTHON, { code: "python", savedAt: 1 });
    store.write(PROBLEM_A, CPP, { code: "cpp", savedAt: 2 });
    store.write(PROBLEM_B, PYTHON, { code: "other", savedAt: 3 });

    expect(store.read(PROBLEM_A, PYTHON)?.code).toBe("python");
    expect(store.read(PROBLEM_A, CPP)?.code).toBe("cpp");
    expect(store.read(PROBLEM_B, PYTHON)?.code).toBe("other");
    expect(store.read(PROBLEM_B, CPP)).toBeNull();
  });

  it("removes only the requested pair", () => {
    const store = createDraftStore(memoryStorage());
    store.write(PROBLEM_A, PYTHON, { code: "python", savedAt: 1 });
    store.write(PROBLEM_A, CPP, { code: "cpp", savedAt: 2 });

    store.remove(PROBLEM_A, PYTHON);

    expect(store.read(PROBLEM_A, PYTHON)).toBeNull();
    expect(store.read(PROBLEM_A, CPP)?.code).toBe("cpp");
  });

  it.each([
    ["malformed JSON", "{not-json"],
    [
      "mismatched ids",
      JSON.stringify({
        v: 1,
        problemId: PROBLEM_B,
        languageId: PYTHON,
        code: "wrong",
        savedAt: 1,
      }),
    ],
    [
      "wrong version",
      JSON.stringify({
        v: 2,
        problemId: PROBLEM_A,
        languageId: PYTHON,
        code: "wrong",
        savedAt: 1,
      }),
    ],
    [
      "non-string code",
      JSON.stringify({
        v: 1,
        problemId: PROBLEM_A,
        languageId: PYTHON,
        code: 42,
        savedAt: 1,
      }),
    ],
  ])("drops a corrupt or foreign record: %s", (_label, raw) => {
    const storage = memoryStorage();
    const key = draftKey(PROBLEM_A, PYTHON);
    storage.data.set(key, raw);
    const store = createDraftStore(storage);

    expect(store.read(PROBLEM_A, PYTHON)).toBeNull();
    expect(storage.data.has(key)).toBe(false);
  });

  it("rejects invalid UUIDs instead of building unsafe keys", () => {
    const storage = memoryStorage();
    const store = createDraftStore(storage);

    expect(store.write("../x", PYTHON, { code: "x", savedAt: 1 })).toBe(false);
    expect(store.read(PROBLEM_A, "not-a-uuid")).toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it("reports unavailable and no-ops when storage is blocked", () => {
    const blocked: KeyValueStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    const store = createDraftStore(blocked);

    expect(store.available).toBe(false);
    expect(store.write(PROBLEM_A, PYTHON, { code: "x", savedAt: 1 })).toBe(
      false,
    );
    expect(store.read(PROBLEM_A, PYTHON)).toBeNull();
  });

  it("returns false when a write exceeds quota without throwing", () => {
    const storage = memoryStorage();
    const store = createDraftStore(storage);
    storage.setItem = () => {
      throw new Error("QuotaExceededError");
    };

    expect(store.write(PROBLEM_A, PYTHON, { code: "x", savedAt: 1 })).toBe(
      false,
    );
  });

  it("persists a preferred language and rejects malformed values", () => {
    const storage = memoryStorage();
    const store = createDraftStore(storage);

    store.writePreferredLanguage(PROBLEM_A, CPP);
    expect(store.readPreferredLanguage(PROBLEM_A)).toBe(CPP);
    expect(storage.data.get(preferredLanguageKey(PROBLEM_A))).toBe(CPP);

    storage.data.set(preferredLanguageKey(PROBLEM_A), "not-a-uuid");
    expect(store.readPreferredLanguage(PROBLEM_A)).toBeNull();
    expect(storage.data.has(preferredLanguageKey(PROBLEM_A))).toBe(false);
  });

  it("uses a versioned key namespace", () => {
    expect(draftKey(PROBLEM_A, PYTHON)).toBe(
      `codjingrank:draft:v1:${PROBLEM_A}:${PYTHON}`,
    );
    expect(preferredLanguageKey(PROBLEM_A)).toBe(
      `codjingrank:language:v1:${PROBLEM_A}`,
    );
  });
});
