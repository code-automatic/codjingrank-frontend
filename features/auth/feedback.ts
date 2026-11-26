import { ApiError, errorText } from "@/lib/api/client";

export function authErrorText(error: unknown, mode: "login" | "register") {
  if (mode === "login" && error instanceof ApiError && error.status === 401 && error.code !== "ACCOUNT_DISABLED")
    return "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra và thử lại.";
  return errorText(error);
}
