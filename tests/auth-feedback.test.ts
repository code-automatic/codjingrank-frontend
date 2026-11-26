import { describe, expect, it } from "vitest";
import { ApiError } from "../lib/api/client";
import { authErrorText, authFieldErrors } from "../features/auth/feedback";

describe("authentication feedback", () => {
  it("places known conflicts on their own fields", () => {
    expect(authFieldErrors(new ApiError(409, "EMAIL_EXISTS"))).toHaveProperty("email");
    expect(authFieldErrors(new ApiError(409, "USERNAME_EXISTS"))).toHaveProperty("username");
    expect(authFieldErrors(new ApiError(409, "CONFLICT"))).toEqual({});
  });
  it("maps structured field errors without guessing", () => {
    expect(authFieldErrors(new ApiError(400, "VALIDATION_ERROR", [{ field: "password", message: "Mật khẩu chưa hợp lệ" }]))).toEqual({ password: "Mật khẩu chưa hợp lệ" });
  });
  it.each(["UNAUTHORIZED", "INVALID_CREDENTIALS", "REFRESH_TOKEN_INVALID"])("explains login rejection without claiming session expiry: %s", (code) => {
    expect(authErrorText(new ApiError(401, code), "login")).toContain("Email hoặc mật khẩu không đúng");
  });
  it("retains network failures and registration conflicts", () => {
    expect(authErrorText(new ApiError(0, "NETWORK_ERROR"), "login")).toContain("Không thể kết nối");
    expect(authErrorText(new ApiError(409, "EMAIL_EXISTS"), "register")).toBe("Email đã được sử dụng.");
  });
  it("retains expired-session feedback outside login", () => {
    expect(authErrorText(new ApiError(401, "UNAUTHORIZED"), "register")).toContain("Phiên đã hết hạn");
  });
});
