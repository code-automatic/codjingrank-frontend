import type { AiFindingModel, AiReviewModel } from "@/lib/api/adapters/judge";
import { errorText } from "@/lib/api/client";
import type { AiReviewStatus, AiSeverity } from "@/lib/api/types";

export type AiReviewTone = "neutral" | "warn" | "pass" | "fail";

export type AiReviewUiStatus = AiReviewStatus | "not_scheduled";

export const AI_REVIEW_POLL_INTERVAL_MS = 3_000;
export const AI_REVIEW_MAX_POLLS = 40;

export const AI_REVIEW_STATUS_META: Record<
  AiReviewUiStatus,
  { label: string; tone: AiReviewTone; description: string }
> = {
  not_scheduled: {
    label: "Chưa xếp hàng AI",
    tone: "neutral",
    description:
      "Bài nộp đã đạt Accepted. Hệ thống đang chuẩn bị tạo yêu cầu đánh giá AI.",
  },
  queued: {
    label: "Đang chờ xử lý (Queued)",
    tone: "neutral",
    description:
      "Yêu cầu đánh giá AI đang nằm trong hàng đợi và sẽ được phân tích sớm.",
  },
  running: {
    label: "Đang phân tích (Running)",
    tone: "warn",
    description:
      "Dịch vụ AI đang đọc mã nguồn và tổng hợp điểm, tiêu chí cùng các gợi ý cải thiện.",
  },
  completed: {
    label: "Hoàn thành (Completed)",
    tone: "pass",
    description:
      "Đánh giá AI đã hoàn tất. Điểm AI chỉ dùng để tham khảo và độc lập với verdict Accepted.",
  },
  failed: {
    label: "Tạm gián đoạn (Failed)",
    tone: "fail",
    description:
      "Không thể hoàn tất đánh giá AI cho lượt nộp này. Kết quả Accepted và tiến độ mở cấp vẫn giữ nguyên.",
  },
};

export const AI_SEVERITY_META: Record<
  AiSeverity,
  { label: string; tone: AiReviewTone }
> = {
  info: { label: "Gợi ý", tone: "neutral" },
  warning: { label: "Cảnh báo", tone: "warn" },
  error: { label: "Cần chú ý", tone: "fail" },
};

export function resolveUiAiStatus(
  review: Pick<AiReviewModel, "status"> | null,
): AiReviewUiStatus {
  return review ? review.status : "not_scheduled";
}

export function formatAiScore(score: number | null): string {
  if (score === null) return "—";
  const rounded = Number.isInteger(score)
    ? String(score)
    : Number(score.toFixed(2)).toString();
  return `${rounded} / 100`;
}

export function formatAiDateTime(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(parsed);
}

export function formatLineRange(
  lineStart: number | null,
  lineEnd: number | null,
): string {
  if (lineStart === null) return "Tổng quát";
  if (lineEnd === null || lineEnd <= lineStart) {
    return `Dòng ${lineStart}`;
  }
  return `Dòng ${lineStart}–${lineEnd}`;
}

export function splitSourceLines(code: string): string[] {
  if (typeof code !== "string" || code.length === 0) return [""];
  return code.split(/\r?\n/);
}

export function isLineHighlighted(
  lineNumber: number,
  finding: Pick<AiFindingModel, "lineStart" | "lineEnd"> | null,
): boolean {
  if (!finding || finding.lineStart === null) return false;
  const end =
    finding.lineEnd !== null && finding.lineEnd >= finding.lineStart
      ? finding.lineEnd
      : finding.lineStart;
  return lineNumber >= finding.lineStart && lineNumber <= end;
}

export function resolveAiReviewErrorMessage(error: unknown): string {
  if (!error) return "";
  return errorText(error);
}
