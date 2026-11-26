import { ApiError, errorText } from "@/lib/api/client";

export type AuthField = "email" | "username" | "fullName" | "password";
export type AuthFieldErrors = Partial<Record<AuthField, string>>;

export function authFieldErrors(error: unknown): AuthFieldErrors {
  if (!(error instanceof ApiError)) return {};
  if (error.code === "EMAIL_EXISTS") return { email: "Email đã được sử dụng. Hãy đăng nhập hoặc dùng email khác." };
  if (error.code === "USERNAME_EXISTS") return { username: "Tên người dùng đã được sử dụng. Hãy chọn tên khác." };
  const result: AuthFieldErrors = {};
  const details = error.details;
  const entries = Array.isArray(details) ? details : details && typeof details === "object" ? Object.entries(details).map(([field, message]) => ({ field, message })) : [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const { field, message } = entry;
    if (["email", "username", "fullName", "password"].includes(field) && typeof message === "string") result[field as AuthField] = message;
  }
  return result;
}

export function authErrorText(error: unknown, mode: "login" | "register") {
  if (mode === "register" && error instanceof ApiError && error.status === 409 && error.code === "CONFLICT")
    return "Không thể tạo tài khoản vì thông tin bị trùng. Máy chủ chưa cho biết email hay tên người dùng bị trùng; hãy kiểm tra hai trường này hoặc đăng nhập nếu đã có tài khoản.";
  if (mode === "login" && error instanceof ApiError && error.status === 401 && error.code !== "ACCOUNT_DISABLED")
    return "Email hoặc mật khẩu không đúng.";
  return errorText(error);
}
