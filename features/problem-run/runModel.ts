import { MAX_EXECUTE_CODE_BYTES } from "@/lib/api/domains/preflight";
import { errorText } from "@/lib/api/client";
import { utf8ByteLength } from "@/lib/api/guards";
import type { SampleResultModel } from "@/lib/api/adapters/judge";
import type { RunVerdict } from "@/lib/api/types";

export type VerdictTone = "pass" | "warn" | "fail";

export const VERDICT_META: Record<
  RunVerdict,
  { label: string; tone: VerdictTone }
> = {
  Accepted: { label: "Đạt (Accepted)", tone: "pass" },
  "Wrong Answer": { label: "Sai kết quả (Wrong Answer)", tone: "fail" },
  "Time Limit Exceeded": {
    label: "Quá thời gian (Time Limit Exceeded)",
    tone: "warn",
  },
  "Memory Limit Exceeded": {
    label: "Quá bộ nhớ (Memory Limit Exceeded)",
    tone: "warn",
  },
  "Compilation Error": {
    label: "Lỗi biên dịch (Compilation Error)",
    tone: "fail",
  },
  "Runtime Error": { label: "Lỗi khi chạy (Runtime Error)", tone: "fail" },
  "Internal Error": {
    label: "Lỗi hệ thống chấm (Internal Error)",
    tone: "fail",
  },
};

export function validateCodeBeforeRun(code: string): {
  ok: boolean;
  bytes: number;
  message: string;
} {
  if (typeof code !== "string") {
    return {
      ok: false,
      bytes: 0,
      message: "Vui lòng nhập mã nguồn trước khi chạy thử mẫu.",
    };
  }
  const bytes = utf8ByteLength(code);
  if (code.trim().length === 0) {
    return {
      ok: false,
      bytes,
      message: "Vui lòng nhập mã nguồn trước khi chạy thử mẫu.",
    };
  }
  if (bytes > MAX_EXECUTE_CODE_BYTES) {
    return {
      ok: false,
      bytes,
      message: `Mã nguồn đang là ${bytes.toLocaleString("vi-VN")} byte, vượt quá giới hạn ${MAX_EXECUTE_CODE_BYTES.toLocaleString("vi-VN")} byte UTF-8.`,
    };
  }
  return { ok: true, bytes, message: "" };
}

export function isAbortError(err: unknown, cancelled = false): boolean {
  if (cancelled) return true;
  if (err instanceof Error && err.name === "AbortError") return true;
  if (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name?: unknown }).name === "AbortError"
  ) {
    return true;
  }
  return false;
}

export function formatOutputText(value: string | null): string {
  if (value === null || value === "") return "(trống)";
  return value;
}

export function formatRuntimeMs(runtimeMs: number | null): string {
  return runtimeMs === null ? "—" : `${runtimeMs} ms`;
}

export function isSampleMismatch(
  sample: Pick<
    SampleResultModel,
    "isPassed" | "actualOutput" | "expectedOutput"
  >,
): boolean {
  return !sample.isPassed && sample.actualOutput !== sample.expectedOutput;
}

export function resolveRunErrorMessage(
  error: unknown,
  validationMessage: string | null,
): string {
  if (validationMessage) return validationMessage;
  if (!error) return "";
  return errorText(error);
}
