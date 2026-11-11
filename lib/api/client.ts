export type Success<T> = {
  status: "success";
  code: number;
  message: string;
  data: T;
};
export type Failure = {
  status: "error";
  code: number;
  message: string;
  error: string;
  details: unknown;
};
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public details: unknown = null,
    public retryAfterSec: number | null = null,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

export type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  signal?: AbortSignal;
  headers?: HeadersInit;
};

export type Requester = <T>(path: string, init?: RequestInit) => Promise<T>;

export function buildApiPath(
  basePath: string,
  query?: Record<string, QueryValue>,
): string {
  if (!basePath.startsWith("/api/v1/") || basePath.includes("..")) {
    throw Error("Invalid API path");
  }
  if (!query) return basePath;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function parseRetryAfter(headers: Headers): number | null {
  const raw = headers.get("Retry-After");
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const seconds = Number.parseInt(trimmed, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

export function createTransport(base: string, fetcher: typeof fetch = fetch) {
  const u = new URL(base);
  if (
    !["http:", "https:"].includes(u.protocol) ||
    u.pathname !== "/" ||
    u.search ||
    u.hash ||
    u.username ||
    u.password
  )
    throw Error("Invalid gateway origin");
  return async function send<T>(
    path: string,
    init: RequestInit = {},
    token?: string,
  ): Promise<T> {
    const [pathname] = path.split(/[?#]/, 1);
    if (
      !pathname.startsWith("/api/v1/") ||
      pathname.includes("..") ||
      pathname.includes("//")
    )
      throw Error("Invalid API path");
    const h = new Headers(init.headers);
    [...h.keys()].forEach((k) => {
      if (k.toLowerCase().startsWith("x-user-")) h.delete(k);
    });
    h.delete("Authorization");
    if (token) h.set("Authorization", `Bearer ${token}`);
    if (init.body) h.set("Content-Type", "application/json");
    h.set("Accept", "application/json");
    let r: Response;
    try {
      r = await fetcher(`${u.origin}${path}`, {
        ...init,
        headers: h,
        credentials: "include",
        cache: "no-store",
      });
    } catch (error) {
      if (
        init.signal?.aborted ||
        (error instanceof Error && error.name === "AbortError")
      )
        throw error;
      throw new ApiError(0, "NETWORK_ERROR");
    }
    if (r.status === 204) return undefined as T;
    const b = await r.json().catch(() => null);
    if (!r.ok)
      throw new ApiError(
        r.status,
        typeof b?.error === "string" ? b.error : "HTTP_ERROR",
        b?.details,
        parseRetryAfter(r.headers),
      );
    if (
      b?.status !== "success" ||
      b.code !== r.status ||
      typeof b.message !== "string" ||
      !("data" in b)
    )
      throw new ApiError(r.status, "INVALID_ENVELOPE");
    return b.data as T;
  };
}
export function errorText(e: unknown) {
  if (e instanceof ApiError && e.code === "REQUEST_TIMEOUT")
    return "Yêu cầu quá thời gian chờ. Vui lòng thử lại.";
  if (!(e instanceof ApiError) || e.status === 0 || e.status >= 500) {
    if (
      e instanceof ApiError &&
      e.status === 502 &&
      e.code === "UPSTREAM_ERROR"
    )
      return "Dịch vụ thực thi tạm thời gián đoạn. Vui lòng thử lại.";
    if (e instanceof ApiError && e.status === 504 && e.code === "TIMEOUT")
      return "Hệ thống xử lý quá thời gian chờ. Vui lòng thử lại.";
    return "Không thể kết nối dịch vụ. Vui lòng thử lại.";
  }
  if (e.status === 401 && e.code === "INVALID_CREDENTIALS")
    return "Email hoặc mật khẩu không đúng.";
  if (e.status === 401 && e.code === "REFRESH_TOKEN_INVALID")
    return "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.";
  if (e.status === 401) return "Phiên đã hết hạn. Vui lòng đăng nhập lại.";
  if (e.code === "SUBMISSION_COOLDOWN") {
    return e.retryAfterSec !== null
      ? `Vui lòng đợi ${e.retryAfterSec} giây trước khi nộp lại bài này.`
      : "Vui lòng đợi một lát trước khi nộp lại bài này.";
  }
  if (e.code === "RATE_LIMITED") {
    return e.retryAfterSec !== null
      ? `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${e.retryAfterSec} giây.`
      : "Bạn thao tác quá nhanh. Vui lòng thử lại sau.";
  }
  return (
    (
      {
        BAD_REQUEST: "Yêu cầu không đúng định dạng.",
        VALIDATION_ERROR: "Thông tin chưa hợp lệ.",
        RESET_TOKEN_INVALID:
          "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
        CURRENT_PASSWORD_INVALID: "Mật khẩu hiện tại không đúng.",
        FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
        LEVEL_LOCKED: "Cần hoàn thành hết các cấp độ trước để mở khóa bài này.",
        SOLUTION_NOT_ALLOWED:
          "Bạn cần giải đạt (Accepted) bài này trước khi chia sẻ lời giải.",
        ACCOUNT_DISABLED: "Tài khoản đã bị vô hiệu hóa.",
        NOT_FOUND: "Không tìm thấy dữ liệu yêu cầu.",
        DAILY_CHALLENGE_NOT_FOUND:
          "Hôm nay chưa có bài thử thách nào được giao.",
        METHOD_NOT_ALLOWED: "Phương thức yêu cầu không được hỗ trợ.",
        CONFLICT: "Yêu cầu xung đột với trạng thái dữ liệu hiện tại.",
        PROBLEM_PUBLISHED_LOCKED:
          "Bài tập đã xuất bản không thể thay đổi đầu vào chấm bài.",
        AI_REVIEW_NOT_ELIGIBLE:
          "Chỉ bài nộp đạt kết quả Accepted mới có đánh giá AI.",
        PUBLISH_REQUIREMENTS_NOT_MET: "Bài tập chưa đủ điều kiện để xuất bản.",
        EMAIL_EXISTS: "Email đã được sử dụng.",
        USERNAME_EXISTS: "Tên người dùng đã được sử dụng.",
        RESOURCE_IN_USE: "Dữ liệu đang được sử dụng và không thể xóa.",
        REQUEST_TOO_LARGE: "Nội dung gửi lên vượt quá dung lượng cho phép.",
        UNPROCESSABLE_REQUEST: "Không thể xử lý yêu cầu hiện tại.",
        LANGUAGE_NOT_SUPPORTED:
          "Ngôn ngữ lập trình này không được hỗ trợ cho bài tập.",
        INVALID_COMMENT_PARENT:
          "Chỉ có thể trả lời trực tiếp bình luận gốc còn tồn tại trong cùng bài viết.",
        INVALID_ENVELOPE: "Phản hồi từ máy chủ không đúng định dạng quy ước.",
        INVALID_CONTRACT_DATA:
          "Dữ liệu phản hồi từ máy chủ không đúng chuẩn v1.",
      } as Record<string, string>
    )[e.code] ?? `Không thể hoàn tất yêu cầu (${e.status}).`
  );
}
