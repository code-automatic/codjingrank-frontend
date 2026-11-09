import { ApiError } from "@/lib/api/client";
import {
  adaptPaginated,
  assertArray,
  assertBoolean,
  assertEnum,
  assertInt,
  assertIsoDate,
  assertNonEmptyString,
  assertNullableString,
  assertNumber,
  assertRecord,
  assertSlug,
  assertString,
  assertUuid,
} from "@/lib/api/guards";
import {
  adaptLeaderboardEntry,
  type LeaderboardEntryModel,
} from "@/lib/api/adapters/shared";
import type {
  CodeTemplateDto,
  DailyChallengeDto,
  LandingDataDto,
  LanguageDto,
  LevelDifficulty,
  LevelProgressDto,
  PackageDto,
  PaginatedData,
  ProblemDetailDto,
  ProblemSummaryDto,
  SampleDto,
  TagDto,
} from "@/lib/api/types";

export const LEVEL_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const EXECUTION_MODES = ["stdin_stdout", "function"] as const;

export type TagModel = TagDto;

export type LanguageModel = LanguageDto & {
  displayLabel: string;
};

export type PackageModel = PackageDto;

export type LevelProgressModel = LevelProgressDto & {
  completionPercent: number;
  lockStatus: "locked" | "in_progress" | "completed";
};

export type PackageDetailModel = {
  package: PackageModel;
  levels: [LevelProgressModel, LevelProgressModel, LevelProgressModel];
  solvedCount: number;
  totalCount: number;
  completionPercent: number;
  highestUnlockedLevelNo: number;
  allCompleted: boolean;
};

export type SampleModel = SampleDto;

export type ProblemSummaryModel = ProblemSummaryDto & {
  tags: TagModel[];
  canOpen: boolean;
  formattedAcceptanceRate: string;
};

export type ProblemDetailModel = {
  problem: ProblemSummaryModel;
  statementMd: string;
  executionMode: ProblemDetailDto["executionMode"];
  functionName: string | null;
  timeLimitMs: number;
  memoryLimitMb: number;
  outputLimitBytes: number;
  sampleTestCases: SampleModel[];
  languages: LanguageModel[];
  isFunctionMode: boolean;
  hasSamples: boolean;
};

export type CodeTemplateModel = CodeTemplateDto;

export type DailyChallengeModel = {
  date: DailyChallengeDto["date"];
  problem: ProblemSummaryModel;
};

export type LandingModel = {
  stats: LandingDataDto["stats"];
  languages: LanguageModel[];
  featuredPackages: PackageModel[];
  topUsers: LeaderboardEntryModel[];
};

const DIFFICULTY_BY_LEVEL: Record<number, LevelDifficulty> = {
  1: "easy",
  2: "medium",
  3: "hard",
};

export function adaptTag(raw: unknown, field = "tag"): TagModel {
  const r = assertRecord(raw, field);
  return {
    id: assertUuid(r.id, `${field}.id`),
    slug: assertSlug(r.slug, `${field}.slug`),
    name: assertNonEmptyString(r.name, `${field}.name`),
  };
}

export function adaptTagsResponse(raw: unknown): TagModel[] {
  const r = assertRecord(raw, "tagsData");
  return assertArray(r.items, "tagsData.items").map((item, i) =>
    adaptTag(item, `tagsData.items[${i}]`),
  );
}

export function adaptLanguage(raw: unknown, field = "language"): LanguageModel {
  const r = assertRecord(raw, field);
  const name = assertNonEmptyString(r.name, `${field}.name`);
  const runtimeVersion = assertString(
    r.runtimeVersion,
    `${field}.runtimeVersion`,
  );
  return {
    id: assertUuid(r.id, `${field}.id`),
    slug: assertNonEmptyString(r.slug, `${field}.slug`),
    name,
    runtimeVersion,
    fileExtension: assertNonEmptyString(
      r.fileExtension,
      `${field}.fileExtension`,
    ),
    displayLabel: runtimeVersion ? `${name} (${runtimeVersion})` : name,
  };
}

export function adaptLanguagesResponse(
  raw: unknown,
  field = "languagesData",
): LanguageModel[] {
  const r = assertRecord(raw, field);
  return assertArray(r.items, `${field}.items`).map((item, i) =>
    adaptLanguage(item, `${field}.items[${i}]`),
  );
}

export function adaptPackage(raw: unknown, field = "package"): PackageModel {
  const r = assertRecord(raw, field);
  return {
    id: assertUuid(r.id, `${field}.id`),
    slug: assertSlug(r.slug, `${field}.slug`),
    name: assertNonEmptyString(r.name, `${field}.name`),
    description: assertNullableString(r.description, `${field}.description`),
    displayOrder: assertInt(r.displayOrder, `${field}.displayOrder`, 0),
    totalProblems: assertInt(r.totalProblems, `${field}.totalProblems`, 0),
  };
}

export function adaptPackagesPage(raw: unknown): PaginatedData<PackageModel> {
  return adaptPaginated(raw, "packagesPage", (item, i) =>
    adaptPackage(item, `packagesPage.items[${i}]`),
  );
}

export function adaptLevelProgress(
  raw: unknown,
  field = "level",
): LevelProgressModel {
  const r = assertRecord(raw, field);
  const total = assertInt(r.total, `${field}.total`, 0);
  const solved = assertInt(r.solved, `${field}.solved`, 0);
  const unlocked = assertBoolean(r.unlocked, `${field}.unlocked`);
  const completed = assertBoolean(r.completed, `${field}.completed`);
  const completionPercent =
    total === 0 ? 100 : Math.min(100, Math.round((solved / total) * 100));

  return {
    id: assertUuid(r.id, `${field}.id`),
    packageId: assertUuid(r.packageId, `${field}.packageId`),
    levelNo: assertInt(r.levelNo, `${field}.levelNo`, 1, 3),
    slug: assertNonEmptyString(r.slug, `${field}.slug`),
    name: assertNonEmptyString(r.name, `${field}.name`),
    difficulty: assertEnum(
      r.difficulty,
      LEVEL_DIFFICULTIES,
      `${field}.difficulty`,
    ),
    total,
    solved,
    unlocked,
    completed,
    completionPercent,
    lockStatus: !unlocked ? "locked" : completed ? "completed" : "in_progress",
  };
}

export function adaptPackageDetail(
  raw: unknown,
  field = "packageDetail",
): PackageDetailModel {
  const r = assertRecord(raw, field);
  const pkg = adaptPackage(r.package, `${field}.package`);
  const rawLevels = assertArray(r.levels, `${field}.levels`);
  if (rawLevels.length !== 3) {
    throw new ApiError(200, "INVALID_CONTRACT_DATA", {
      field: `${field}.levels`,
      reason: "expected_exactly_three_levels",
      actualLength: rawLevels.length,
    });
  }

  const levels = rawLevels
    .map((lv, i) => adaptLevelProgress(lv, `${field}.levels[${i}]`))
    .sort((a, b) => a.levelNo - b.levelNo);

  for (let i = 0; i < 3; i++) {
    const expectedLevelNo = i + 1;
    const lv = levels[i];
    if (
      lv.levelNo !== expectedLevelNo ||
      lv.difficulty !== DIFFICULTY_BY_LEVEL[expectedLevelNo] ||
      lv.packageId !== pkg.id
    ) {
      throw new ApiError(200, "INVALID_CONTRACT_DATA", {
        field: `${field}.levels[${i}]`,
        reason: "invalid_level_progression_order_or_package_ref",
      });
    }
  }

  const solvedCount = levels.reduce((acc, lv) => acc + lv.solved, 0);
  const totalCount = levels.reduce((acc, lv) => acc + lv.total, 0);
  const completionPercent =
    totalCount === 0
      ? 100
      : Math.min(100, Math.round((solvedCount / totalCount) * 100));
  const highestUnlockedLevelNo = levels.reduce(
    (max, lv) => (lv.unlocked && lv.levelNo > max ? lv.levelNo : max),
    1,
  );

  return {
    package: pkg,
    levels: [levels[0], levels[1], levels[2]],
    solvedCount,
    totalCount,
    completionPercent,
    highestUnlockedLevelNo,
    allCompleted: levels.every((lv) => lv.completed),
  };
}

export function adaptSample(raw: unknown, field = "sample"): SampleModel {
  const r = assertRecord(raw, field);
  return {
    id: assertUuid(r.id, `${field}.id`),
    inputData: assertNullableString(r.inputData, `${field}.inputData`),
    expectedOutput: assertString(r.expectedOutput, `${field}.expectedOutput`),
    displayOrder: assertInt(r.displayOrder, `${field}.displayOrder`, 1),
  };
}

export function adaptSamplesResponse(raw: unknown): SampleModel[] {
  const r = assertRecord(raw, "samplesData");
  return assertArray(r.items, "samplesData.items")
    .map((item, i) => adaptSample(item, `samplesData.items[${i}]`))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function adaptProblemSummary(
  raw: unknown,
  field = "problem",
): ProblemSummaryModel {
  const r = assertRecord(raw, field);
  const unlocked = assertBoolean(r.unlocked, `${field}.unlocked`);
  const acceptanceRate = assertNumber(
    r.acceptanceRate,
    `${field}.acceptanceRate`,
    0,
    100,
  );
  return {
    id: assertUuid(r.id, `${field}.id`),
    slug: assertNonEmptyString(r.slug, `${field}.slug`),
    title: assertNonEmptyString(r.title, `${field}.title`),
    packageId: assertUuid(r.packageId, `${field}.packageId`),
    packageSlug: assertSlug(r.packageSlug, `${field}.packageSlug`),
    levelId: assertUuid(r.levelId, `${field}.levelId`),
    difficulty: assertEnum(
      r.difficulty,
      LEVEL_DIFFICULTIES,
      `${field}.difficulty`,
    ),
    tags: assertArray(r.tags, `${field}.tags`).map((t, i) =>
      adaptTag(t, `${field}.tags[${i}]`),
    ),
    solved: assertBoolean(r.solved, `${field}.solved`),
    unlocked,
    acceptanceRate,
    canOpen: unlocked,
    formattedAcceptanceRate: `${Number(acceptanceRate.toFixed(1))}%`,
  };
}

export function adaptProblemsPage(
  raw: unknown,
): PaginatedData<ProblemSummaryModel> {
  return adaptPaginated(raw, "problemsPage", (item, i) =>
    adaptProblemSummary(item, `problemsPage.items[${i}]`),
  );
}

export function adaptProblemDetail(
  raw: unknown,
  field = "problemDetail",
): ProblemDetailModel {
  const r = assertRecord(raw, field);
  const executionMode = assertEnum(
    r.executionMode,
    EXECUTION_MODES,
    `${field}.executionMode`,
  );
  const sampleTestCases = assertArray(
    r.sampleTestCases,
    `${field}.sampleTestCases`,
  )
    .map((item, i) => adaptSample(item, `${field}.sampleTestCases[${i}]`))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return {
    problem: adaptProblemSummary(r.problem, `${field}.problem`),
    statementMd: assertString(r.statementMd, `${field}.statementMd`),
    executionMode,
    functionName: assertNullableString(r.functionName, `${field}.functionName`),
    timeLimitMs: assertInt(r.timeLimitMs, `${field}.timeLimitMs`, 1),
    memoryLimitMb: assertInt(r.memoryLimitMb, `${field}.memoryLimitMb`, 1),
    outputLimitBytes: assertInt(
      r.outputLimitBytes,
      `${field}.outputLimitBytes`,
      1,
    ),
    sampleTestCases,
    languages: assertArray(r.languages, `${field}.languages`).map((lang, i) =>
      adaptLanguage(lang, `${field}.languages[${i}]`),
    ),
    isFunctionMode: executionMode === "function",
    hasSamples: sampleTestCases.length > 0,
  };
}

export function adaptCodeTemplate(
  raw: unknown,
  field = "codeTemplate",
): CodeTemplateModel {
  const r = assertRecord(raw, field);
  return {
    problemId: assertUuid(r.problemId, `${field}.problemId`),
    languageId: assertUuid(r.languageId, `${field}.languageId`),
    // Preserve exact starter bytes & trailing newlines without trimming
    starterCode: assertString(r.starterCode, `${field}.starterCode`),
    fileName: assertNonEmptyString(r.fileName, `${field}.fileName`),
  };
}

export function adaptDailyChallenge(
  raw: unknown,
  field = "dailyChallenge",
): DailyChallengeModel {
  const r = assertRecord(raw, field);
  return {
    date: assertIsoDate(r.date, `${field}.date`),
    problem: adaptProblemSummary(r.problem, `${field}.problem`),
  };
}

export function adaptLandingData(
  raw: unknown,
  field = "landing",
): LandingModel {
  const r = assertRecord(raw, field);
  const stats = assertRecord(r.stats, `${field}.stats`);
  const rawTopUsers = assertArray(r.topUsers, `${field}.topUsers`);
  if (rawTopUsers.length > 5) {
    throw new ApiError(200, "INVALID_CONTRACT_DATA", {
      field: `${field}.topUsers`,
      reason: "expected_at_most_5_top_users",
    });
  }
  return {
    stats: {
      problems: assertInt(stats.problems, `${field}.stats.problems`, 0),
      users: assertInt(stats.users, `${field}.stats.users`, 0),
      acceptedSubmissions: assertInt(
        stats.acceptedSubmissions,
        `${field}.stats.acceptedSubmissions`,
        0,
      ),
    },
    languages: assertArray(r.languages, `${field}.languages`).map((lang, i) =>
      adaptLanguage(lang, `${field}.languages[${i}]`),
    ),
    featuredPackages: assertArray(
      r.featuredPackages,
      `${field}.featuredPackages`,
    ).map((pkg, i) => adaptPackage(pkg, `${field}.featuredPackages[${i}]`)),
    topUsers: rawTopUsers.map((u, i) =>
      adaptLeaderboardEntry(u, `${field}.topUsers[${i}]`),
    ),
  };
}
