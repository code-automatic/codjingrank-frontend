export type UuidString = string;
export type SlugString = string;
export type IsoDateTimeString = string;
export type IsoDateString = string;

export type OperationPriority = "Must" | "Should" | "Could";

export type MachineErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "RESET_TOKEN_INVALID"
  | "CURRENT_PASSWORD_INVALID"
  | "UNAUTHORIZED"
  | "INVALID_CREDENTIALS"
  | "REFRESH_TOKEN_INVALID"
  | "FORBIDDEN"
  | "LEVEL_LOCKED"
  | "SOLUTION_NOT_ALLOWED"
  | "ACCOUNT_DISABLED"
  | "NOT_FOUND"
  | "DAILY_CHALLENGE_NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "CONFLICT"
  | "PROBLEM_PUBLISHED_LOCKED"
  | "AI_REVIEW_NOT_ELIGIBLE"
  | "PUBLISH_REQUIREMENTS_NOT_MET"
  | "EMAIL_EXISTS"
  | "USERNAME_EXISTS"
  | "RESOURCE_IN_USE"
  | "REQUEST_TOO_LARGE"
  | "UNPROCESSABLE_REQUEST"
  | "LANGUAGE_NOT_SUPPORTED"
  | "INVALID_COMMENT_PARENT"
  | "RATE_LIMITED"
  | "SUBMISSION_COOLDOWN"
  | "INTERNAL_ERROR"
  | "UPSTREAM_ERROR"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "HTTP_ERROR"
  | "INVALID_ENVELOPE"
  | "INVALID_CONTRACT_DATA"
  | "SESSION_CHANGED";

export type PaginatedData<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
};

export type PaginationQuery = {
  page?: number;
  size?: number;
};

// ---------------------------------------------------------------------------
// Auth & Profile (F01)
// ---------------------------------------------------------------------------

export type UserRole = "student" | "teacher" | "admin";

export type PublicUserDto = {
  id: UuidString;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type UserDto = {
  id: UuidString;
  email: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type UserDataDto = {
  user: UserDto;
};

export type ProfilePatchRequest = {
  fullName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

// ---------------------------------------------------------------------------
// Catalog, Languages, Tags, Landing & Daily Challenge (F02, F03, F04, F05, F08)
// ---------------------------------------------------------------------------

export type TagDto = {
  id: UuidString;
  slug: SlugString;
  name: string;
};

export type LanguageDto = {
  id: UuidString;
  slug: string;
  name: string;
  runtimeVersion: string;
  fileExtension: string;
};

export type PackageDto = {
  id: UuidString;
  slug: SlugString;
  name: string;
  description: string | null;
  displayOrder: number;
  totalProblems: number;
};

export type LevelDifficulty = "easy" | "medium" | "hard";

export type LevelProgressDto = {
  id: UuidString;
  packageId: UuidString;
  levelNo: number;
  slug: string;
  name: string;
  difficulty: LevelDifficulty;
  total: number;
  solved: number;
  unlocked: boolean;
  completed: boolean;
};

export type PackageDetailDto = {
  package: PackageDto;
  levels: LevelProgressDto[];
};

export type SampleDto = {
  id: UuidString;
  inputData: string | null;
  expectedOutput: string;
  displayOrder: number;
};

export type ProblemSummaryDto = {
  id: UuidString;
  slug: string;
  title: string;
  packageId: UuidString;
  packageSlug: SlugString;
  levelId: UuidString;
  difficulty: LevelDifficulty;
  tags: TagDto[];
  solved: boolean;
  unlocked: boolean;
  acceptanceRate: number;
};

export type ExecutionMode = "stdin_stdout" | "function";

export type ProblemDetailDto = {
  problem: ProblemSummaryDto;
  statementMd: string;
  executionMode: ExecutionMode;
  functionName: string | null;
  timeLimitMs: number;
  memoryLimitMb: number;
  outputLimitBytes: number;
  sampleTestCases: SampleDto[];
  languages: LanguageDto[];
};

export type CodeTemplateDto = {
  problemId: UuidString;
  languageId: UuidString;
  starterCode: string;
  fileName: string;
};

export type DailyChallengeDto = {
  date: IsoDateString;
  problem: ProblemSummaryDto;
};

export type ListPackagesQuery = PaginationQuery & {
  q?: string;
};

export type ListProblemsQuery = PaginationQuery & {
  package?: string;
  difficulty?: LevelDifficulty;
  tag?: string;
  solved?: boolean;
  q?: string;
};

// ---------------------------------------------------------------------------
// Run, Submit, Submissions, Stats & AI Review (F06, F07, F09, F13)
// ---------------------------------------------------------------------------

export type ExecuteRequest = {
  problemId: UuidString;
  languageId: UuidString;
  code: string;
};

export type RunVerdict =
  | "Accepted"
  | "Wrong Answer"
  | "Time Limit Exceeded"
  | "Memory Limit Exceeded"
  | "Compilation Error"
  | "Runtime Error"
  | "Internal Error";

export type SubmissionStatus = "Pending" | "Running" | RunVerdict;

export type SampleResultDto = {
  testCaseId: UuidString;
  status: RunVerdict;
  inputData: string | null;
  expectedOutput: string;
  actualOutput: string;
  runtimeMs: number | null;
  errorMessage: string | null;
  errorType: string | null;
  stderr: string | null;
};

export type RunDataDto = {
  status: RunVerdict;
  passed: number;
  total: number;
  results: SampleResultDto[];
};

export type SubmissionSummaryDto = {
  id: UuidString;
  userId: UuidString;
  problemId: UuidString;
  languageId: UuidString;
  problemSlug: string;
  problemTitle: string;
  languageSlug: string;
  status: SubmissionStatus;
  runtimeMs: number | null;
  memoryKb: number | null;
  errorMessage: string | null;
  passCount: number;
  totalTestcases: number;
  createdAt: IsoDateTimeString;
  judgedAt: IsoDateTimeString | null;
};

export type SubmissionDto = SubmissionSummaryDto & {
  code: string;
};

export type SubmissionDataDto = {
  submission: SubmissionDto;
};

export type LatestSubmissionDataDto = {
  submission: SubmissionDto | null;
};

export type SubmissionTestMetadataDto = {
  testOrdinal: number;
  status: RunVerdict;
  runtimeMs: number | null;
};

export type ListMySubmissionsQuery = PaginationQuery & {
  problemId?: UuidString;
  languageId?: UuidString;
  status?: SubmissionStatus;
};

export type UserStatsDto = {
  streak: {
    currentStreak: number;
    maxStreak: number;
    lastActiveDate: IsoDateString | null;
  };
  solvedCount: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
  };
  rank: {
    currentRank: number | null;
    totalUsers: number;
  };
  activity: Array<{
    date: IsoDateString;
    count: number;
  }>;
};

export type AiReviewStatus = "queued" | "running" | "completed" | "failed";
export type AiSeverity = "info" | "warning" | "error";

export type AiFindingDto = {
  id: UuidString;
  severity: AiSeverity;
  lineStart: number | null;
  lineEnd: number | null;
  title: string;
  explanation: string;
  suggestion: string | null;
  displayOrder: number;
};

export type AiReviewDto = {
  id: UuidString;
  submissionId: UuidString;
  status: AiReviewStatus;
  score: number | null;
  summary: string | null;
  dimensions: Record<string, number>;
  findings: AiFindingDto[];
  errorMessage: string | null;
  createdAt: IsoDateTimeString;
  startedAt: IsoDateTimeString | null;
  completedAt: IsoDateTimeString | null;
};

export type AiReviewDataDto = {
  review: AiReviewDto | null;
};

// ---------------------------------------------------------------------------
// Leaderboard & Forum (F02, F10, F11)
// ---------------------------------------------------------------------------

export type LeaderboardScope = "all" | "week" | "month";

export type LeaderboardEntryDto = {
  rank: number;
  userId: UuidString;
  username: string;
  avatarUrl: string | null;
  solvedProblemCount: number;
  acceptedSolutionCount: number;
};

export type LeaderboardDataDto = {
  scope: LeaderboardScope;
  packageSlug: string | null;
  periodStart: IsoDateTimeString | null;
  periodEnd: IsoDateTimeString | null;
  items: LeaderboardEntryDto[];
  page: number;
  size: number;
  total: number;
};

export type MyRankDataDto = {
  scope: LeaderboardScope;
  packageSlug: string | null;
  periodStart: IsoDateTimeString | null;
  periodEnd: IsoDateTimeString | null;
  entry: LeaderboardEntryDto | null;
};

export type LeaderboardQuery = PaginationQuery & {
  scope?: LeaderboardScope;
  package?: string;
};

export type MyRankQuery = {
  scope?: LeaderboardScope;
  package?: string;
};

export type LandingStatsDto = {
  problems: number;
  users: number;
  acceptedSubmissions: number;
};

export type LandingDataDto = {
  stats: LandingStatsDto;
  languages: LanguageDto[];
  featuredPackages: PackageDto[];
  topUsers: LeaderboardEntryDto[];
};

export type ForumPostType = "discussion" | "question" | "solution";
export type ForumPostSort = "newest" | "likes" | "views";
export type ForumPostStatus = "published";

export type ForumPostSummaryDto = {
  id: UuidString;
  author: PublicUserDto;
  problemId: UuidString | null;
  languageId: UuidString | null;
  postType: ForumPostType;
  status: ForumPostStatus;
  title: string;
  likeCount: number;
  viewCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type ForumPostDto = ForumPostSummaryDto & {
  contentMd: string;
  codeSnippet: string | null;
};

export type PostDataDto = {
  post: ForumPostDto;
};

export type PostCreateRequest = {
  title: string;
  contentMd: string;
  codeSnippet?: string | null;
  postType: ForumPostType;
  problemId?: UuidString | null;
  languageId?: UuidString | null;
};

export type PostPatchRequest = {
  title?: string;
  contentMd?: string;
  codeSnippet?: string | null;
  postType?: ForumPostType;
  problemId?: UuidString | null;
  languageId?: UuidString | null;
};

export type ForumCommentDto = {
  id: UuidString;
  postId: UuidString;
  parentId: UuidString | null;
  author: PublicUserDto;
  content: string | null;
  isDeleted: boolean;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type CommentDataDto = {
  comment: ForumCommentDto;
};

export type CommentCreateRequest = {
  content: string;
  parentId?: UuidString | null;
};

export type CommentPatchRequest = {
  content: string;
};

export type LikeStateDto = {
  liked: boolean;
  likeCount: number;
};

export type ListPostsQuery = PaginationQuery & {
  problemId?: UuidString;
  languageId?: UuidString;
  postType?: ForumPostType;
  sort?: ForumPostSort;
  q?: string;
};
