import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import type { ApiClient } from "@/lib/api";
import { adaptAiReview, adaptSubmission } from "@/lib/api/adapters/judge";
import { createAiReviewController } from "@/features/ai-review/controller";

const spec = parse(
  readFileSync(
    new URL("../contracts/openapi_fe.yaml", import.meta.url),
    "utf8",
  ),
);
const submissionDto =
  spec.paths["/api/v1/submissions/{id}"].get.responses["200"].content[
    "application/json"
  ].examples.accepted.value.data.submission;
const reviewDto =
  spec.paths["/api/v1/submissions/{id}/ai-review"].get.responses["200"].content[
    "application/json"
  ].examples.queued.value.data.review;
const submission = adaptSubmission(submissionDto);
const review = adaptAiReview(reviewDto);

function setup() {
  const judge = {
    getSubmission: vi.fn().mockResolvedValue(submission),
    getAiReview: vi.fn().mockResolvedValue(review),
  };
  const controller = createAiReviewController(
    { judge } as unknown as ApiClient,
    { userId: submission.userId, submissionId: submission.id },
    { intervalMs: 20, deadlineMs: 30, maxPolls: 2 },
  );
  return { judge, controller };
}

afterEach(() => vi.useRealTimers());

describe("AI review lifecycle regressions", () => {
  it("surfaces an initial deadline instead of staying in loading forever", async () => {
    vi.useFakeTimers();
    const { controller, judge } = setup();
    judge.getSubmission.mockImplementation(() => new Promise(() => {}));
    const pending = controller.start();
    await vi.advanceTimersByTimeAsync(31);
    await pending;
    expect(controller.getSnapshot()).toMatchObject({
      phase: "error",
      error: { code: "REQUEST_TIMEOUT" },
    });
    controller.dispose();
  });
  it("pauses with a retryable error when a poll exceeds its deadline", async () => {
    vi.useFakeTimers();
    const { controller, judge } = setup();
    await controller.start();
    judge.getAiReview.mockImplementation(() => new Promise(() => {}));
    await vi.advanceTimersByTimeAsync(51);
    expect(controller.getSnapshot()).toMatchObject({
      phase: "paused",
      pollError: { code: "REQUEST_TIMEOUT" },
    });
    expect(controller.getSnapshot().submission?.isAccepted).toBe(true);
    controller.dispose();
  });
  it("allows a fresh bounded waiting window after retry-read", async () => {
    vi.useFakeTimers();
    const { controller } = setup();
    await controller.start();
    await vi.advanceTimersByTimeAsync(40);
    expect(controller.getSnapshot().exhausted).toBe(true);
    controller.resume();
    await vi.advanceTimersByTimeAsync(0);
    expect(controller.getSnapshot()).toMatchObject({
      phase: "polling",
      pollCount: 1,
      exhausted: false,
    });
    await vi.advanceTimersByTimeAsync(20);
    expect(controller.getSnapshot().phase).toBe("paused");
    controller.dispose();
  });
  it("rejects a submission whose id differs from the requested route", async () => {
    const { controller, judge } = setup();
    judge.getSubmission.mockResolvedValue({
      ...submission,
      id: "22222222-2222-4222-8222-222222222222",
    });
    await controller.start();
    expect(controller.getSnapshot().phase).toBe("error");
    expect(controller.getSnapshot().submission).toBeNull();
    controller.dispose();
  });
  it("restarts an interrupted initial load after a Strict Mode style reactivation", async () => {
    vi.useFakeTimers();
    const { controller, judge } = setup();
    judge.getAiReview.mockImplementationOnce(() => new Promise(() => {}));
    const first = controller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(controller.getSnapshot().submission?.id).toBe(submission.id);
    controller.dispose();
    controller.activate();
    await controller.start();
    await first;
    expect(judge.getAiReview).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot().phase).toBe("polling");
    controller.dispose();
  });

  it("allows an admin to read an authorized submission returned by the Gateway", async () => {
    const judge = {
      getSubmission: vi.fn().mockResolvedValue(submission),
      getAiReview: vi.fn().mockResolvedValue(review),
    };
    const controller = createAiReviewController(
      { judge } as unknown as ApiClient,
      {
        userId: "22222222-2222-4222-8222-222222222222",
        submissionId: submission.id,
        role: "admin",
      },
    );
    await controller.start();
    expect(controller.getSnapshot().phase).toBe("polling");
    controller.dispose();
  });
});
