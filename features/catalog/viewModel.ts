import type {
  LevelProgressModel,
  ProblemSummaryModel,
} from "@/lib/api/adapters/catalog";
import { ApiError, errorText } from "@/lib/api/client";
import type { LevelDifficulty } from "@/lib/api/types";

export const DIFFICULTY_LABELS: Record<LevelDifficulty, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

export type LevelStatusTone = "locked" | "open" | "completed";

export type LevelCardPresentation = {
  levelNo: number;
  name: string;
  difficulty: LevelDifficulty;
  difficultyLabel: string;
  solved: number;
  total: number;
  completionPercent: number;
  unlocked: boolean;
  completed: boolean;
  statusTone: LevelStatusTone;
  statusLabel: string;
  progressText: string;
  helperText: string;
};

export type ProblemCardPresentation = {
  isLocked: boolean;
  difficultyLabel: string;
  solvedLabel: string;
  unlockLabel: string;
  openHref: string | null;
  actionLabel: string;
  lockReason: string | null;
};

export type PaginationMeta = {
  page: number;
  size: number;
  total: number;
  currentCount: number;
  totalPages: number;
  fromItem: number;
  toItem: number;
  hasPrev: boolean;
  hasNext: boolean;
  isOutOfRange: boolean;
};

export type CatalogErrorKind =
  "unauthorized" | "not_found" | "validation" | "rate_limited" | "network";

export type CatalogErrorInfo = {
  kind: CatalogErrorKind;
  title: string;
  message: string;
  canRetry: boolean;
  canResetFilters: boolean;
};

/**
 * Strictly reflects server booleans (`unlocked`, `completed`, `solved`, `total`).
 * Never derives unlock or completion state from prior levels on the client.
 */
export function describeLevelCard(
  level: LevelProgressModel,
): LevelCardPresentation {
  const difficultyLabel = DIFFICULTY_LABELS[level.difficulty];
  if (!level.unlocked) {
    return {
      levelNo: level.levelNo,
      name: level.name,
      difficulty: level.difficulty,
      difficultyLabel,
      solved: level.solved,
      total: level.total,
      completionPercent: level.completionPercent,
      unlocked: level.unlocked,
      completed: level.completed,
      statusTone: "locked",
      statusLabel: "Đang khóa",
      progressText: `${level.solved}/${level.total} bài`,
      helperText: "Mở khóa sau khi hoàn thành các cấp trước trên hệ thống.",
    };
  }

  if (level.completed) {
    return {
      levelNo: level.levelNo,
      name: level.name,
      difficulty: level.difficulty,
      difficultyLabel,
      solved: level.solved,
      total: level.total,
      completionPercent: level.completionPercent,
      unlocked: level.unlocked,
      completed: level.completed,
      statusTone: "completed",
      statusLabel: "Đã hoàn thành",
      progressText: `${level.solved}/${level.total} bài`,
      helperText:
        level.total === 0
          ? "Chưa có bài xuất bản ở cấp này (không chặn cấp sau)."
          : "Bạn đã hoàn thành toàn bộ bài hiện có trong cấp này.",
    };
  }

  return {
    levelNo: level.levelNo,
    name: level.name,
    difficulty: level.difficulty,
    difficultyLabel,
    solved: level.solved,
    total: level.total,
    completionPercent: level.completionPercent,
    unlocked: level.unlocked,
    completed: level.completed,
    statusTone: "open",
    statusLabel: "Đang mở",
    progressText: `${level.solved}/${level.total} bài`,
    helperText:
      level.total === 0
        ? "Chưa có bài xuất bản ở cấp này."
        : `Đã giải ${level.solved}/${level.total} bài.`,
  };
}

/**
 * Strictly reads backend `unlocked` / `canOpen` and `solved`.
 * Never infers problem access from paginated sibling items or client heuristics.
 */
export function describeProblemItem(
  problem: ProblemSummaryModel,
): ProblemCardPresentation {
  const isLocked = !problem.unlocked || !problem.canOpen;
  return {
    isLocked,
    difficultyLabel: DIFFICULTY_LABELS[problem.difficulty],
    solvedLabel: problem.solved ? "Đã giải" : "Chưa giải",
    unlockLabel: isLocked ? "Chưa mở khóa" : "Đang mở",
    openHref: isLocked ? null : `/problems/${problem.slug}`,
    actionLabel: isLocked ? "Chưa mở khóa" : "Mở bài làm →",
    lockReason: isLocked
      ? "Bài này đang khóa ở máy chủ; hãy hoàn thành các cấp trước để mở."
      : null,
  };
}

export function computePaginationMeta(
  page: number,
  size: number,
  total: number,
  currentCount: number,
): PaginationMeta {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, size);
  const safeTotal = Math.max(0, total);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeSize));
  const isOutOfRange = safeTotal > 0 && safePage > totalPages;
  const hasVisibleRange = safeTotal > 0 && currentCount > 0 && !isOutOfRange;
  const fromItem = hasVisibleRange
    ? Math.min(safeTotal, (safePage - 1) * safeSize + 1)
    : 0;
  const toItem = hasVisibleRange
    ? Math.min(safeTotal, fromItem + currentCount - 1)
    : 0;

  return {
    page: safePage,
    size: safeSize,
    total: safeTotal,
    currentCount,
    totalPages,
    fromItem,
    toItem,
    hasPrev: safePage > 1,
    hasNext: !isOutOfRange && safePage < totalPages,
    isOutOfRange,
  };
}

export function classifyCatalogError(
  error: unknown,
  resourceLabel: "packages" | "package" | "problems",
): CatalogErrorInfo {
  if (error instanceof ApiError && error.status === 401) {
    return {
      kind: "unauthorized",
      title: "Phiên đăng nhập đã hết hạn",
      message: errorText(error),
      canRetry: false,
      canResetFilters: false,
    };
  }
  if (error instanceof ApiError && error.status === 404) {
    return {
      kind: "not_found",
      title:
        resourceLabel === "package"
          ? "Không tìm thấy gói bài"
          : "Không tìm thấy dữ liệu",
      message:
        resourceLabel === "package"
          ? "Gói bài chưa được xuất bản hoặc không còn tồn tại."
          : errorText(error),
      canRetry: true,
      canResetFilters: false,
    };
  }
  if (
    error instanceof ApiError &&
    error.status === 400 &&
    error.code === "VALIDATION_ERROR"
  ) {
    return {
      kind: "validation",
      title: "Tham số tìm kiếm hoặc phân trang chưa hợp lệ",
      message: errorText(error),
      canRetry: true,
      canResetFilters: resourceLabel !== "package",
    };
  }
  if (error instanceof ApiError && error.code === "RATE_LIMITED") {
    return {
      kind: "rate_limited",
      title: "Thao tác quá nhanh",
      message: errorText(error),
      canRetry: true,
      canResetFilters: false,
    };
  }
  return {
    kind: "network",
    title:
      resourceLabel === "packages"
        ? "Không tải được danh sách gói bài"
        : resourceLabel === "package"
          ? "Không tải được thông tin gói bài"
          : "Không tải được danh sách bài tập",
    message: errorText(error),
    canRetry: true,
    canResetFilters: false,
  };
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}
