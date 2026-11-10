import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import {
  buildDraftStorageKey,
  pickInitialLanguage,
  safeReadStorage,
  safeRemoveStorage,
  safeWriteStorage,
} from "@/features/problem-run/draftStorage";
import {
  executeSampleRun,
  isAbortError,
  resolveCodeForLanguage,
  validateCodeBeforeRun,
  VERDICT_META,
} from "@/features/problem-run/runModel";
import {
  createApiClient,
  createTransport,
  type LanguageModel,
} from "@/lib/api";

const UUID1 = "11111111-1111-4111-8111-111111111111";
const UUID2 = "22222222-2222-4222-8222-222222222222";

const openApiSpec = parse(
  readFileSync(
    new URL("../contracts/openapi_fe.yaml", import.meta.url),
    "utf8",
  ),
) as {
  paths: Record<
    string,
    Record<
      string,
      {
        responses: Record<
          string,
          {
            content?: {
              "application/json"?: {
                example?: unknown;
              };
            };
          }
        >;
      }
    >
  >;
};

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

function makeEnvelope(data: unknown, status = 200) {
  return new Response(
    JSON.stringify({
      status: "success",
      code: status,
      message: "ok",
      data,
    }),
    { status },
  );
}

function makeErrorResponse(
  status: number,
  error: string,
  headers?: Record<string, string>,
) {
  return new Response(
    JSON.stringify({
      status: "error",
      code: status,
      message: "Error",
      error,
      details: null,
    }),
    { status, headers },
  );
}

describe("problem-run draft storage and language selection", () => {
  const languages: LanguageModel[] = [
    {
      id: UUID1,
      slug: "python3",
      name: "Python 3",
      runtimeVersion: "3.12",
      fileExtension: ".py",
      displayLabel: "Python 3 (3.12)",
    },
    {
      id: UUID2,
      slug: "cpp17",
      name: "C++17",
      runtimeVersion: "GCC 13",
      fileExtension: ".cpp",
      displayLabel: "C++17 (GCC 13)",
    },
  ];

  it("picks preferred language when supported and falls back to first language", () => {
    expect(pickInitialLanguage(languages, "cpp17")?.id).toBe(UUID2);
    expect(pickInitialLanguage(languages, "rust")?.id).toBe(UUID1);
    expect(pickInitialLanguage(languages, null)?.id).toBe(UUID1);
    expect(pickInitialLanguage([], "python3")).toBeNull();
  });

  it("reads, writes, removes drafts safely and avoids throwing on broken storage", () => {
    const storage = createMemoryStorage();
    const key = buildDraftStorageKey(UUID1, "sum-two", "python3");
    expect(key).toBe(`cjp.draft.${UUID1}.sum-two.python3`);

    expect(safeWriteStorage(key, "print(42)\n", storage)).toBe(true);
    expect(safeReadStorage(key, storage)).toBe("print(42)\n");

    const resolved = resolveCodeForLanguage({
      userId: UUID1,
      problemSlug: "sum-two",
      languageSlug: "python3",
      starterCode: "print(0)\n",
      storage,
    });
    expect(resolved).toEqual({ code: "print(42)\n", isFromDraft: true });

    safeRemoveStorage(key, storage);
    expect(
      resolveCodeForLanguage({
        userId: UUID1,
        problemSlug: "sum-two",
        languageSlug: "python3",
        starterCode: "print(0)\n",
        storage,
      }),
    ).toEqual({ code: "print(0)\n", isFromDraft: false });

    const brokenStorage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(safeReadStorage(key, brokenStorage)).toBeNull();
    expect(safeWriteStorage(key, "x", brokenStorage)).toBe(false);
    expect(() => safeRemoveStorage(key, brokenStorage)).not.toThrow();
  });
});

describe("problem-run preflight and verdict mapping", () => {
  it("validates blank code and UTF-8 102400 byte limit accurately", () => {
    expect(validateCodeBeforeRun("   \n\t ")).toMatchObject({
      ok: false,
      bytes: 6,
    });

    const overUtf8 = "ế".repeat(34134); // 3 bytes * 34134 = 102402 bytes
    expect(overUtf8.length).toBeLessThan(102400);
    const check = validateCodeBeforeRun(overUtf8);
    expect(check.ok).toBe(false);
    expect(check.bytes).toBe(102402);
    expect(check.message).toContain("102.400");

    expect(validateCodeBeforeRun("print(1)\n")).toEqual({
      ok: true,
      bytes: 9,
      message: "",
    });
  });

  it("defines readable labels for all supported RunVerdict states", () => {
    expect(VERDICT_META.Accepted.tone).toBe("pass");
    expect(VERDICT_META["Wrong Answer"].tone).toBe("fail");
    expect(VERDICT_META["Compilation Error"].tone).toBe("fail");
    expect(VERDICT_META["Time Limit Exceeded"].tone).toBe("warn");
  });
});

describe("executeSampleRun integration with /api/v1/run", () => {
  it("calls POST /api/v1/run using OpenAPI example, never calls /submit, and returns sample details", async () => {
    const runExample =
      openApiSpec.paths["/api/v1/run"].post.responses["200"].content?.[
        "application/json"
      ]?.example;
    const urls: string[] = [];
    let sentBody: unknown = null;

    const fetcher = vi.fn(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        urls.push(String(url));
        sentBody = init?.body ? JSON.parse(String(init.body)) : null;
        return new Response(JSON.stringify(runExample), { status: 200 });
      },
    );

    const send = createTransport("http://localhost:4010", fetcher);
    const api = createApiClient({
      authRequest: (path, init) => send(path, init, "token"),
      publicRequest: (path, init) => send(path, init),
      isAuthenticated: () => true,
    });

    const source = "a, b = map(int, input().split())\nprint(a + b)\n";
    const outcome = await executeSampleRun(api, {
      problemId: UUID1,
      languageId: UUID1,
      code: source,
    });

    expect(urls).toEqual(["http://localhost:4010/api/v1/run"]);
    expect(urls.some((u) => u.includes("/submit"))).toBe(false);
    expect(sentBody).toEqual({
      problemId: UUID1,
      languageId: UUID1,
      code: source,
    });
    expect(outcome.kind).toBe("result");
    if (outcome.kind === "result") {
      expect(outcome.data.status).toBe("Accepted");
      expect(outcome.data.passed).toBe(1);
      expect(outcome.data.total).toBe(1);
      expect(outcome.data.results[0].runtimeMs).toBe(12);
      expect(outcome.data.results[0].actualOutput).toBe("3\n");
    }
  });

  it("preserves HTTP 200 Wrong Answer and Compilation Error diagnostics per sample", async () => {
    const send = createTransport("http://localhost:4010", async () =>
      makeEnvelope({
        status: "Compilation Error",
        passed: 0,
        total: 2,
        results: [
          {
            testCaseId: UUID1,
            status: "Wrong Answer",
            inputData: "1 2\n",
            expectedOutput: "3\n",
            actualOutput: "2\n",
            runtimeMs: 8,
            errorMessage: null,
            errorType: null,
            stderr: null,
          },
          {
            testCaseId: UUID2,
            status: "Compilation Error",
            inputData: "5 6\n",
            expectedOutput: "11\n",
            actualOutput: "",
            runtimeMs: null,
            errorMessage: "SyntaxError at line 1",
            errorType: "SyntaxError",
            stderr: '  File "main.py", line 1\nSyntaxError: invalid syntax\n',
          },
        ],
      }),
    );

    const api = createApiClient({
      authRequest: (path, init) => send(path, init, "token"),
      publicRequest: (path, init) => send(path, init),
      isAuthenticated: () => true,
    });

    const outcome = await executeSampleRun(api, {
      problemId: UUID1,
      languageId: UUID1,
      code: "print(",
    });

    expect(outcome.kind).toBe("result");
    if (outcome.kind === "result") {
      expect(outcome.data.status).toBe("Compilation Error");
      expect(outcome.data.results[0].isPassed).toBe(false);
      expect(outcome.data.results[1].runtimeMs).toBeNull();
      expect(outcome.data.results[1].errorType).toBe("SyntaxError");
      expect(outcome.data.results[1].stderr).toContain("invalid syntax");
    }
  });

  it("surfaces Vietnamese messages for 403 LEVEL_LOCKED and 429 RATE_LIMITED with Retry-After", async () => {
    let mode: "403" | "429" = "403";
    const send = createTransport("http://localhost:4010", async () =>
      mode === "403"
        ? makeErrorResponse(403, "LEVEL_LOCKED")
        : makeErrorResponse(429, "RATE_LIMITED", { "Retry-After": "10" }),
    );
    const api = createApiClient({
      authRequest: (path, init) => send(path, init, "token"),
      publicRequest: (path, init) => send(path, init),
      isAuthenticated: () => true,
    });

    const lockedOutcome = await executeSampleRun(api, {
      problemId: UUID1,
      languageId: UUID1,
      code: "print(1)",
    });
    expect(lockedOutcome).toEqual({
      kind: "error",
      message: "Cần hoàn thành hết các cấp độ trước để mở khóa bài này.",
    });

    mode = "429";
    const rateOutcome = await executeSampleRun(api, {
      problemId: UUID1,
      languageId: UUID1,
      code: "print(1)",
    });
    expect(rateOutcome).toEqual({
      kind: "error",
      message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau 10 giây.",
    });
  });

  it("treats cancelled AbortController runs as cancelled instead of network error", async () => {
    const controller = new AbortController();
    const send = createTransport(
      "http://localhost:4010",
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const abortErr = new Error("Aborted");
            abortErr.name = "AbortError";
            reject(abortErr);
          });
        }),
    );
    const api = createApiClient({
      authRequest: (path, init) => send(path, init, "token"),
      publicRequest: (path, init) => send(path, init),
      isAuthenticated: () => true,
    });

    const runPromise = executeSampleRun(
      api,
      { problemId: UUID1, languageId: UUID1, code: "print(1)" },
      controller.signal,
    );
    controller.abort();
    const outcome = await runPromise;

    expect(isAbortError(null, controller.signal.aborted)).toBe(true);
    expect(outcome).toEqual({ kind: "cancelled" });
  });
});
