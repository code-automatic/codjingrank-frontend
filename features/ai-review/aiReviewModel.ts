import {
  type AiDimensionScore,
  type AiFindingModel,
  type AiReviewModel,
  type SubmissionModel,
} from "@/lib/api/adapters/judge";
import { type AiReviewStatus, type AiSeverity } from "@/lib/api/types";
import { errorText } from "@/lib/api/client";

export const AI_REVIEW_POLL_INTERVAL_MS = 3_000;
export const AI_REVIEW_MAX_POLLS = 40;

export type UiAiStatus = "not_scheduled" | AiReviewStatus;

export type StatusTone = "neutral" | "info" | "pass" | "warn" | "fail";

export const AI_REVIEW_STATUS_META: Record<
  UiAiStatus,
  { label: string; tone: StatusTone; description: string }
> = {
  not_scheduled: {
    label: "Chưa xếp hàng AI",
    tone: "neutral",
    description:
      "Bài nộp đã đạt Accepted. Hệ thống đang chuẩn bị tạo yêu cầu đánh giá AI.",
  },
  queued: {
    label: "Đang trong hàng đợi AI (Queued)",
    tone: "info",
    description:
      "Yêu cầu đánh giá AI đã được ghi nhận và đang chờ worker nhận xử lý.",
  },
  running: {
    label: "AI đang phân tích (Running)",
    tone: "info",
    description:
      "Mô hình AI đang đọc mã nguồn và đối chiếu với tiêu chí chất lượng.",
  },
  completed: {
    label: "Hoàn thành (Completed)",
    tone: "pass",
    description:
      "Đánh giá AI đã hoàn tất. Điểm AI chỉ dùng để tham khảo và độc lập với verdict Accepted.",
  },
  failed: {
    label: "Đánh giá thất bại (Failed)",
    tone: "fail",
    description:
      "Dịch vụ AI không thể hoàn tất đánh giá. Kết quả Accepted của bài nộp vẫn được bảo toàn.",
  },
};

export const AI_SEVERITY_META: Record<
  AiSeverity,
  { label: string; tone: StatusTone }
> = {
  info: {
    label: "Gợi ý",
    tone: "info",
  },
  warning: {
    label: "Cảnh báo",
    tone: "warn",
  },
  error: {
    label: "Lỗi",
    tone: "fail",
  },
};

export function resolveUiAiStatus(review: AiReviewModel | null): UiAiStatus {
  if (!review) return "not_scheduled";
  return review.status;
}

export function formatAiScore(score: number | null): string {
  if (score === null || Number.isNaN(score)) return "—";
  const rounded = Math.round(score * 10) / 10;
  return `${rounded} / 100`;
}

export function formatAiDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  }).format(date);
}

export function formatLineRange(finding: AiFindingModel): string {
  if (finding.lineStart === null) return "Toàn bài";
  if (finding.lineEnd === null || finding.lineEnd === finding.lineStart) {
    return `Dòng ${finding.lineStart}`;
  }
  return `Dòng ${finding.lineStart}–${finding.lineEnd}`;
}

export function splitSourceLines(code: string): string[] {
  if (!code) return [""];
  const lines = code.split(/\r?\n/);
  return lines.length > 0 ? lines : [""];
}

export function isLineHighlighted(
  lineNumber: number,
  finding: AiFindingModel | null,
): boolean {
  if (!finding || finding.lineStart === null) return false;
  const start = finding.lineStart;
  const end = finding.lineEnd ?? start;
  return lineNumber >= start && lineNumber <= end;
}

export function resolveAiReviewErrorMessage(error: unknown): string {
  if (!error) return "Đã xảy ra lỗi không xác định.";
  if (typeof error === "object" && error !== null) {
    const err = error as { code?: string; status?: number; message?: string };
    if (err.code === "AI_REVIEW_NOT_ELIGIBLE") {
      return "Bài nộp chưa đạt kết quả Accepted nên không đủ điều kiện đánh giá AI.";
    }
    if (err.code === "NOT_FOUND" || err.status === 404) {
      return "Không tìm thấy dữ liệu bài nộp hoặc bạn không có quyền truy cập lượt nộp này.";
    }
    if (err.code === "UNAUTHORIZED" || err.status === 401) {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem đánh giá.";
    }
    if (err.code === "FORBIDDEN" || err.status === 403) {
      return "Bạn không có quyền xem thông tin đánh giá của bài nộp này.";
    }
    if (err.code === "REQUEST_TIMEOUT") {
      return "Yêu cầu kiểm tra đánh giá AI vượt quá thời gian phản hồi (15s).";
    }
    if (err.code === "NETWORK_ERROR") {
      return "Lỗi kết nối mạng tới máy chủ. Vui lòng kiểm tra lại đường truyền.";
    }
  }
  return errorText(error);
}

export function isSubmissionOwner(
  submission: SubmissionModel | null,
  userId: string,
): boolean {
  if (!submission) return false;
  return submission.userId === userId;
}

export type {
  AiDimensionScore,
  AiFindingModel,
  AiReviewModel,
  SubmissionModel,
};
