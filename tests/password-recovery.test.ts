import { describe, expect, it, vi } from "vitest";
import { createApiClient, createTransport } from "../lib/api";

describe("OTP password recovery backend contract", () => {
  it("accepts generic 202 and sends email/otp/newPassword for reset with 204", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ status: "success", code: 202, message: "Accepted", data: null }), { status: 202 })).mockResolvedValueOnce(new Response(null, { status: 204 }));
    const send = createTransport("https://example.com", fetcher);
    const request = <T>(path: string, init?: RequestInit) => send<T>(path, init);
    const api = createApiClient({ publicRequest: request, authRequest: request });
    await expect(api.account.forgotPassword({ email: "user@example.com" })).resolves.toBeNull();
    await expect(api.account.resetPassword({ email: "user@example.com", otp: "123456", newPassword: "NewPassword123" })).resolves.toBeUndefined();
    expect(fetcher.mock.calls[1][0]).toBe("https://example.com/api/v1/auth/reset-password");
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ email: "user@example.com", otp: "123456", newPassword: "NewPassword123" });
  });
  it("rejects invalid OTP before making a request", async () => {
    const request = vi.fn();
    const api = createApiClient({ publicRequest: request, authRequest: request });
    await expect(api.account.resetPassword({ email: "user@example.com", otp: "wrong", newPassword: "NewPassword123" })).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
});
