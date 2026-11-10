import {
  adaptPaginated,
  assertArray,
  assertEnum,
  assertInt,
  assertIsoDate,
  assertIsoDateTime,
  assertNonEmptyString,
  assertNullableInt,
  assertNullableIsoDate,
  assertNullableIsoDateTime,
  assertNullableNumber,
  assertNullableString,
  assertNumber,
  assertRecord,
  assertString,
  assertUuid,
} from "@/lib/api/guards";
import type {
  AiFindingDto,
  AiReviewDto,
  AiReviewStatus,
  PaginatedData,
  RunVerdict,
  SampleResultDto,
  SubmissionDto,
  SubmissionStatus,
  SubmissionSummaryDto,
  SubmissionTestMetadataDto,
  UserStatsDto,
} from "@/lib/api/types";

export const RUN_VERDICTS = [
  "Accepted",
  "Wrong Answer",
  "Time Limit Exceeded",
  "Memory Limit Exceeded",
  "Compilation Error",
  "Runtime Error",
  "Internal Error",
] as const;

export const SUBMISSION_STATUSES = [
  "Pending",
  "Running",
  ...RUN_VERDICTS,
] as const;

export const AI_REVIEW_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
] as const;

export const AI_SEVERITIES = ["info", "warning", "error"] as const;

export type SampleResultModel = SampleResultDto & {
  isPassed: boolean;
};

export type RunDataModel = {
  status: RunVerdict;
  passed: number;
  total: number;
  results: SampleResultModel[];
  allPassed: boolean;
};

export type SubmissionSummaryModel = SubmissionSummaryDto & {
  isPending: boolean;
  isTerminal: boolean;
  shouldPoll: boolean;
  isAccepted: boolean;
  canHaveAiReview: boolean;
  passPercent: number;
};

export type SubmissionModel = SubmissionDto & {
  isPending: boolean;
  isTerminal: boolean;
  shouldPoll: boolean;
  isAccepted: boolean;
  canHaveAiReview: boolean;
  passPercent: number;
};

export type SubmissionTestMetadataModel = SubmissionTestMetadataDto;

export type UserStatsModel = UserStatsDto & {
  hasRank: boolean;
};

export type AiFindingModel = AiFindingDto & {
  hasLineRange: boolean;
};

export type AiDimensionScore = {
  key: string;
  label: string;
  score: number;
};

export type AiReviewModel = AiReviewDto & {
  dimensionList: AiDimensionScore[];
  findings: AiFindingModel[];
  isPending: boolean;
  isTerminal: boolean;
  shouldPoll: boolean;
  isCompleted: boolean;
  isFailed: boolean;
};

export function isTerminalSubmissionStatus(status: SubmissionStatus): boolean {
  return status !== "Pending" && status !== "Running";
}

export function isTerminalAiReviewStatus(status: AiReviewStatus): boolean {
  return status === "completed" || status === "failed";
}

function humanizeDimensionKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/^\w/, (ch) => ch.toUpperCase());
}

export function adaptSampleResult(
  raw: unknown,
  field = "sampleResult",
): SampleResultModel {
  const r = assertRecord(raw, field);
  const status = assertEnum(r.status, RUN_VERDICTS, `${field}.status`);
  return {
    testCaseId: assertUuid(r.testCaseId, `${field}.testCaseId`),
    status,
    inputData: assertNullableString(r.inputData, `${field}.inputData`),
    expectedOutput: assertString(r.expectedOutput, `${field}.expectedOutput`),
    actualOutput: assertString(r.actualOutput, `${field}.actualOutput`),
    runtimeMs: assertNullableInt(r.runtimeMs, `${field}.runtimeMs`, 0),
    errorMessage: assertNullableString(r.errorMessage, `${field}.errorMessage`),
    errorType: assertNullableString(r.errorType, `${field}.errorType`),
    stderr: assertNullableString(r.stderr, `${field}.stderr`),
    isPassed: status === "Accepted",
  };
}

export function adaptRunData(raw: unknown, field = "runData"): RunDataModel {
  const r = assertRecord(raw, field);
  const status = assertEnum(r.status, RUN_VERDICTS, `${field}.status`);
  const passed = assertInt(r.passed, `${field}.passed`, 0);
  const total = assertInt(r.total, `${field}.total`, 0);
  const results = assertArray(r.results, `${field}.results`).map((item, i) =>
    adaptSampleResult(item, `${field}.results[${i}]`),
  );
  return {
    status,
    passed,
    total,
    results,
    allPassed: status === "Accepted" && total > 0 && passed === total,
  };
}

function adaptSubmissionBase(
  r: Record<string, unknown>,
  field: string,
): SubmissionSummaryModel {
  const status = assertEnum(r.status, SUBMISSION_STATUSES, `${field}.status`);
  const passCount = assertInt(r.passCount, `${field}.passCount`, 0);
  const totalTestcases = assertInt(
    r.totalTestcases,
    `${field}.totalTestcases`,
    0,
  );
  const isTerminal = isTerminalSubmissionStatus(status);
  const isAccepted = status === "Accepted";
  return {
    id: assertUuid(r.id, `${field}.id`),
    userId: assertUuid(r.userId, `${field}.userId`),
    problemId: assertUuid(r.problemId, `${field}.problemId`),
    languageId: assertUuid(r.languageId, `${field}.languageId`),
    problemSlug: assertNonEmptyString(r.problemSlug, `${field}.problemSlug`),
    problemTitle: assertNonEmptyString(r.problemTitle, `${field}.problemTitle`),
    languageSlug: assertNonEmptyString(r.languageSlug, `${field}.languageSlug`),
    status,
    runtimeMs: assertNullableInt(r.runtimeMs, `${field}.runtimeMs`, 0),
    memoryKb: assertNullableInt(r.memoryKb, `${field}.memoryKb`, 0),
    errorMessage: assertNullableString(r.errorMessage, `${field}.errorMessage`),
    passCount,
    totalTestcases,
    createdAt: assertIsoDateTime(r.createdAt, `${field}.createdAt`),
    judgedAt: assertNullableIsoDateTime(r.judgedAt, `${field}.judgedAt`),
    isPending: !isTerminal,
    isTerminal,
    shouldPoll: !isTerminal,
    isAccepted,
    canHaveAiReview: isAccepted,
    passPercent:
      totalTestcases === 0
        ? 0
        : Math.min(100, Math.round((passCount / totalTestcases) * 100)),
  };
}

export function adaptSubmissionSummary(
  raw: unknown,
  field = "submissionSummary",
): SubmissionSummaryModel {
  return adaptSubmissionBase(assertRecord(raw, field), field);
}

export function adaptSubmission(
  raw: unknown,
  field = "submission",
): SubmissionModel {
  const r = assertRecord(raw, field);
  return {
    ...adaptSubmissionBase(r, field),
    // Preserve exact user source bytes
    code: assertString(r.code, `${field}.code`),
  };
}

export function adaptSubmissionData(raw: unknown): SubmissionModel {
  const r = assertRecord(raw, "submissionData");
  return adaptSubmission(r.submission, "submissionData.submission");
}

export function adaptLatestSubmissionData(
  raw: unknown,
): SubmissionModel | null {
  const r = assertRecord(raw, "latestSubmissionData");
  if (r.submission === null) return null;
  return adaptSubmission(r.submission, "latestSubmissionData.submission");
}

export function adaptMySubmissionsPage(
  raw: unknown,
): PaginatedData<SubmissionSummaryModel> {
  return adaptPaginated(raw, "submissionsPage", (item, i) =>
    adaptSubmissionSummary(item, `submissionsPage.items[${i}]`),
  );
}

export function adaptSubmissionTestMetadata(
  raw: unknown,
  field = "testResult",
): SubmissionTestMetadataModel {
  const r = assertRecord(raw, field);
  return {
    testOrdinal: assertInt(r.testOrdinal, `${field}.testOrdinal`, 1),
    status: assertEnum(r.status, RUN_VERDICTS, `${field}.status`),
    runtimeMs: assertNullableInt(r.runtimeMs, `${field}.runtimeMs`, 0),
  };
}

export function adaptSubmissionTestResultsResponse(
  raw: unknown,
): SubmissionTestMetadataModel[] {
  const r = assertRecord(raw, "testResultsData");
  return assertArray(r.items, "testResultsData.items")
    .map((item, i) =>
      adaptSubmissionTestMetadata(item, `testResultsData.items[${i}]`),
    )
    .sort((a, b) => a.testOrdinal - b.testOrdinal);
}

export function adaptUserStats(
  raw: unknown,
  field = "userStats",
): UserStatsModel {
  const r = assertRecord(raw, field);
  const streak = assertRecord(r.streak, `${field}.streak`);
  const solvedCount = assertRecord(r.solvedCount, `${field}.solvedCount`);
  const rank = assertRecord(r.rank, `${field}.rank`);
  const rawActivity = assertArray(r.activity, `${field}.activity`);

  const currentRank = assertNullableInt(
    rank.currentRank,
    `${field}.rank.currentRank`,
    1,
  );

  return {
    streak: {
      currentStreak: assertInt(
        streak.currentStreak,
        `${field}.streak.currentStreak`,
        0,
      ),
      maxStreak: assertInt(streak.maxStreak, `${field}.streak.maxStreak`, 0),
      lastActiveDate: assertNullableIsoDate(
        streak.lastActiveDate,
        `${field}.streak.lastActiveDate`,
      ),
    },
    solvedCount: {
      total: assertInt(solvedCount.total, `${field}.solvedCount.total`, 0),
      easy: assertInt(solvedCount.easy, `${field}.solvedCount.easy`, 0),
      medium: assertInt(solvedCount.medium, `${field}.solvedCount.medium`, 0),
      hard: assertInt(solvedCount.hard, `${field}.solvedCount.hard`, 0),
    },
    rank: {
      currentRank,
      totalUsers: assertInt(rank.totalUsers, `${field}.rank.totalUsers`, 0),
    },
    activity: rawActivity
      .map((entry, i) => {
        const item = assertRecord(entry, `${field}.activity[${i}]`);
        return {
          date: assertIsoDate(item.date, `${field}.activity[${i}].date`),
          count: assertInt(item.count, `${field}.activity[${i}].count`, 0),
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date)),
    hasRank: currentRank !== null,
  };
}

export function adaptAiFinding(
  raw: unknown,
  field = "aiFinding",
): AiFindingModel {
  const r = assertRecord(raw, field);
  const lineStart = assertNullableInt(r.lineStart, `${field}.lineStart`, 1);
  const lineEnd = assertNullableInt(r.lineEnd, `${field}.lineEnd`, 1);
  return {
    id: assertUuid(r.id, `${field}.id`),
    severity: assertEnum(r.severity, AI_SEVERITIES, `${field}.severity`),
    lineStart,
    lineEnd,
    title: assertNonEmptyString(r.title, `${field}.title`),
    explanation: assertNonEmptyString(r.explanation, `${field}.explanation`),
    suggestion: assertNullableString(r.suggestion, `${field}.suggestion`),
    displayOrder: assertInt(r.displayOrder, `${field}.displayOrder`, 1),
    hasLineRange: lineStart !== null,
  };
}

export function adaptAiReview(raw: unknown, field = "aiReview"): AiReviewModel {
  const r = assertRecord(raw, field);
  const status = assertEnum(r.status, AI_REVIEW_STATUSES, `${field}.status`);
  const rawDimensions = assertRecord(r.dimensions, `${field}.dimensions`);
  const dimensions: Record<string, number> = {};
  const dimensionList: AiDimensionScore[] = [];

  for (const [key, val] of Object.entries(rawDimensions)) {
    const score = assertNumber(val, `${field}.dimensions.${key}`, 0, 100);
    dimensions[key] = score;
    dimensionList.push({
      key,
      label: humanizeDimensionKey(key),
      score,
    });
  }

  const findings = assertArray(r.findings, `${field}.findings`)
    .map((item, i) => adaptAiFinding(item, `${field}.findings[${i}]`))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const isTerminal = isTerminalAiReviewStatus(status);

  return {
    id: assertUuid(r.id, `${field}.id`),
    submissionId: assertUuid(r.submissionId, `${field}.submissionId`),
    status,
    score: assertNullableNumber(r.score, `${field}.score`, 0, 100),
    summary: assertNullableString(r.summary, `${field}.summary`),
    dimensions,
    dimensionList,
    findings,
    errorMessage: assertNullableString(r.errorMessage, `${field}.errorMessage`),
    createdAt: assertIsoDateTime(r.createdAt, `${field}.createdAt`),
    startedAt: assertNullableIsoDateTime(r.startedAt, `${field}.startedAt`),
    completedAt: assertNullableIsoDateTime(
      r.completedAt,
      `${field}.completedAt`,
    ),
    isPending: !isTerminal,
    isTerminal,
    shouldPoll: !isTerminal,
    isCompleted: status === "completed",
    isFailed: status === "failed",
  };
}

export function adaptAiReviewData(raw: unknown): AiReviewModel | null {
  const r = assertRecord(raw, "aiReviewData");
  if (r.review === null) return null;
  return adaptAiReview(r.review, "aiReviewData.review");
}
