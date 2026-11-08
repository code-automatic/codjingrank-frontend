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
  ) {
    super(code);
  }
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
    if (!path.startsWith("/api/v1/") || path.includes(".."))
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
    } catch {
      throw new ApiError(0, "NETWORK_ERROR");
    }
    if (r.status === 204) return undefined as T;
    const b = await r.json().catch(() => null);
    if (!r.ok)
      throw new ApiError(
        r.status,
        typeof b?.error === "string" ? b.error : "HTTP_ERROR",
        b?.details,
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
  if (!(e instanceof ApiError) || e.status === 0 || e.status >= 500)
    return "Không thể kết nối dịch vụ. Vui lòng thử lại.";
  if (e.status === 401 && e.code === "INVALID_CREDENTIALS")
    return "Email hoặc mật khẩu không đúng.";
  if (e.status === 401) return "Phiên đã hết hạn. Vui lòng đăng nhập lại.";
  return (
    (
      {
        EMAIL_EXISTS: "Email đã được sử dụng.",
        USERNAME_EXISTS: "Tên người dùng đã được sử dụng.",
        VALIDATION_ERROR: "Thông tin chưa hợp lệ.",
      } as Record<string, string>
    )[e.code] ?? `Không thể hoàn tất yêu cầu (${e.status}).`
  );
}
