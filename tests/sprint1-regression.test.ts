import { describe, it, expect } from "vitest";
import { createSession } from "@/features/auth/store";
import { createTransport } from "@/lib/api/client";
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "a@b.com",
  username: "abc",
  fullName: null,
  avatarUrl: null,
  bio: null,
  role: "student",
  isActive: true,
  createdAt: "2026-11-07T00:00:00Z",
  updatedAt: "2026-11-07T00:00:00Z",
};
const response = (data: unknown) =>
  new Response(
    JSON.stringify({ status: "success", code: 200, message: "ok", data }),
  );
describe("Sprint 1 regression", () => {
  it.each([
    { id: user.id },
    { ...user, role: "owner" },
    { ...user, email: undefined },
    { ...user, isActive: "true" },
    { ...user, createdAt: "bad" },
  ])("rejects malformed auth user %#", async (malformed) => {
    const s = createSession(
      createTransport("http://gateway", async () =>
        response({ accessToken: "fake", user: malformed }),
      ),
    );
    await expect(s.bootstrap()).rejects.toMatchObject({
      code: "INVALID_AUTH_DATA",
    });
    expect(s.getSnapshot().status).toBe("initializing");
    expect(s.getSnapshot().user).toBeNull();
  });
  it.each([42, "", "  "])("rejects invalid token %#", async (accessToken) => {
    const s = createSession(
      createTransport("http://gateway", async () =>
        response({ accessToken, user }),
      ),
    );
    await expect(s.bootstrap()).rejects.toMatchObject({
      code: "INVALID_AUTH_DATA",
    });
    expect(s.getSnapshot().user).toBeNull();
  });
  it("preserves cancellation rather than reporting network failure", async () => {
    const cancelled = new DOMException("Cancelled", "AbortError");
    const send = createTransport("http://gateway", async () => {
      throw cancelled;
    });
    await expect(send("/api/v1/users/me")).rejects.toBe(cancelled);
  });
  it("keeps actual network failures retryable", async () => {
    const send = createTransport("http://gateway", async () => {
      throw new TypeError("offline");
    });
    await expect(send("/api/v1/users/me")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      status: 0,
    });
  });
});
