import {
  errorText,
  MAX_EXECUTE_CODE_BYTES,
  utf8ByteLength,
  type ApiClient,
  type LevelDifficulty,
  type RunDataModel,
  type RunVerdict,
} from "@/lib/api";
import {
  buildDraftStorageKey,
  safeReadStorage,
} from "@/features/problem-run/draftStorage";

export const DIFFICULTY_LABELS: Record<LevelDifficulty, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Nâng cao",
};

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

export function resolveCodeForLanguage(params: {
  userId: string;
  problemSlug: string;
  languageSlug: string;
  starterCode: string;
  storage?: Pick<Storage, "getItem"> | null;
}): { code: string; isFromDraft: boolean } {
  const key = buildDraftStorageKey(
    params.userId,
    params.problemSlug,
    params.languageSlug,
  );
  const draft = safeReadStorage(key, params.storage);
  if (draft !== null && draft !== params.starterCode) {
    return { code: draft, isFromDraft: true };
  }
  return { code: params.starterCode, isFromDraft: false };
}

export function validateCodeBeforeRun(code: string): {
  ok: boolean;
  bytes: number;
  message: string;
} {
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

export function isAbortError(err: unknown, aborted = false): boolean {
  if (aborted) return true;
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

export type SampleRunOutcome =
  | { kind: "result"; data: RunDataModel }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

export async function executeSampleRun(
  api: Pick<ApiClient, "judge">,
  payload: { problemId: string; languageId: string; code: string },
  signal?: AbortSignal,
): Promise<SampleRunOutcome> {
  const precheck = validateCodeBeforeRun(payload.code);
  if (!precheck.ok) {
    return { kind: "error", message: precheck.message };
  }
  try {
    const data = await api.judge.runSamples(
      payload,
      signal ? { signal } : undefined,
    );
    return { kind: "result", data };
  } catch (err) {
    if (isAbortError(err, signal?.aborted)) {
      return { kind: "cancelled" };
    }
    return { kind: "error", message: errorText(err) };
  }
}
