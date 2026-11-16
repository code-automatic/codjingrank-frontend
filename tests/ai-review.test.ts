import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
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
  isSubmissionOwner,
  resolveAiReviewErrorMessage,
  resolveUiAiStatus,
  splitSourceLines,
} from "@/features/ai-review/aiReviewModel";
import {
  createAiReviewController,
  type AiReviewState,
} from "@/features/ai-review/controller";
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

const submissionExample =
  spec.paths["/api/v1/submissions/{id}"].get.responses["200"].content[
    "application/json"
  ].examples.accepted.value.data.submission;

const aiReviewExample =
  spec.paths["/api/v1/submissions/{id}/ai-review"].get.responses["200"].content[
    "application/json"
  ].examples.completed.value.data.review;

describe("AI review model helpers", () => {
  it("resolves UI statuses and labels", () => {
    expect(resolveUiAiStatus(null)).toBe("not_scheduled");
    expect(AI_REVIEW_STATUS_META.not_scheduled.label).toBe("Chưa xếp hàng AI");
    expect(AI_REVIEW_STATUS_META.completed.tone).toBe("pass");
    expect(AI_REVIEW_STATUS_META.failed.tone).toBe("fail");
  });

  it("formats scores and line ranges", () => {
    expect(formatAiScore(null)).toBe("—");
    expect(formatAiScore(85.45)).toBe("85.5 / 100");
    expect(formatAiScore(100)).toBe("100 / 100");

    const finding = adaptAiReview(aiReviewExample).findings[0];
    expect(formatLineRange(finding)).toBe("Dòng 1–2");

    const singleLine = { ...finding, lineStart: 5, lineEnd: 5 };
    expect(formatLineRange(singleLine)).toBe("Dòng 5");

    const wholeFile = { ...finding, lineStart: null, lineEnd: null };
    expect(formatLineRange(wholeFile)).toBe("Toàn bài");
  });

  it("splits lines and detects line highlights", () => {
    const lines = splitSourceLines("a = 1\nb = 2\nc = 3");
    expect(lines).toEqual(["a = 1", "b = 2", "c = 3"]);

    const finding = adaptAiReview(aiReviewExample).findings[0];
    expect(isLineHighlighted(1, finding)).toBe(true);
    expect(isLineHighlighted(2, finding)).toBe(true);
    expect(isLineHighlighted(3, finding)).toBe(false);
    expect(isLineHighlighted(1, null)).toBe(false);
  });

  it("formats dates and resolves error messages", () => {
    expect(formatAiDateTime(null)).toBe("—");
    expect(formatAiDateTime("invalid-date")).toBe("—");
    expect(formatAiDateTime("2026-11-07T12:00:00Z")).toContain("2026");

    expect(
      resolveAiReviewErrorMessage(new ApiError(409, "AI_REVIEW_NOT_ELIGIBLE")),
    ).toContain("chưa đạt kết quả Accepted");
    expect(
      resolveAiReviewErrorMessage(new ApiError(404, "NOT_FOUND")),
    ).toContain("Không tìm thấy dữ liệu");
  });

  it("checks submission owner", () => {
    const sub = adaptSubmission(submissionExample);
    expect(isSubmissionOwner(sub, sub.userId)).toBe(true);
    expect(isSubmissionOwner(sub, "wrong-user")).toBe(false);
    expect(isSubmissionOwner(null, sub.userId)).toBe(false);
  });
});

describe("AI review controller", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeMockApiClient(overrides?: {
    submission?: unknown;
    aiReviewSequence?: Array<unknown | Error>;
  }) {
    const defaultSub = adaptSubmission(submissionExample);
    const seq = overrides?.aiReviewSequence ?? [adaptAiReview(aiReviewExample)];
    let callIdx = 0;

    const judge = {
      getSubmission: vi.fn(async () => {
        if (overrides?.submission instanceof Error) {
          throw overrides.submission;
        }
        return (overrides?.submission as typeof defaultSub) ?? defaultSub;
      }),
      getAiReview: vi.fn(async () => {
        const item = seq[Math.min(callIdx, seq.length - 1)];
        callIdx++;
        if (item instanceof Error) {
          throw item;
        }
        return item as ReturnType<typeof adaptAiReviewData>;
      }),
    };

    return {
      api: { judge } as unknown as ApiClient,
      judge,
    };
  }

  it("loads submission and completed review into ready phase", async () => {
    const sub = adaptSubmission(submissionExample);
    const rev = adaptAiReview(aiReviewExample);
    const { api } = makeMockApiClient({
      submission: sub,
      aiReviewSequence: [rev],
    });

    const controller = createAiReviewController(api, {
      userId: sub.userId,
      submissionId: sub.id,
    });

    await controller.start();
    const snap = controller.getSnapshot();

    expect(snap.phase).toBe("ready");
    expect(snap.submission?.id).toBe(sub.id);
    expect(snap.review?.status).toBe("completed");
    expect(snap.selectedFindingId).toBe(rev.findings[0]?.id);
    controller.dispose();
  });

  it("transitions to ineligible when submission is not accepted", async () => {
    const sub = adaptSubmission({
      ...submissionExample,
      status: "Wrong Answer",
    });
    const { api } = makeMockApiClient({ submission: sub });

    const controller = createAiReviewController(api, {
      userId: sub.userId,
      submissionId: sub.id,
    });

    await controller.start();
    const snap = controller.getSnapshot();

    expect(snap.phase).toBe("ineligible");
    expect(snap.submission?.status).toBe("Wrong Answer");
    expect(snap.review).toBeNull();
    controller.dispose();
  });

  it("transitions to ineligible when getAiReview returns 409 AI_REVIEW_NOT_ELIGIBLE", async () => {
    const sub = adaptSubmission(submissionExample);
    const err = new ApiError(409, "AI_REVIEW_NOT_ELIGIBLE");
    const { api } = makeMockApiClient({
      submission: sub,
      aiReviewSequence: [err],
    });

    const controller = createAiReviewController(api, {
      userId: sub.userId,
      submissionId: sub.id,
    });

    await controller.start();
    const snap = controller.getSnapshot();

    expect(snap.phase).toBe("ineligible");
    expect(snap.submission?.id).toBe(sub.id);
    controller.dispose();
  });

  it("polls sequentially from null to queued to completed and stops", async () => {
    vi.useFakeTimers();
    try {
      const sub = adaptSubmission(submissionExample);
      const queuedRev = adaptAiReview({
        ...aiReviewExample,
        status: "queued",
        score: null,
      });
      const completedRev = adaptAiReview(aiReviewExample);

      const { api, judge } = makeMockApiClient({
        submission: sub,
        aiReviewSequence: [null, queuedRev, completedRev],
      });

      const controller = createAiReviewController(
        api,
        { userId: sub.userId, submissionId: sub.id },
        { intervalMs: 100 },
      );

      const startPromise = controller.start();
      await vi.advanceTimersByTimeAsync(0);
      await startPromise;

      expect(controller.getSnapshot().phase).toBe("polling");
      expect(controller.getSnapshot().review).toBeNull();

      await vi.advanceTimersByTimeAsync(100);
      expect(controller.getSnapshot().review?.status).toBe("queued");
      expect(controller.getSnapshot().phase).toBe("polling");

      await vi.advanceTimersByTimeAsync(100);
      expect(controller.getSnapshot().review?.status).toBe("completed");
      expect(controller.getSnapshot().phase).toBe("ready");

      await vi.advanceTimersByTimeAsync(300);
      expect(judge.getAiReview).toHaveBeenCalledTimes(3);
      controller.dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it("handles pause and resume cleanly", async () => {
    vi.useFakeTimers();
    try {
      const sub = adaptSubmission(submissionExample);
      const queuedRev = adaptAiReview({
        ...aiReviewExample,
        status: "queued",
      });

      const { api } = makeMockApiClient({
        submission: sub,
        aiReviewSequence: [queuedRev],
      });

      const controller = createAiReviewController(
        api,
        { userId: sub.userId, submissionId: sub.id },
        { intervalMs: 200 },
      );

      await controller.start();
      expect(controller.getSnapshot().phase).toBe("polling");

      controller.pause();
      expect(controller.getSnapshot().phase).toBe("paused");

      controller.resume();
      expect(controller.getSnapshot().phase).toBe("polling");
      controller.dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it("marks exhausted when maxPolls is reached without completion", async () => {
    vi.useFakeTimers();
    try {
      const sub = adaptSubmission(submissionExample);
      const queuedRev = adaptAiReview({
        ...aiReviewExample,
        status: "queued",
      });

      const { api } = makeMockApiClient({
        submission: sub,
        aiReviewSequence: [queuedRev],
      });

      const controller = createAiReviewController(
        api,
        { userId: sub.userId, submissionId: sub.id },
        { intervalMs: 50, maxPolls: 2 },
      );

      await controller.start();
      expect(controller.getSnapshot().phase).toBe("polling");

      await vi.advanceTimersByTimeAsync(50);
      await vi.advanceTimersByTimeAsync(50);

      const snap = controller.getSnapshot();
      expect(snap.exhausted).toBe(true);
      expect(snap.phase).toBe("paused");
      controller.dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it("handles failed AI review without affecting Accepted submission", async () => {
    const sub = adaptSubmission(submissionExample);
    const failedRev = adaptAiReview({
      ...aiReviewExample,
      status: "failed",
      errorMessage: "AI service timeout",
    });

    const { api } = makeMockApiClient({
      submission: sub,
      aiReviewSequence: [failedRev],
    });

    const controller = createAiReviewController(api, {
      userId: sub.userId,
      submissionId: sub.id,
    });

    await controller.start();
    const snap = controller.getSnapshot();

    expect(snap.phase).toBe("ready");
    expect(snap.submission?.isAccepted).toBe(true);
    expect(snap.review?.isFailed).toBe(true);
    expect(snap.review?.errorMessage).toBe("AI service timeout");
    controller.dispose();
  });
});

describe("SSR rendering and security", () => {
  it("renders static markup safely without XSS vulnerability", () => {
    const sub = adaptSubmission(submissionExample);
    const rev = adaptAiReview({
      ...aiReviewExample,
      summary: `<script>alert("xss-summary")</script>`,
      findings: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          severity: "warning",
          lineStart: 1,
          lineEnd: 2,
          title: `<b>XSS Title</b>`,
          explanation: `<img src=x onerror=alert(1)>`,
          suggestion: `javascript:alert(2)`,
          displayOrder: 1,
        },
      ],
    });

    const state: AiReviewState = {
      phase: "ready",
      submissionId: sub.id,
      submission: sub,
      review: rev,
      selectedFindingId: rev.findings[0]?.id ?? null,
      error: null,
      pollError: null,
      pollCount: 1,
      exhausted: false,
    };

    const html = renderToStaticMarkup(
      createElement(AiReviewContent, { state }),
    );

    expect(html).toContain(
      "&lt;script&gt;alert(&quot;xss-summary&quot;)&lt;/script&gt;",
    );
    expect(html).toContain("&lt;b&gt;XSS Title&lt;/b&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("Verdict: Accepted");
    expect(html).toContain("Độc lập với điểm AI &amp; xếp hạng");
  });

  it("renders link to AI review inside SubmissionResult only when Accepted", () => {
    const acceptedSub = adaptSubmission(submissionExample);
    const htmlAccepted = renderToStaticMarkup(
      createElement(SubmissionResult, {
        state: {
          phase: "terminal",
          submission: acceptedSub,
          history: { items: [], page: 1, size: 10, total: 0 },
          historyLoading: false,
          historyError: null,
          progress: null,
          unlockedLevels: [],
          cooldownUntil: 0,
          error: null,
          progressLoading: false,
          progressError: null,
          uncertain: false,
          initialized: true,
        },
      }),
    );

    expect(htmlAccepted).toContain("Xem đánh giá AI →");
    expect(htmlAccepted).toContain(
      `/submissions/${encodeURIComponent(acceptedSub.id)}/ai-review`,
    );

    const failedSub = adaptSubmission({
      ...submissionExample,
      status: "Wrong Answer",
    });
    const htmlFailed = renderToStaticMarkup(
      createElement(SubmissionResult, {
        state: {
          phase: "terminal",
          submission: failedSub,
          history: { items: [], page: 1, size: 10, total: 0 },
          historyLoading: false,
          historyError: null,
          progress: null,
          unlockedLevels: [],
          cooldownUntil: 0,
          error: null,
          progressLoading: false,
          progressError: null,
          uncertain: false,
          initialized: true,
        },
      }),
    );

    expect(htmlFailed).not.toContain("Xem đánh giá AI →");
  });
});

async function launchMockServer(): Promise<{
  child: ReturnType<typeof spawn>;
  url: string;
}> {
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL("../scripts/mock.mjs", import.meta.url))],
    {
      env: {
        ...process.env,
        MOCK_PORT: "0",
        MOCK_SUBMISSION_DEMO: "1",
        MOCK_EDITOR_DEMO: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let output = "";
  const url = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Timeout waiting for mock server stdout"));
    }, 10_000);

    child.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
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

describe("live HTTP mock Sprint 4 AI review integration", () => {
  it("connects auth -> submit -> Accepted -> poll ai-review null -> queued -> running -> completed", async () => {
    const { child, url: origin } = await launchMockServer();

    try {
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

      await expect(client.judge.getAiReview(created.id)).rejects.toMatchObject({
        status: 409,
        code: "AI_REVIEW_NOT_ELIGIBLE",
      });

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
