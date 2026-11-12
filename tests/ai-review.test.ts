import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { AiReviewContent } from "@/features/ai-review/AiReviewPage";
import {
  AI_REVIEW_STATUS_META,
  formatAiDateTime,
  formatAiScore,
  formatLineRange,
  isLineHighlighted,
  resolveUiAiStatus,
  splitSourceLines,
} from "@/features/ai-review/aiReviewModel";
import { createAiReviewController } from "@/features/ai-review/controller";
import { createSession } from "@/features/auth/store";
import { SubmissionResult } from "@/features/submissions/SubmissionPanel";
import {
  ApiError,
  createApiClient,
  createTransport,
  type ApiClient,
} from "@/lib/api";
import {
  adaptAiReview,
  adaptAiReviewData,
  adaptSubmission,
} from "@/lib/api/adapters/judge";

const spec = parse(
  readFileSync(
    new URL("../contracts/openapi_fe.yaml", import.meta.url),
    "utf8",
  ),
);

const rawSubmission =
  spec.paths["/api/v1/submit"].post.responses["201"].content["application/json"]
    .examples.pending.value.data.submission;

const acceptedSubmission = adaptSubmission({
  ...rawSubmission,
  status: "Accepted",
  passCount: 5,
  totalTestcases: 5,
  runtimeMs: 3,
  memoryKb: 1024,
  code: "a, b = map(int, input().split())\nprint(a + b)\n",
});

const wrongAnswerSubmission = adaptSubmission({
  ...rawSubmission,
  status: "Wrong Answer",
  passCount: 1,
  totalTestcases: 5,
  runtimeMs: 4,
  memoryKb: 1024,
  code: "print(0)\n",
});

const aiReviewExamples =
  spec.paths["/api/v1/submissions/{id}/ai-review"].get.responses["200"].content[
    "application/json"
  ].examples;

const queuedReview = adaptAiReviewData(aiReviewExamples.queued.value.data)!;
const runningReview = adaptAiReviewData(aiReviewExamples.running.value.data)!;
const completedReview = adaptAiReviewData(
  aiReviewExamples.completed.value.data,
)!;
const failedReview = adaptAiReviewData(aiReviewExamples.failed.value.data)!;

const context = {
  userId: acceptedSubmission.userId,
  submissionId: acceptedSubmission.id,
};

function setupController(options = {}) {
  const judge = {
    getSubmission: vi.fn().mockResolvedValue(acceptedSubmission),
    getAiReview: vi.fn().mockResolvedValue(completedReview),
  };
  const controller = createAiReviewController(
    { judge } as unknown as ApiClient,
    context,
    options,
  );
  return { controller, judge };
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not allocate port"));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

async function waitForMockServer(origin: string, childExited: () => boolean) {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    if (childExited()) {
      throw new Error("Mock server exited early");
    }
    try {
      const res = await fetch(`${origin}/api/v1/languages`);
      if (res.ok) return;
    } catch {
      // Wait for mock startup
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error("Timed out waiting for mock server");
}

afterEach(() => {
  vi.useRealTimers();
});

describe("aiReviewModel pure helpers", () => {
  it("formats status labels, scores, line ranges and source lines safely", () => {
    expect(resolveUiAiStatus(null)).toBe("not_scheduled");
    expect(resolveUiAiStatus(queuedReview)).toBe("queued");
    expect(AI_REVIEW_STATUS_META.failed.label).toContain("Failed");

    expect(formatAiScore(null)).toBe("—");
    expect(formatAiScore(87.5)).toBe("87.5 / 100");
    expect(formatAiScore(90)).toBe("90 / 100");

    expect(formatLineRange(null, null)).toBe("Tổng quát");
    expect(formatLineRange(2, null)).toBe("Dòng 2");
    expect(formatLineRange(1, 3)).toBe("Dòng 1–3");

    expect(splitSourceLines("")).toEqual([""]);
    expect(splitSourceLines("a = 1\nb = 2")).toEqual(["a = 1", "b = 2"]);

    const finding = completedReview.findings[0];
    expect(isLineHighlighted(1, finding)).toBe(true);
    expect(isLineHighlighted(2, finding)).toBe(true);
    expect(isLineHighlighted(3, finding)).toBe(false);
    expect(formatAiDateTime("invalid-date")).toBe("—");
  });
});

describe("createAiReviewController lifecycle", () => {
  it("polls null -> queued -> running -> completed sequentially and stops on completed", async () => {
    vi.useFakeTimers();
    const { controller, judge } = setupController({ intervalMs: 3_000 });
    judge.getAiReview
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(queuedReview)
      .mockResolvedValueOnce(runningReview)
      .mockResolvedValueOnce(completedReview);

    await controller.start();
    expect(controller.getSnapshot().phase).toBe("polling");
    expect(controller.getSnapshot().review).toBeNull();

    await vi.advanceTimersByTimeAsync(3_000);
    expect(controller.getSnapshot().review?.status).toBe("queued");

    await vi.advanceTimersByTimeAsync(3_000);
    expect(controller.getSnapshot().review?.status).toBe("running");

    await vi.advanceTimersByTimeAsync(3_000);
    expect(controller.getSnapshot().phase).toBe("ready");
    expect(controller.getSnapshot().review?.status).toBe("completed");
    expect(controller.getSnapshot().selectedFindingId).toBe(
      completedReview.findings[0]?.id ?? null,
    );

    await vi.advanceTimersByTimeAsync(12_000);
    expect(judge.getAiReview).toHaveBeenCalledTimes(4);
    controller.dispose();
  });

  it("stops on failed AI review without altering the Accepted submission", async () => {
    vi.useFakeTimers();
    const { controller, judge } = setupController({ intervalMs: 3_000 });
    judge.getAiReview
      .mockResolvedValueOnce(runningReview)
      .mockResolvedValueOnce(failedReview);

    await controller.start();
    expect(controller.getSnapshot().phase).toBe("polling");

    await vi.advanceTimersByTimeAsync(3_000);
    expect(controller.getSnapshot()).toMatchObject({
      phase: "ready",
      submission: { status: "Accepted", isAccepted: true },
      review: {
        status: "failed",
        errorMessage: "Review is temporarily unavailable",
      },
    });

    await vi.advanceTimersByTimeAsync(9_000);
    expect(judge.getAiReview).toHaveBeenCalledTimes(2);
    controller.dispose();
  });

  it("marks non-Accepted submissions ineligible without calling /ai-review", async () => {
    const { controller, judge } = setupController();
    judge.getSubmission.mockResolvedValueOnce(wrongAnswerSubmission);

    await controller.start();
    expect(controller.getSnapshot().phase).toBe("ineligible");
    expect(controller.getSnapshot().submission?.status).toBe("Wrong Answer");
    expect(judge.getAiReview).not.toHaveBeenCalled();
    controller.dispose();
  });

  it("handles 409 AI_REVIEW_NOT_ELIGIBLE gracefully while keeping submission", async () => {
    const { controller, judge } = setupController();
    judge.getAiReview.mockRejectedValueOnce(
      new ApiError(409, "AI_REVIEW_NOT_ELIGIBLE"),
    );

    await controller.start();
    expect(controller.getSnapshot().phase).toBe("ineligible");
    expect(controller.getSnapshot().submission?.id).toBe(acceptedSubmission.id);
    controller.dispose();
  });

  it("bounds polling by maxPolls and supports manual resume/retryRead", async () => {
    vi.useFakeTimers();
    const { controller, judge } = setupController({
      intervalMs: 2_000,
      maxPolls: 1,
    });
    judge.getAiReview
      .mockResolvedValueOnce(queuedReview)
      .mockResolvedValueOnce(runningReview)
      .mockResolvedValueOnce(completedReview);

    await controller.start();
    expect(controller.getSnapshot().phase).toBe("polling");

    await vi.advanceTimersByTimeAsync(2_000);
    expect(controller.getSnapshot()).toMatchObject({
      phase: "paused",
      exhausted: true,
      review: { status: "running" },
    });

    await controller.retryRead();
    expect(controller.getSnapshot()).toMatchObject({
      phase: "ready",
      exhausted: false,
      review: { status: "completed" },
    });
    expect(judge.getAiReview).toHaveBeenCalledTimes(3);
    controller.dispose();
  });

  it("pauses cleanly, recovers from transient errors, and preserves Accepted verdict", async () => {
    vi.useFakeTimers();
    const { controller, judge } = setupController({
      intervalMs: 2_000,
      timeoutMs: 50,
    });
    judge.getAiReview
      .mockResolvedValueOnce(queuedReview)
      .mockRejectedValueOnce(new ApiError(502, "UPSTREAM_ERROR"))
      .mockResolvedValueOnce(completedReview);

    await controller.start();
    controller.pause();
    expect(controller.getSnapshot().phase).toBe("paused");
    await vi.advanceTimersByTimeAsync(6_000);
    expect(judge.getAiReview).toHaveBeenCalledTimes(1);

    await controller.resume();
    expect(controller.getSnapshot()).toMatchObject({
      phase: "paused",
      submission: { isAccepted: true },
    });
    expect(controller.getSnapshot().pollError).toBeInstanceOf(ApiError);

    await controller.retryRead();
    expect(controller.getSnapshot().phase).toBe("ready");
    expect(controller.getSnapshot().pollError).toBeNull();
    controller.dispose();
  });

  it("rejects mismatched owner or submissionId contract payloads", async () => {
    const { controller, judge } = setupController();
    judge.getSubmission.mockResolvedValueOnce({
      ...acceptedSubmission,
      userId: "99999999-9999-4999-8999-999999999999",
    });

    await controller.start();
    expect(controller.getSnapshot().phase).toBe("error");
    expect(controller.getSnapshot().submission).toBeNull();
    expect(judge.getAiReview).not.toHaveBeenCalled();

    judge.getSubmission.mockResolvedValueOnce(acceptedSubmission);
    judge.getAiReview.mockResolvedValueOnce(
      adaptAiReview({
        ...aiReviewExamples.completed.value.data.review,
        submissionId: "99999999-9999-4999-8999-999999999999",
      }),
    );

    await controller.start();
    expect(controller.getSnapshot().phase).toBe("error");
    expect(controller.getSnapshot().error).toBeInstanceOf(ApiError);
    controller.dispose();
  });

  it("supports React StrictMode cleanup-then-remount lifecycle via activate()", async () => {
    const { controller } = setupController();
    controller.dispose();
    controller.activate();
    await controller.start();
    expect(controller.getSnapshot().phase).toBe("ready");
    expect(controller.getSnapshot().review?.status).toBe("completed");
    controller.dispose();
  });
});

describe("AiReviewContent markup & XSS safety", () => {
  it("escapes dynamic summary, findings, dimensions, errorMessage and source code safely", () => {
    const customReview = adaptAiReview({
      ...aiReviewExamples.completed.value.data.review,
      summary: '<script>alert("xss")</script>Clean code',
      dimensions: {
        customMetric: 92,
        security_audit: 84,
      },
      findings: [
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          severity: "warning",
          lineStart: 1,
          lineEnd: 2,
          title: '<img src=x onerror="alert(1)">Title',
          explanation: "Explanation <script>bad()</script>",
          suggestion: "Use <b>const</b> safely",
          displayOrder: 1,
        },
      ],
    });

    const markup = renderToStaticMarkup(
      createElement(AiReviewContent, {
        state: {
          phase: "ready",
          submission: {
            ...acceptedSubmission,
            code: "<script>evil()</script>\nprint(a + b)",
          },
          review: customReview,
          error: null,
          pollError: null,
          exhausted: false,
          selectedFindingId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        },
      }),
    );

    expect(markup).not.toContain("<script>");
    expect(markup).not.toContain("<img ");
    expect(markup).toContain("Custom Metric");
    expect(markup).toContain("Security audit");
    expect(markup).toContain("87.5 / 100");
    expect(markup).toContain("Accepted");

    const submissionMarkup = renderToStaticMarkup(
      createElement(SubmissionResult, {
        state: {
          phase: "terminal",
          submission: acceptedSubmission,
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
          initialized: true,
        },
      }),
    );
    expect(submissionMarkup).toContain(
      `/submissions/${acceptedSubmission.id}/ai-review`,
    );
  });
});

describe("live HTTP mock Sprint 4 AI review integration", () => {
  it("connects auth -> submit -> Accepted -> poll ai-review null -> queued -> running -> completed", async () => {
    const port = await getFreePort();
    const origin = `http://127.0.0.1:${port}`;
    let exited = false;
    const child = spawn(process.execPath, ["scripts/mock.mjs"], {
      cwd: new URL("..", import.meta.url),
      env: {
        ...process.env,
        MOCK_PORT: String(port),
        MOCK_ORIGIN: origin,
        MOCK_SUBMISSION_DEMO: "1",
        MOCK_EDITOR_DEMO: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.on("exit", () => {
      exited = true;
    });

    try {
      await waitForMockServer(origin, () => exited);
      const transport = createTransport(origin, globalThis.fetch);
      const sessionStore = createSession(transport);
      const client = createApiClient({
        authRequest: sessionStore.request,
        publicRequest: transport,
      });
      await sessionStore.login({
        email: "learner@example.com",
        password: "Coding2026",
      });
      const currentUser = sessionStore.getSnapshot().user;
      expect(currentUser).not.toBeNull();
      const detail = await client.catalog.getProblem("sum-two");
      const created = await client.judge.submitCode({
        problemId: detail.problem.id,
        languageId: detail.languages[0].id,
        code: "a, b = map(int, input().split())\nprint(a + b)\n",
      });
      expect(created.status).toBe("Pending");

      // Non-Accepted submission returns 409 AI_REVIEW_NOT_ELIGIBLE
      await expect(client.judge.getAiReview(created.id)).rejects.toMatchObject({
        status: 409,
        code: "AI_REVIEW_NOT_ELIGIBLE",
      });

      // Advance submission to Accepted
      await client.judge.getSubmission(created.id);
      const accepted = await client.judge.getSubmission(created.id);
      expect(accepted.status).toBe("Accepted");

      const controller = createAiReviewController(
        client,
        { userId: currentUser!.id, submissionId: created.id },
        { intervalMs: 50, maxPolls: 10 },
      );

      await controller.start();
      expect(controller.getSnapshot().review).toBeNull();
      expect(controller.getSnapshot().phase).toBe("polling");

      const deadline = Date.now() + 3_000;
      while (
        controller.getSnapshot().phase !== "ready" &&
        Date.now() < deadline
      ) {
        await new Promise((r) => setTimeout(r, 40));
      }

      const finalState = controller.getSnapshot();
      expect(finalState.phase).toBe("ready");
      expect(finalState.submission?.isAccepted).toBe(true);
      expect(finalState.review?.status).toBe("completed");
      expect(finalState.review?.score).toBe(88.5);
      expect(finalState.review?.findings.length).toBeGreaterThan(0);
      controller.dispose();
    } finally {
      child.kill();
    }
  }, 15_000);
});
