import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { createSession } from "@/features/auth/store";
import {
  createRunController,
  type RunState,
} from "@/features/problem-run/controller";
import {
  formatOutputText,
  formatRuntimeMs,
  isAbortError,
  isSampleMismatch,
  resolveRunErrorMessage,
  validateCodeBeforeRun,
  VERDICT_META,
} from "@/features/problem-run/runModel";
import { RunResultView } from "@/features/problem-run/RunPanel";
import {
  createApiClient,
  createTransport,
  MAX_EXECUTE_CODE_BYTES,
  RUN_VERDICTS,
} from "@/lib/api";

const UUID1 = "11111111-1111-4111-8111-111111111111";
const UUID2 = "22222222-2222-4222-8222-222222222222";
const USER_ID = "99999999-9999-4999-8999-999999999999";

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

function makeApi(fetcher: typeof fetch) {
  const send = createTransport("http://localhost:4010", fetcher);
  return createApiClient({
    authRequest: (path, init) => send(path, init, "token"),
    publicRequest: (path, init) => send(path, init),
    isAuthenticated: () => true,
  });
}

describe("problem-run pure model helpers", () => {
  it("validates blank code, exact UTF-8 limit, and over-limit source", () => {
    expect(validateCodeBeforeRun("   \n\t ")).toMatchObject({
      ok: false,
      bytes: 6,
    });

    const exactAscii = "a".repeat(MAX_EXECUTE_CODE_BYTES);
    expect(validateCodeBeforeRun(exactAscii)).toEqual({
      ok: true,
      bytes: MAX_EXECUTE_CODE_BYTES,
      message: "",
    });

    const overUtf8 = "ế".repeat(34134); // 3 bytes * 34134 = 102402 bytes
    expect(overUtf8.length).toBeLessThan(MAX_EXECUTE_CODE_BYTES);
    const check = validateCodeBeforeRun(overUtf8);
    expect(check.ok).toBe(false);
    expect(check.bytes).toBe(102402);
    expect(check.message).toContain("102.400");
  });

  it("defines readable labels for every RunVerdict and formats outputs/runtime safely", () => {
    for (const verdict of RUN_VERDICTS) {
      expect(VERDICT_META[verdict].label.length).toBeGreaterThan(0);
    }
    expect(VERDICT_META.Accepted.tone).toBe("pass");
    expect(VERDICT_META["Wrong Answer"].tone).toBe("fail");
    expect(VERDICT_META["Time Limit Exceeded"].tone).toBe("warn");
    expect(formatOutputText(null)).toBe("(trống)");
    expect(formatOutputText("")).toBe("(trống)");
    expect(formatOutputText("3\n")).toBe("3\n");
    expect(formatRuntimeMs(null)).toBe("—");
    expect(formatRuntimeMs(0)).toBe("0 ms");
    expect(formatRuntimeMs(12)).toBe("12 ms");
    expect(
      isSampleMismatch({
        isPassed: false,
        actualOutput: "2\n",
        expectedOutput: "3\n",
      }),
    ).toBe(true);
    expect(
      isSampleMismatch({
        isPassed: true,
        actualOutput: "3\n",
        expectedOutput: "3\n",
      }),
    ).toBe(false);
  });
});

describe("createRunController contract & lifecycle guards", () => {
  it("calls POST /api/v1/run with raw preserved code bytes, never calls /submit or /ai-review", async () => {
    const runExample =
      openApiSpec.paths["/api/v1/run"].post.responses["200"].content?.[
        "application/json"
      ]?.example;
    const urls: string[] = [];
    let sentBody: unknown = null;

    const api = makeApi(async (url, init) => {
      urls.push(String(url));
      sentBody = init?.body ? JSON.parse(String(init.body)) : null;
      return new Response(JSON.stringify(runExample), { status: 200 });
    });

    const controller = createRunController(api, {
      userId: USER_ID,
      problemId: UUID1,
    });
    const source = "  a, b = map(int, input().split())\nprint(a + b)\n";
    await controller.run({
      problemId: UUID1,
      languageId: UUID1,
      code: source,
    });

    expect(urls).toEqual(["http://localhost:4010/api/v1/run"]);
    expect(
      urls.some((u) => u.includes("/submit") || u.includes("ai-review")),
    ).toBe(false);
    expect(sentBody).toEqual({
      problemId: UUID1,
      languageId: UUID1,
      code: source,
    });

    const snap = controller.getSnapshot();
    expect(snap.phase).toBe("completed");
    expect(snap.result?.status).toBe("Accepted");
    expect(snap.result?.passed).toBe(1);
    expect(snap.result?.total).toBe(1);
    expect(snap.result?.results[0].runtimeMs).toBe(12);
    expect(snap.resultCode).toBe(source);
    expect(snap.resultLanguageId).toBe(UUID1);
  });

  it.each(RUN_VERDICTS)(
    "treats HTTP 200 %s as a completed synchronous Run",
    async (status) => {
      const fetcher = vi.fn(async () =>
        makeEnvelope({
          status,
          passed: status === "Accepted" ? 1 : 0,
          total: 1,
          results: [
            {
              testCaseId: UUID1,
              status,
              inputData: "1 2\n",
              expectedOutput: "3\n",
              actualOutput: "",
              runtimeMs: null,
              errorMessage: null,
              errorType: null,
              stderr: null,
            },
          ],
        }),
      );
      const controller = createRunController(makeApi(fetcher), {
        userId: USER_ID,
        problemId: UUID1,
      });
      await controller.run({
        problemId: UUID1,
        languageId: UUID1,
        code: "print(1)",
      });
      expect(controller.getSnapshot().phase).toBe("completed");
      expect(controller.getSnapshot().result?.status).toBe(status);
      expect(controller.getSnapshot().error).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(1);
      controller.dispose();
    },
  );

  it("never restores results after logout/dispose followed by reactivation", async () => {
    let resolve!: (response: Response) => void;
    const api = makeApi(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    const controller = createRunController(api, {
      userId: USER_ID,
      problemId: UUID1,
    });
    const pending = controller.run({
      problemId: UUID1,
      languageId: UUID1,
      code: "print(1)",
    });
    controller.dispose();
    controller.activate();
    resolve(
      makeEnvelope({ status: "Accepted", passed: 1, total: 1, results: [] }),
    );
    await pending;
    expect(controller.getSnapshot().result).toBeNull();
    expect(controller.getSnapshot().phase).toBe("idle");
    controller.dispose();
  });

  it("blocks blank and oversize source client-side without calling fetch and clears client error on edit", async () => {
    const fetcher = vi.fn(async () => makeEnvelope({}));
    const controller = createRunController(makeApi(fetcher), {
      userId: USER_ID,
      problemId: UUID1,
    });

    await controller.run({
      problemId: UUID1,
      languageId: UUID1,
      code: "   \n ",
    });
    expect(fetcher).not.toHaveBeenCalled();
    expect(controller.getSnapshot().phase).toBe("error");
    expect(
      resolveRunErrorMessage(
        controller.getSnapshot().error,
        controller.getSnapshot().validationMessage,
      ),
    ).toContain("Vui lòng nhập mã nguồn");

    controller.syncCode("print(1)\n");
    expect(controller.getSnapshot().phase).toBe("idle");
    expect(controller.getSnapshot().validationMessage).toBeNull();

    await controller.run({
      problemId: UUID1,
      languageId: UUID1,
      code: "ế".repeat(34134),
    });
    expect(fetcher).not.toHaveBeenCalled();
    expect(controller.getSnapshot().phase).toBe("error");
    expect(controller.getSnapshot().validationMessage).toContain("102.400");
  });

  it("surfaces Vietnamese errors for 403 LEVEL_LOCKED, 422 LANGUAGE_NOT_SUPPORTED, 429 RATE_LIMITED, and 504 TIMEOUT", async () => {
    let mode: "403" | "422" | "429" | "504" = "403";
    const api = makeApi(async () => {
      if (mode === "403") return makeErrorResponse(403, "LEVEL_LOCKED");
      if (mode === "422")
        return makeErrorResponse(422, "LANGUAGE_NOT_SUPPORTED");
      if (mode === "429")
        return makeErrorResponse(429, "RATE_LIMITED", { "Retry-After": "10" });
      return makeErrorResponse(504, "TIMEOUT");
    });

    const controller = createRunController(api, {
      userId: USER_ID,
      problemId: UUID1,
    });

    await controller.run({
      problemId: UUID1,
      languageId: UUID1,
      code: "print(1)",
    });
    expect(
      resolveRunErrorMessage(
        controller.getSnapshot().error,
        controller.getSnapshot().validationMessage,
      ),
    ).toBe("Cần hoàn thành hết các cấp độ trước để mở khóa bài này.");

    mode = "422";
    await controller.run({
      problemId: UUID1,
      languageId: UUID1,
      code: "print(1)",
    });
    expect(
      resolveRunErrorMessage(
        controller.getSnapshot().error,
        controller.getSnapshot().validationMessage,
      ),
    ).toBe("Ngôn ngữ lập trình này không được hỗ trợ cho bài tập.");

    mode = "429";
    await controller.run({
      problemId: UUID1,
      languageId: UUID1,
      code: "print(1)",
    });
    expect(
      resolveRunErrorMessage(
        controller.getSnapshot().error,
        controller.getSnapshot().validationMessage,
      ),
    ).toBe("Bạn thao tác quá nhanh. Vui lòng thử lại sau 10 giây.");

    mode = "504";
    await controller.run({
      problemId: UUID1,
      languageId: UUID1,
      code: "print(1)",
    });
    expect(
      resolveRunErrorMessage(
        controller.getSnapshot().error,
        controller.getSnapshot().validationMessage,
      ),
    ).toBe("Hệ thống xử lý quá thời gian chờ. Vui lòng thử lại.");
  });

  it("blocks concurrent double-click runs while a run is in-flight", async () => {
    let release!: (res: Response) => void;
    const fetcher = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    );

    const controller = createRunController(makeApi(fetcher), {
      userId: USER_ID,
      problemId: UUID1,
    });

    const first = controller.run({
      problemId: UUID1,
      languageId: UUID1,
      code: "print(1)",
    });
    const second = controller.run({
      problemId: UUID1,
      languageId: UUID1,
      code: "print(2)",
    });

    expect(controller.getSnapshot().phase).toBe("running");
    expect(fetcher).toHaveBeenCalledTimes(1);

    release(
      makeEnvelope({
        status: "Accepted",
        passed: 1,
        total: 1,
        results: [],
      }),
    );
    await Promise.all([first, second]);
    expect(controller.getSnapshot().phase).toBe("completed");
    expect(controller.getSnapshot().resultCode).toBe("print(1)");
  });

  it("distinguishes deadline timeout from manual cancel and handles late resolution cleanly", async () => {
    const neverResolvingApi = makeApi(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("Aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    );

    const timeoutController = createRunController(
      neverResolvingApi,
      { userId: USER_ID, problemId: UUID1 },
      { timeoutMs: 25 },
    );
    await timeoutController.run({
      problemId: UUID1,
      languageId: UUID1,
      code: "print(1)",
    });
    expect(timeoutController.getSnapshot().phase).toBe("error");
    expect(
      resolveRunErrorMessage(
        timeoutController.getSnapshot().error,
        timeoutController.getSnapshot().validationMessage,
      ),
    ).toBe("Yêu cầu quá thời gian chờ. Vui lòng thử lại.");

    // Manual cancel immediately transitions to cancelled state and ignores late resolution
    let finishLate!: (res: Response) => void;
    const lateApi = makeApi(
      () =>
        new Promise<Response>((resolve) => {
          finishLate = resolve;
        }),
    );
    const cancelController = createRunController(lateApi, {
      userId: USER_ID,
      problemId: UUID1,
    });
    const pending = cancelController.run({
      problemId: UUID1,
      languageId: UUID1,
      code: "print(1)",
    });
    cancelController.cancel();
    expect(cancelController.getSnapshot().phase).toBe("cancelled");
    expect(cancelController.getSnapshot().notice).toContain("Đã hủy");

    finishLate(
      makeEnvelope({
        status: "Accepted",
        passed: 1,
        total: 1,
        results: [],
      }),
    );
    await pending;
    expect(cancelController.getSnapshot().phase).toBe("cancelled");
    expect(cancelController.getSnapshot().result).toBeNull();
    expect(isAbortError(null, true)).toBe(true);
  });

  it("aborts in-flight run on language switch, ignores stale response, and resets cleanly on dispose", async () => {
    let resolveRun!: (res: Response) => void;
    const api = makeApi(
      () =>
        new Promise<Response>((resolve) => {
          resolveRun = resolve;
        }),
    );
    const controller = createRunController(api, {
      userId: USER_ID,
      problemId: UUID1,
    });

    controller.syncLanguage(UUID1);
    const pending = controller.run({
      problemId: UUID1,
      languageId: UUID1,
      code: "print(1)",
    });
    controller.syncLanguage(UUID2);

    expect(controller.getSnapshot().phase).toBe("idle");
    expect(controller.getSnapshot().notice).toContain("đổi ngôn ngữ");

    resolveRun(
      makeEnvelope({
        status: "Accepted",
        passed: 1,
        total: 1,
        results: [],
      }),
    );
    await pending;
    expect(controller.getSnapshot().result).toBeNull();

    // Test dispose drops future state mutations after logout/unmount
    const pending2 = controller.run({
      problemId: UUID1,
      languageId: UUID2,
      code: "int main(){}",
    });
    controller.dispose();
    resolveRun(
      makeEnvelope({
        status: "Accepted",
        passed: 1,
        total: 1,
        results: [],
      }),
    );
    await pending2;
    expect(controller.getSnapshot().phase).toBe("idle");
    expect(controller.getSnapshot().result).toBeNull();
  });

  it("supports React StrictMode cleanup-then-remount lifecycle via activate()", async () => {
    const fetcher = vi.fn(async () =>
      makeEnvelope({
        status: "Accepted",
        passed: 1,
        total: 1,
        results: [],
      }),
    );
    const controller = createRunController(makeApi(fetcher), {
      userId: USER_ID,
      problemId: UUID1,
    });

    // Simulate React dev StrictMode: mount -> cleanup(dispose) -> remount(activate)
    controller.activate();
    controller.syncLanguage(UUID1);
    controller.dispose();

    controller.activate();
    controller.syncLanguage(UUID1);
    await controller.run({
      problemId: UUID1,
      languageId: UUID1,
      code: "print(1)\n",
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().phase).toBe("completed");
    expect(controller.getSnapshot().result?.status).toBe("Accepted");
  });
});

describe("RunResultView markup & XSS safety", () => {
  it("renders multi-sample diagnostics, mismatch indicator, stale badge, and escapes unsafe output safely", () => {
    const state: RunState = {
      phase: "completed",
      result: {
        status: "Compilation Error",
        passed: 0,
        total: 2,
        allPassed: false,
        results: [
          {
            testCaseId: UUID1,
            status: "Wrong Answer",
            inputData: "1 2\n",
            expectedOutput: "3\n",
            actualOutput: "<script>alert(1)</script>\n",
            runtimeMs: 8,
            errorMessage: null,
            errorType: null,
            stderr: null,
            isPassed: false,
          },
          {
            testCaseId: UUID2,
            status: "Compilation Error",
            inputData: "5 6\n",
            expectedOutput: "11\n",
            actualOutput: "",
            runtimeMs: null,
            errorMessage: 'Invalid token "<img onerror=alert(2)>"',
            errorType: "SyntaxError",
            stderr: 'File "main.py", line 1\nSyntaxError: <bad>',
            isPassed: false,
          },
        ],
      },
      resultLanguageId: UUID1,
      resultCode: "print(1)",
      error: null,
      validationMessage: null,
      notice: null,
    };

    const html = renderToStaticMarkup(
      createElement(RunResultView, {
        state,
        languageLabel: "Python 3 (3.12)",
        isCodeEditedAfterRun: true,
      }),
    );

    expect(html).toContain("Lỗi biên dịch (Compilation Error)");
    expect(html).toContain("Đạt 0/2 test mẫu");
    expect(html).toContain("Không tạo submission");
    expect(html).toContain("Python 3 (3.12)");
    expect(html).toContain("Mã nguồn đã sửa sau lần chạy này");
    expect(html).toContain("run-pre--mismatch");
    expect(html).toContain("Thời gian: 8 ms");
    expect(html).toContain("Thời gian: —");
    expect(html).toContain("SyntaxError");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<img onerror=alert(2)>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;img onerror=alert(2)&gt;");
  });
});

async function launchMock() {
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL("../scripts/mock.mjs", import.meta.url))],
    {
      env: {
        ...process.env,
        MOCK_PORT: "0",
        MOCK_SUBMISSION_DEMO: "1",
        MOCK_EDITOR_DEMO: "1",
        MOCK_SUBMISSION_VERDICT: "Accepted",
        MOCK_AUTH_ONLY: "0",
        MOCK_REFRESH_STATUS: "401",
        MOCK_ORIGIN: "http://localhost:3000",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const url = await new Promise<string>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Mock startup timed out"));
    }, 5000);
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Mock exited: ${code}`));
    });
    child.stdout!.on("data", (chunk) => {
      output += String(chunk);
      const match = /http:\/\/localhost:(\d+)/.exec(output);
      if (match) {
        clearTimeout(timer);
        resolve(`http://127.0.0.1:${match[1]}`);
      }
    });
  });
  return { child, url };
}

async function stopMock(child: ChildProcess) {
  if (child.exitCode !== null) return;
  const ended = once(child, "exit");
  child.kill();
  await ended;
}

describe("Run HTTP integration with local Sprint 3 mock", () => {
  it("runs auth → getProblem(sum-two) → getTemplate → Run sample without calling /submit", async () => {
    const { child, url } = await launchMock();
    const calls: { path: string; method: string; credentials?: string }[] = [];
    const fetcher: typeof fetch = (input, init) => {
      calls.push({
        path: new URL(String(input)).pathname,
        method: init?.method ?? "GET",
        credentials: init?.credentials,
      });
      return fetch(input, init);
    };
    const transport = createTransport(url, fetcher);
    const session = createSession(transport);
    const api = createApiClient({
      authRequest: session.request,
      publicRequest: transport,
    });
    let controller: ReturnType<typeof createRunController> | undefined;

    try {
      await expect(session.bootstrap()).rejects.toMatchObject({ status: 401 });
      await session.login({
        email: "learner@example.com",
        password: "Coding2026",
      });
      const user = session.getSnapshot().user!;
      const detail = await api.catalog.getProblem("sum-two");
      expect(detail.languages.length).toBeGreaterThanOrEqual(2);
      expect(new Set(detail.languages.map((item) => item.id)).size).toBe(
        detail.languages.length,
      );
      const pythonLang = detail.languages[0];
      const cppLang = detail.languages[1];
      const template = await api.catalog.getTemplate("sum-two", pythonLang.id);
      expect(template.fileName).toBe("main.py");
      const beforeHistory = await api.judge.listMySubmissions({
        problemId: detail.problem.id,
      });
      const beforeLevels = await api.catalog.getPackageLevels(
        detail.problem.packageSlug,
      );

      controller = createRunController(api, {
        userId: user.id,
        problemId: detail.problem.id,
      });
      controller.syncLanguage(pythonLang.id);
      await controller.run({
        problemId: detail.problem.id,
        languageId: pythonLang.id,
        code: template.starterCode,
      });

      const snap1 = controller.getSnapshot();
      expect(snap1.phase).toBe("completed");
      expect(snap1.result?.status).toBe("Accepted");
      expect(snap1.result?.passed).toBe(1);
      expect(snap1.result?.results[0].runtimeMs).toBe(12);

      // Switch to C++ clears previous Python results cleanly before re-running
      controller.syncLanguage(cppLang.id);
      expect(controller.getSnapshot().phase).toBe("idle");
      expect(controller.getSnapshot().result).toBeNull();

      const cppTemplate = await api.catalog.getTemplate("sum-two", cppLang.id);
      expect(cppTemplate.fileName).toBe("main.cpp");
      expect(cppLang.id).not.toBe(pythonLang.id);
      await controller.run({
        problemId: detail.problem.id,
        languageId: cppLang.id,
        code: cppTemplate.starterCode,
      });
      expect(controller.getSnapshot().phase).toBe("completed");
      expect(controller.getSnapshot().resultLanguageId).toBe(cppLang.id);

      const afterHistory = await api.judge.listMySubmissions({
        problemId: detail.problem.id,
      });
      expect(afterHistory.total).toBe(beforeHistory.total);
      expect(
        await api.catalog.getPackageLevels(detail.problem.packageSlug),
      ).toEqual(beforeLevels);

      const preflight = await fetch(`${url}/api/v1/run`, {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "POST",
        },
      });
      expect(preflight.status).toBe(204);
      expect(preflight.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://localhost:3000",
      );

      expect(
        calls.every(
          (call) =>
            call.path.startsWith("/api/v1/") && call.credentials === "include",
        ),
      ).toBe(true);
      expect(
        calls.some(
          (call) =>
            call.path.endsWith("/submit") || call.path.includes("ai-review"),
        ),
      ).toBe(false);
    } finally {
      controller?.dispose();
      await session.logout().catch(() => {});
      await stopMock(child);
    }
  }, 10000);
});
