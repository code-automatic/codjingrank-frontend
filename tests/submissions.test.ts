import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { createSubmissionController } from "@/features/submissions/controller";
import { SubmissionResult } from "@/features/submissions/SubmissionPanel";
import { ApiError, type ApiClient } from "@/lib/api";
import { adaptPackageDetail } from "@/lib/api/adapters/catalog";
import { adaptSubmission, SUBMISSION_STATUSES } from "@/lib/api/adapters/judge";

const spec = parse(
  readFileSync(
    new URL("../contracts/openapi_fe.yaml", import.meta.url),
    "utf8",
  ),
);
const raw =
  spec.paths["/api/v1/submit"].post.responses["201"].content["application/json"]
    .examples.pending.value.data.submission;
const progress = adaptPackageDetail(
  spec.paths["/api/v1/packages/{slug}/levels"].get.responses["200"].content[
    "application/json"
  ].example.data,
);
const pending = adaptSubmission(raw);
const accepted = adaptSubmission({
  ...raw,
  status: "Accepted",
  passCount: 5,
  totalTestcases: 5,
  runtimeMs: 2,
});
const context = {
  userId: pending.userId,
  problemId: pending.problemId,
  packageSlug: "arrays",
};
const payload = {
  problemId: pending.problemId,
  languageId: pending.languageId,
  code: "print(1)",
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
function setup(options = {}) {
  const judge = {
    getLatestSubmission: vi.fn().mockResolvedValue(null),
    listMySubmissions: vi
      .fn()
      .mockResolvedValue({ items: [], page: 1, size: 10, total: 0 }),
    submitCode: vi.fn().mockResolvedValue(pending),
    getSubmission: vi.fn().mockResolvedValue(accepted),
    getAiReview: vi.fn(),
  };
  const catalog = { getPackageLevels: vi.fn().mockResolvedValue(progress) };
  const controller = createSubmissionController(
    { judge, catalog } as unknown as ApiClient,
    context,
    options,
  );
  return { controller, judge, catalog };
}
afterEach(() => {
  vi.useRealTimers();
});

describe("Sprint 3 submission lifecycle", () => {
  it("submits exact source once, polls sequentially and displays Accepted without waiting for progress or AI", async () => {
    vi.useFakeTimers();
    const { controller: c, judge, catalog } = setup();
    await c.start();
    catalog.getPackageLevels.mockReturnValue(new Promise(() => {}));
    const job = c.submit(payload);
    await c.submit(payload);
    await job;
    expect(judge.submitCode).toHaveBeenCalledTimes(1);
    expect(judge.submitCode.mock.calls[0][0]).toEqual(payload);
    expect(c.getSnapshot().phase).toBe("polling");
    await vi.advanceTimersByTimeAsync(1500);
    expect(c.getSnapshot()).toMatchObject({
      phase: "terminal",
      submission: { status: "Accepted", passCount: 5 },
      progressLoading: true,
    });
    expect(judge.getAiReview).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(4500);
    expect(judge.getSubmission).toHaveBeenCalledTimes(1);
    c.dispose();
  });
  it.each(
    SUBMISSION_STATUSES.filter(
      (status) => status !== "Pending" && status !== "Running",
    ),
  )("stops polling on terminal %s", async (status) => {
    vi.useFakeTimers();
    const { controller: c, judge } = setup();
    await c.start();
    judge.getSubmission.mockResolvedValue(adaptSubmission({ ...raw, status }));
    await c.submit(payload);
    await vi.advanceTimersByTimeAsync(6000);
    expect(judge.getSubmission).toHaveBeenCalledTimes(1);
    expect(c.getSnapshot().phase).toBe("terminal");
    c.dispose();
  });
  it("continues Pending → Running → Accepted without overlapping requests", async () => {
    vi.useFakeTimers();
    const { controller: c, judge } = setup();
    await c.start();
    const slow = deferred<typeof pending>();
    judge.getSubmission.mockReturnValueOnce(slow.promise);
    await c.submit(payload);
    await vi.advanceTimersByTimeAsync(6000);
    expect(judge.getSubmission).toHaveBeenCalledTimes(1);
    slow.resolve(adaptSubmission({ ...raw, status: "Running" }));
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1500);
    expect(c.getSnapshot().submission?.status).toBe("Accepted");
    c.dispose();
  });
  it("pauses failed GET, retries GET only, and never repeats POST", async () => {
    vi.useFakeTimers();
    const { controller: c, judge } = setup();
    await c.start();
    judge.getSubmission.mockRejectedValueOnce(new ApiError(503, "UNAVAILABLE"));
    await c.submit(payload);
    await vi.advanceTimersByTimeAsync(1500);
    expect(c.getSnapshot().phase).toBe("paused");
    c.resume();
    await vi.advanceTimersByTimeAsync(0);
    expect(c.getSnapshot().phase).toBe("terminal");
    expect(judge.submitCode).toHaveBeenCalledTimes(1);
    c.dispose();
  });
  it("requires reconciliation after ambiguous POST and does not auto-resubmit", async () => {
    vi.useFakeTimers();
    const { controller: c, judge } = setup();
    await c.start();
    judge.submitCode.mockRejectedValueOnce(new TypeError("offline"));
    await c.submit(payload);
    await vi.advanceTimersByTimeAsync(20_000);
    await c.submit(payload);
    expect(c.getSnapshot().uncertain).toBe(true);
    expect(judge.submitCode).toHaveBeenCalledTimes(1);
    judge.getLatestSubmission.mockResolvedValue(accepted);
    await c.reconcile();
    expect(c.getSnapshot()).toMatchObject({
      uncertain: false,
      submission: { status: "Accepted" },
    });
    c.dispose();
  });
  it("respects Retry-After cooldown and validates UTF-8 size before POST", async () => {
    vi.useFakeTimers();
    const { controller: c, judge } = setup();
    await c.start();
    await c.submit({ ...payload, code: "é".repeat(51201) });
    expect(judge.submitCode).not.toHaveBeenCalled();
    judge.submitCode.mockRejectedValueOnce(
      new ApiError(429, "SUBMISSION_COOLDOWN", null, 30),
    );
    await c.submit(payload);
    await vi.advanceTimersByTimeAsync(29_000);
    await c.submit(payload);
    expect(judge.submitCode).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    await c.submit(payload);
    expect(judge.submitCode).toHaveBeenCalledTimes(2);
    c.dispose();
  });
  it("cannot submit until latest submission check succeeds", async () => {
    const { controller: c, judge } = setup();
    judge.getLatestSubmission.mockRejectedValue(
      new ApiError(503, "UNAVAILABLE"),
    );
    await c.start();
    await c.submit(payload);
    expect(judge.submitCode).not.toHaveBeenCalled();
    c.dispose();
  });
  it("clears session data and ignores late POST after logout/dispose and restart", async () => {
    const { controller: c, judge } = setup();
    await c.start();
    const late = deferred<typeof pending>();
    judge.submitCode.mockReturnValueOnce(late.promise);
    const job = c.submit(payload);
    c.dispose();
    await c.start();
    late.resolve(pending);
    await job;
    expect(c.getSnapshot().submission).toBeNull();
    c.dispose();
  });
  it("ignores old history pages and rejects other owners", async () => {
    const { controller: c, judge } = setup();
    await c.start();
    const late = deferred<{
      items: (typeof pending)[];
      page: number;
      size: number;
      total: number;
    }>();
    judge.listMySubmissions
      .mockReturnValueOnce(late.promise)
      .mockResolvedValueOnce({ items: [], page: 2, size: 10, total: 11 });
    const old = c.loadHistory(1);
    await c.loadHistory(2);
    late.resolve({ items: [], page: 1, size: 10, total: 0 });
    await old;
    expect(c.getSnapshot().history?.page).toBe(2);
    judge.listMySubmissions.mockResolvedValueOnce({
      items: [{ ...pending, userId: "another-owner" }],
      page: 1,
      size: 10,
      total: 1,
    });
    await c.loadHistory();
    expect(c.getSnapshot().history).toBeNull();
    expect(c.getSnapshot().historyError).toBeInstanceOf(ApiError);
    c.dispose();
  });
  it("uses only server-confirmed unlock differences and does not invent progress from pass count", async () => {
    const { controller: c, catalog } = setup();
    await c.start();
    const changed = {
      ...progress,
      levels: progress.levels.map((level) =>
        level.levelNo === 2 ? { ...level, unlocked: true } : level,
      ),
    };
    catalog.getPackageLevels.mockResolvedValueOnce(changed);
    await c.loadProgress();
    expect(c.getSnapshot().unlockedLevels).toEqual([2]);
    c.dispose();
  });
  it("bounds hung requests and total polling, and cancels on pause", async () => {
    vi.useFakeTimers();
    const { controller: c, judge } = setup({ maxPolls: 1, timeoutMs: 50 });
    await c.start();
    judge.getSubmission.mockResolvedValue(pending);
    await c.submit(payload);
    await vi.advanceTimersByTimeAsync(1500);
    expect(c.getSnapshot().phase).toBe("paused");
    expect(judge.getSubmission).toHaveBeenCalledTimes(1);
    c.resume();
    await vi.advanceTimersByTimeAsync(0);
    c.pause();
    await vi.advanceTimersByTimeAsync(5000);
    expect(judge.getSubmission).toHaveBeenCalledTimes(2);
    c.dispose();
    const next = setup({ timeoutMs: 50 });
    await next.controller.start();
    next.judge.submitCode.mockReturnValue(new Promise(() => {}));
    const task = next.controller.submit(payload);
    await vi.advanceTimersByTimeAsync(50);
    await task;
    expect(next.controller.getSnapshot()).toMatchObject({
      phase: "paused",
      uncertain: true,
    });
    next.controller.dispose();
  });
  it("restores a pending latest attempt after reload without creating a new submission", async () => {
    vi.useFakeTimers();
    const { controller: c, judge } = setup();
    judge.getLatestSubmission.mockResolvedValue(pending);
    await c.start();
    expect(c.getSnapshot().phase).toBe("polling");
    await vi.advanceTimersByTimeAsync(1500);
    expect(c.getSnapshot().submission?.isAccepted).toBe(true);
    expect(judge.submitCode).not.toHaveBeenCalled();
    c.dispose();
  });
  it("rejects stale owner detail without publishing it", async () => {
    const { controller: c, judge } = setup();
    await c.start();
    judge.getSubmission.mockResolvedValue({
      ...accepted,
      userId: "other-user",
    });
    await c.select(pending.id);
    expect(c.getSnapshot().submission).toBeNull();
    expect(c.getSnapshot().error).toBeInstanceOf(ApiError);
    c.dispose();
  });
  it("rejects a mismatched submission response and renders error strings as text", async () => {
    const { controller: c, judge } = setup();
    await c.start();
    judge.submitCode.mockResolvedValue({ ...pending, problemId: "wrong" });
    await c.submit(payload);
    expect(c.getSnapshot().submission).toBeNull();
    expect(c.getSnapshot().uncertain).toBe(true);
    const markup = renderToStaticMarkup(
      createElement(SubmissionResult, {
        state: {
          ...c.getSnapshot(),
          submission: { ...accepted, errorMessage: "<script>bad()</script>" },
        },
      }),
    );
    expect(markup).toContain("Accepted");
    expect(markup).toContain("5/5");
    expect(markup).not.toContain("<script>");
    c.dispose();
  });
});
