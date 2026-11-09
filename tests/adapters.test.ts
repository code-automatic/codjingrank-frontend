import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { parse } from "yaml";
import {
  ApiError,
  adaptAiReviewData,
  adaptCodeTemplate,
  adaptForumComment,
  adaptForumPost,
  adaptLandingData,
  adaptLatestSubmissionData,
  adaptLeaderboardData,
  adaptMyRankData,
  adaptPackageDetail,
  adaptProblemDetail,
  adaptProblemSummary,
  adaptRunData,
  adaptSubmissionData,
  adaptUserStats,
  canGuestReadLeaderboard,
} from "@/lib/api";

const UUID1 = "11111111-1111-4111-8111-111111111111";
const UUID2 = "22222222-2222-4222-8222-222222222221";
const UUID3 = "22222222-2222-4222-8222-222222222222";
const UUID4 = "22222222-2222-4222-8222-222222222223";

type OpenApiSpec = {
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
                example?: { data: unknown };
                examples?: Record<string, { value: { data: unknown } }>;
              };
            };
          }
        >;
      }
    >
  >;
};

const openApiSpec = parse(
  readFileSync(
    new URL("../contracts/openapi_fe.yaml", import.meta.url),
    "utf8",
  ),
) as OpenApiSpec;

function getOpenApiExampleData(
  path: string,
  method = "get",
  status = "200",
  exampleName?: string,
): unknown {
  const jsonContent =
    openApiSpec.paths[path]?.[method]?.responses[status]?.content?.[
      "application/json"
    ];
  if (exampleName) {
    return jsonContent?.examples?.[exampleName]?.value?.data;
  }
  return jsonContent?.example?.data;
}

describe("model adapters against OpenAPI contract", () => {
  it("adapts PackageDetail, sorts 3 levels [1..3], and computes empty-level completion", () => {
    const raw = {
      package: {
        id: UUID1,
        slug: "arrays",
        name: "Arrays",
        description: null,
        displayOrder: 0,
        totalProblems: 2,
      },
      // Deliberately out of order from wire
      levels: [
        {
          id: UUID4,
          packageId: UUID1,
          levelNo: 3,
          slug: "hard",
          name: "Hard",
          difficulty: "hard",
          total: 0,
          solved: 0,
          unlocked: false,
          completed: true,
        },
        {
          id: UUID2,
          packageId: UUID1,
          levelNo: 1,
          slug: "easy",
          name: "Easy",
          difficulty: "easy",
          total: 1,
          solved: 1,
          unlocked: true,
          completed: true,
        },
        {
          id: UUID3,
          packageId: UUID1,
          levelNo: 2,
          slug: "medium",
          name: "Medium",
          difficulty: "medium",
          total: 1,
          solved: 0,
          unlocked: true,
          completed: false,
        },
      ],
    };

    const adapted = adaptPackageDetail(raw);
    expect(adapted.levels.map((l) => l.levelNo)).toEqual([1, 2, 3]);
    expect(adapted.levels[0].lockStatus).toBe("completed");
    expect(adapted.levels[1].lockStatus).toBe("in_progress");
    expect(adapted.levels[2].lockStatus).toBe("locked");
    expect(adapted.levels[2].completionPercent).toBe(100);
    expect(adapted.solvedCount).toBe(1);
    expect(adapted.totalCount).toBe(2);
    expect(adapted.completionPercent).toBe(50);
    expect(adapted.highestUnlockedLevelNo).toBe(2);
  });

  it("rejects PackageDetail without exactly 3 matching levels", () => {
    const raw = {
      package: {
        id: UUID1,
        slug: "arrays",
        name: "Arrays",
        description: "desc",
        displayOrder: 0,
        totalProblems: 1,
      },
      levels: [
        {
          id: UUID2,
          packageId: UUID1,
          levelNo: 1,
          slug: "easy",
          name: "Easy",
          difficulty: "easy",
          total: 1,
          solved: 0,
          unlocked: true,
          completed: false,
        },
      ],
    };

    expect(() => adaptPackageDetail(raw)).toThrowError(ApiError);
    expect(() => adaptPackageDetail(raw)).toThrow("INVALID_CONTRACT_DATA");
  });

  it("adapts ProblemDetail and preserves CodeTemplate whitespace verbatim", () => {
    const detailData = getOpenApiExampleData("/api/v1/problems/{slug}");
    const problem = adaptProblemDetail(detailData);
    expect(problem.problem.canOpen).toBe(true);
    expect(problem.problem.formattedAcceptanceRate).toBe("50%");
    expect(problem.hasSamples).toBe(true);
    expect(problem.isFunctionMode).toBe(false);
    expect(problem.languages[0].displayLabel).toBe("Python 3 (3.12)");

    const rawTemplate = {
      problemId: UUID1,
      languageId: UUID1,
      starterCode: "  def solve():\n    pass\n\n",
      fileName: "main.py",
    };
    const tpl = adaptCodeTemplate(rawTemplate);
    expect(tpl.starterCode).toBe("  def solve():\n    pass\n\n");
  });

  it("adapts synchronous Run verdicts including Wrong Answer without throwing", () => {
    const run = adaptRunData({
      status: "Wrong Answer",
      passed: 1,
      total: 2,
      results: [
        {
          testCaseId: UUID1,
          status: "Accepted",
          inputData: "1 2\n",
          expectedOutput: "3\n",
          actualOutput: "3\n",
          runtimeMs: 10,
          errorMessage: null,
          errorType: null,
          stderr: null,
        },
        {
          testCaseId: UUID2,
          status: "Wrong Answer",
          inputData: "2 2\n",
          expectedOutput: "4\n",
          actualOutput: "5\n",
          runtimeMs: 12,
          errorMessage: null,
          errorType: null,
          stderr: null,
        },
      ],
    });
    expect(run.allPassed).toBe(false);
    expect(run.results[0].isPassed).toBe(true);
    expect(run.results[1].isPassed).toBe(false);
  });

  it("computes Submission polling flags across Pending, Running, Accepted, Wrong Answer, and nullable latest", () => {
    const pending = adaptSubmissionData(
      getOpenApiExampleData(
        "/api/v1/submissions/{id}",
        "get",
        "200",
        "pending",
      ),
    );
    expect(pending.isPending).toBe(true);
    expect(pending.shouldPoll).toBe(true);
    expect(pending.isTerminal).toBe(false);

    const accepted = adaptSubmissionData(
      getOpenApiExampleData(
        "/api/v1/submissions/{id}",
        "get",
        "200",
        "accepted",
      ),
    );
    expect(accepted.isPending).toBe(false);
    expect(accepted.shouldPoll).toBe(false);
    expect(accepted.isAccepted).toBe(true);
    expect(accepted.canHaveAiReview).toBe(true);
    expect(accepted.passPercent).toBe(100);

    const wrong = adaptSubmissionData(
      getOpenApiExampleData(
        "/api/v1/submissions/{id}",
        "get",
        "200",
        "wrongAnswer",
      ),
    );
    expect(wrong.isTerminal).toBe(true);
    expect(wrong.isAccepted).toBe(false);
    expect(wrong.canHaveAiReview).toBe(false);
    expect(wrong.passPercent).toBe(33);

    expect(adaptLatestSubmissionData({ submission: null })).toBeNull();
  });

  it("adapts all 5 AiReview lifecycle states from OpenAPI spec cleanly", () => {
    const none = adaptAiReviewData(
      getOpenApiExampleData(
        "/api/v1/submissions/{id}/ai-review",
        "get",
        "200",
        "notScheduledYet",
      ),
    );
    expect(none).toBeNull();

    const queued = adaptAiReviewData(
      getOpenApiExampleData(
        "/api/v1/submissions/{id}/ai-review",
        "get",
        "200",
        "queued",
      ),
    );
    expect(queued?.shouldPoll).toBe(true);
    expect(queued?.dimensionList).toEqual([]);

    const completed = adaptAiReviewData(
      getOpenApiExampleData(
        "/api/v1/submissions/{id}/ai-review",
        "get",
        "200",
        "completed",
      ),
    );
    expect(completed?.isCompleted).toBe(true);
    expect(completed?.shouldPoll).toBe(false);
    expect(completed?.score).toBe(87.5);
    expect(completed?.dimensionList).toEqual([
      { key: "readability", label: "Readability", score: 85 },
      { key: "maintainability", label: "Maintainability", score: 90 },
    ]);
    expect(completed?.findings[0].hasLineRange).toBe(true);

    const failed = adaptAiReviewData(
      getOpenApiExampleData(
        "/api/v1/submissions/{id}/ai-review",
        "get",
        "200",
        "failed",
      ),
    );
    expect(failed?.isFailed).toBe(true);
    expect(failed?.shouldPoll).toBe(false);
    expect(failed?.score).toBeNull();
  });

  it("adapts Landing, UserStats, Leaderboard, MyRank, and Forum tombstones", () => {
    const landing = adaptLandingData(
      getOpenApiExampleData("/api/v1/public/landing"),
    );
    expect(landing.stats.problems).toBe(36);
    expect(landing.topUsers).toHaveLength(1);

    const stats = adaptUserStats(getOpenApiExampleData("/api/v1/me/stats"));
    expect(stats.hasRank).toBe(true);

    const lb = adaptLeaderboardData(
      getOpenApiExampleData("/api/v1/leaderboard", "get", "200", "populated"),
    );
    expect(lb.hasPeriodBounds).toBe(false);
    expect(canGuestReadLeaderboard({ scope: "all", page: 1, size: 50 })).toBe(
      true,
    );
    expect(canGuestReadLeaderboard({ scope: "week" })).toBe(false);
    expect(canGuestReadLeaderboard({ page: 2 })).toBe(false);

    const myRank = adaptMyRankData(
      getOpenApiExampleData("/api/v1/leaderboard/me"),
    );
    expect(myRank.isRanked).toBe(false);
    expect(myRank.entry).toBeNull();

    const post = adaptForumPost(
      (getOpenApiExampleData("/api/v1/forum/posts/{id}") as { post: unknown })
        .post,
    );
    expect(post.hasCodeSnippet).toBe(true);
    expect(post.isSolution).toBe(false);

    const tombstone = adaptForumComment({
      id: UUID1,
      postId: UUID2,
      parentId: null,
      author: {
        id: UUID3,
        username: "learner",
        fullName: null,
        avatarUrl: null,
      },
      content: null,
      isDeleted: true,
      createdAt: "2026-11-07T00:00:00Z",
      updatedAt: "2026-11-07T00:00:00Z",
    });
    expect(tombstone.isDeleted).toBe(true);
    expect(tombstone.content).toBeNull();
    expect(tombstone.displayContent).toContain("xóa");
  });

  it("enforces firewall against legacy integer IDs and forbidden admin/legacy fields", () => {
    const legacyIntProblem = {
      id: 42,
      slug: "sum-two",
      title: "Sum two numbers",
      packageId: UUID1,
      packageSlug: "arrays",
      levelId: UUID1,
      difficulty: "easy",
      tags: [],
      solved: false,
      unlocked: true,
      acceptanceRate: 50,
    };
    expect(() => adaptProblemSummary(legacyIntProblem)).toThrow(
      "INVALID_CONTRACT_DATA",
    );

    const forbiddenWrapperProblem = {
      ...(getOpenApiExampleData("/api/v1/problems/{slug}") as Record<
        string,
        unknown
      >),
      wrapperCode: "secret_wrapper()",
    };
    expect(() => adaptProblemDetail(forbiddenWrapperProblem)).toThrow(
      "INVALID_CONTRACT_DATA",
    );
  });
});
