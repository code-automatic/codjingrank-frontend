import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { createSession } from "@/features/auth/store";
import { createSubmissionController } from "@/features/submissions/controller";
import { createApiClient, createTransport } from "@/lib/api";

async function launch(verdict: string, origin = "http://localhost:3000") {
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL("../scripts/mock.mjs", import.meta.url))],
    {
      env: {
        ...process.env,
        MOCK_PORT: "0",
        MOCK_SUBMISSION_DEMO: "1",
        MOCK_EDITOR_DEMO: "1",
        MOCK_SUBMISSION_VERDICT: verdict,
        MOCK_AUTH_ONLY: "0",
        MOCK_REFRESH_STATUS: "401",
        MOCK_ORIGIN: origin,
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
async function stop(child: ChildProcess) {
  if (child.exitCode !== null) return;
  const ended = once(child, "exit");
  child.kill();
  await ended;
}

describe("Sprint 3 real HTTP integration with local mock", () => {
  it("supports default dev and preview origins without trusting other origins", async () => {
    const { child, url } = await launch("Accepted", "");
    try {
      for (const origin of ["http://localhost:3000", "http://localhost:3001"]) {
        const response = await fetch(`${url}/api/v1/auth/refresh`, {
          method: "OPTIONS",
          headers: { Origin: origin, "Access-Control-Request-Method": "POST" },
        });
        expect(response.status).toBe(204);
        expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
          origin,
        );
        expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
          "true",
        );
        expect(response.headers.get("Vary")).toBe("Origin");
      }
      const denied = await fetch(`${url}/api/v1/auth/refresh`, {
        method: "OPTIONS",
        headers: { Origin: "https://untrusted.example" },
      });
      expect(denied.headers.get("Access-Control-Allow-Origin")).toBeNull();
    } finally {
      await stop(child);
    }
  });

  it("keeps an explicit mock origin exclusive", async () => {
    const origin = "http://localhost:4200";
    const { child, url } = await launch("Accepted", origin);
    try {
      const allowed = await fetch(`${url}/api/v1/auth/refresh`, {
        method: "OPTIONS",
        headers: { Origin: origin },
      });
      expect(allowed.headers.get("Access-Control-Allow-Origin")).toBe(origin);
      const denied = await fetch(`${url}/api/v1/auth/refresh`, {
        method: "OPTIONS",
        headers: { Origin: "http://localhost:3001" },
      });
      expect(denied.headers.get("Access-Control-Allow-Origin")).toBeNull();
    } finally {
      await stop(child);
    }
  });

  it.each([
    ...[
      "Accepted",
      "Wrong Answer",
      "Compilation Error",
      "Runtime Error",
      "Time Limit Exceeded",
      "Memory Limit Exceeded",
      "Internal Error",
    ].map((verdict) => ({ verdict, languageSlug: "python3" })),
    { verdict: "Accepted", languageSlug: "cpp" },
    { verdict: "Accepted", languageSlug: "java" },
  ])(
    "connects HTTP mock auth → template → Submit → poll → history/progress for $languageSlug / $verdict",
    async ({ verdict, languageSlug }) => {
      const { child, url } = await launch(verdict);
      const requests: {
        path: string;
        method: string;
        credentials: RequestCredentials | undefined;
      }[] = [];
      const fetcher: typeof fetch = (input, init) => {
        requests.push({
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
      let controller: ReturnType<typeof createSubmissionController> | undefined;
      try {
        await expect(session.bootstrap()).rejects.toMatchObject({
          status: 401,
        });
        expect(session.getSnapshot().status).toBe("anonymous");
        await session.login({
          email: "learner@example.com",
          password: "Coding2026",
        });
        const user = session.getSnapshot().user!;
        expect(user).toBeTruthy();
        const detail = await api.catalog.getProblem("sum-two");
        const language = detail.languages.find(
          (item) => item.slug === languageSlug,
        )!;
        expect(language).toBeDefined();
        const template = await api.catalog.getTemplate("sum-two", language.id);
        controller = createSubmissionController(
          api,
          {
            userId: user.id,
            problemId: detail.problem.id,
            packageSlug: detail.problem.packageSlug,
          },
          { intervalMs: 10 },
        );
        await controller.start();
        expect(controller.getSnapshot().history?.total).toBe(0);
        const payload = {
          problemId: detail.problem.id,
          languageId: language.id,
          code: template.starterCode,
        };
        await controller.submit(payload);
        expect(controller.getSnapshot().submission?.status).toBe("Pending");
        await vi.waitFor(
          () => expect(controller!.getSnapshot().phase).toBe("terminal"),
          { timeout: 3000, interval: 10 },
        );
        await vi.waitFor(
          () => {
            expect(controller!.getSnapshot().history?.total).toBe(1);
            expect(controller!.getSnapshot().progressLoading).toBe(false);
          },
          { timeout: 3000, interval: 10 },
        );
        const result = controller.getSnapshot();
        expect(result.submission?.status).toBe(verdict);
        expect(result.submission?.languageId).toBe(language.id);
        expect(result.submission?.languageSlug).toBe(languageSlug);
        expect(result.submission?.passCount).toBe(
          verdict === "Accepted" ? 5 : 1,
        );
        expect(result.progress?.levels[1].unlocked).toBe(
          verdict === "Accepted",
        );
        expect(result.unlockedLevels).toEqual(
          verdict === "Accepted" ? [2] : [],
        );
        expect(result.historyError).toBeNull();
        expect(result.progressError).toBeNull();
        const row = result.history!.items[0];
        expect(row).not.toHaveProperty("code");
        expect(row.userId).toBe(user.id);
        await expect(api.judge.submitCode(payload)).rejects.toMatchObject({
          status: 429,
          code: "SUBMISSION_COOLDOWN",
          retryAfterSec: expect.any(Number),
        });
        await controller.reconcile();
        expect(controller.getSnapshot().submission?.status).toBe(verdict);
        const preflight = await fetch(url + "/api/v1/submit", {
          method: "OPTIONS",
          headers: {
            Origin: "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
          },
        });
        expect(preflight.status).toBe(204);
        expect(preflight.headers.get("Access-Control-Allow-Credentials")).toBe(
          "true",
        );
        expect(preflight.headers.get("Access-Control-Allow-Origin")).toBe(
          "http://localhost:3000",
        );
        expect(
          requests.every(
            (req) =>
              req.path.startsWith("/api/v1/") && req.credentials === "include",
          ),
        ).toBe(true);
        expect(
          requests.filter(
            (req) => req.path === "/api/v1/submit" && req.method === "POST",
          ),
        ).toHaveLength(2);
        expect(
          requests.some(
            (req) =>
              req.path.includes("ai-review") || req.path.endsWith("/run"),
          ),
        ).toBe(false);
        controller.dispose();
        await session.logout();
        expect(session.getSnapshot().status).toBe("anonymous");
      } finally {
        controller?.dispose();
        await stop(child);
      }
    },
    10000,
  );
});
