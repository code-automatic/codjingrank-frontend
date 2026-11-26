import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { createSession } from "@/features/auth/store";
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
        MOCK_FORUM_DEMO: "1",
        MOCK_LEADERBOARD_DEMO: "1",
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

describe("Sprint 5 cross-feature HTTP mock journey", () => {
  it("connects login, catalog, run, submission, progress, ranking, AI and forum without AI changing the verdict", async () => {
    const { child, url } = await launch("Accepted");
    const transport = createTransport(url);
    const session = createSession(transport);
    const api = createApiClient({
      authRequest: session.request,
      publicRequest: transport,
    });
    try {
      await session.login({
        email: "learner@example.com",
        password: "Coding2026",
      });
      expect(session.getSnapshot().status).toBe("authenticated");
      const detail = await api.catalog.getProblem("sum-two");
      const language = detail.languages.find(
        (item) => item.slug === "python3",
      )!;
      const template = await api.catalog.getTemplate("sum-two", language.id);
      const payload = {
        problemId: detail.problem.id,
        languageId: language.id,
        code: template.starterCode,
      };
      expect(await api.judge.runSamples(payload)).toBeTruthy();
      let submission = await api.judge.submitCode(payload);
      for (let i = 0; i < 5 && submission.status !== "Accepted"; i++)
        submission = await api.judge.getSubmission(submission.id);
      expect(submission.status).toBe("Accepted");
      const levels = await api.catalog.getPackageLevels(
        detail.problem.packageSlug,
      );
      expect(levels.levels[1].unlocked).toBe(true);
      const board = await api.community.getLeaderboard({
        scope: "all",
        page: 1,
        size: 20,
      });
      expect(board.items.length).toBeGreaterThan(0);
      let review = await api.judge.getAiReview(submission.id);
      for (let i = 0; i < 4 && review?.status !== "completed"; i++)
        review = await api.judge.getAiReview(submission.id);
      expect(review?.status).toBe("completed");
      expect((await api.judge.getSubmission(submission.id)).status).toBe(
        "Accepted",
      );
      expect(
        (await api.community.listPosts({ page: 1, size: 20 })).items.length,
      ).toBeGreaterThan(0);
      const json = JSON.stringify({ detail, submission, review, board });
      for (const key of [
        "wrapperCode",
        "hiddenTestCases",
        "expectedOutputHidden",
        "providerToken",
      ])
        expect(json).not.toContain('"' + key + '"');
      await session.logout();
      expect(session.getSnapshot().status).toBe("anonymous");
    } finally {
      await stop(child);
    }
  }, 15000);
});
