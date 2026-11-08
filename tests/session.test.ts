import { describe, it, expect, vi } from "vitest";
import { createSession, type AuthData } from "@/features/auth/store";
import { createTransport, ApiError, errorText } from "@/lib/api/client";
import { validateRegistration } from "@/features/auth/validation";
const data: AuthData = {
  accessToken: "fake",
  user: {
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
  },
};
function ok(d: unknown = data) {
  return new Response(
    JSON.stringify({
      status: "success",
      code: 200,
      message: "display only",
      data: d,
    }),
    { status: 200 },
  );
}
function fail(status = 401) {
  return new Response(
    JSON.stringify({
      status: "error",
      code: status,
      message: "display only",
      error: "UNAUTHORIZED",
      details: null,
    }),
    { status },
  );
}
function deferred() {
  let resolve!: (r: Response) => void;
  const promise = new Promise<Response>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
function setup(
  handler: (url: string, init?: RequestInit) => Promise<Response> | Response,
) {
  const fetcher = vi.fn((url: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(url), init)),
  );
  return {
    store: createSession(createTransport("http://gateway", fetcher)),
    fetcher,
  };
}
describe("session", () => {
  it("bootstrap stays initializing until refresh settles", async () => {
    const d = deferred();
    const { store } = setup(() => d.promise);
    const p = store.bootstrap();
    expect(store.getSnapshot().status).toBe("initializing");
    d.resolve(ok());
    await p;
    expect(store.getSnapshot().status).toBe("authenticated");
  });
  it("concurrent and late 401 share one refresh and one retry each", async () => {
    const gate = deferred(),
      late = deferred();
    let refresh = 0,
      attempts = 0;
    const { store } = setup((url, init) => {
      if (url.endsWith("/refresh")) {
        refresh++;
        return gate.promise;
      }
      attempts++;
      if (new Headers(init?.headers).has("Authorization"))
        return ok({ user: data.user });
      if (url.endsWith("/late")) return late.promise;
      return fail();
    });
    const a = store.request("/api/v1/users/me"),
      b = store.request("/api/v1/users/late");
    await vi.waitFor(() => expect(refresh).toBe(1));
    gate.resolve(ok());
    await a;
    late.resolve(fail());
    await b;
    expect(refresh).toBe(1);
    expect(attempts).toBe(4);
  });
  it("many simultaneous 401 only refresh once", async () => {
    const gate = deferred();
    let count = 0;
    const { store } = setup((url, init) =>
      url.endsWith("/refresh")
        ? (count++, gate.promise)
        : new Headers(init?.headers).has("Authorization")
          ? ok({})
          : fail(),
    );
    const ps = Array.from({ length: 5 }, () =>
      store.request("/api/v1/users/me"),
    );
    await vi.waitFor(() => expect(count).toBe(1));
    gate.resolve(ok());
    await Promise.all(ps);
    expect(count).toBe(1);
  });
  it("second 401 clears session without recursive refresh", async () => {
    let refresh = 0,
      requests = 0;
    const { store } = setup((url) =>
      url.endsWith("/refresh") ? (refresh++, ok()) : (requests++, fail()),
    );
    await expect(store.me()).rejects.toBeInstanceOf(ApiError);
    expect(refresh).toBe(1);
    expect(requests).toBe(2);
    expect(store.getSnapshot().status).toBe("anonymous");
  });
  it("refresh 401 clears user and does not retry original", async () => {
    const { store, fetcher } = setup(() => fail());
    await expect(store.me()).rejects.toBeInstanceOf(ApiError);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot().expired).toBe(true);
  });
  it.each([0, 503])(
    "bootstrap failure %s remains retryable",
    async (status) => {
      const { store } = setup(() => {
        if (!status) throw Error("offline");
        return fail(status);
      });
      await expect(store.bootstrap()).rejects.toBeInstanceOf(ApiError);
      expect(store.getSnapshot().status).toBe("initializing");
      expect(errorText(store.getSnapshot().error)).toContain("thử lại");
    },
  );
  it("logout clears immediately and waits for rotation before revoking", async () => {
    const gate = deferred();
    const { store, fetcher } = setup((url) =>
      url.endsWith("/refresh")
        ? gate.promise
        : new Response(null, { status: 204 }),
    );
    const bootstrap = store.bootstrap().catch(() => {});
    const logout = store.logout();
    expect(store.getSnapshot().status).toBe("anonymous");
    expect(fetcher).toHaveBeenCalledTimes(1);
    gate.resolve(ok());
    await Promise.all([bootstrap, logout]);
    expect(store.getSnapshot().user).toBeNull();
    expect(store.getSnapshot().status).toBe("anonymous");
    expect(fetcher.mock.calls[1][0]).toContain("/logout");
  });
  it.each(["login", "register", "refresh", "logout"])(
    "%s never recursively refreshes",
    async (path) => {
      const { store, fetcher } = setup(() => fail());
      await expect(
        store.request(`/api/v1/auth/${path}`, { method: "POST" }),
      ).rejects.toBeInstanceOf(ApiError);
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );
  it("login/register send exact contract data", async () => {
    const { store, fetcher } = setup(() => ok());
    await store.login({ email: "a@b.com", password: "Coding2026" });
    await store.register({
      email: "a@b.com",
      username: "abc",
      password: "Coding2026",
    });
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toEqual({
      email: "a@b.com",
      username: "abc",
      password: "Coding2026",
    });
    expect(store.getSnapshot().user?.id).toBe(data.user.id);
  });
  it("late profile cannot restore user after logout", async () => {
    const gate = deferred();
    const { store } = setup((url) =>
      url.endsWith("/me") ? gate.promise : new Response(null, { status: 204 }),
    );
    const p = store.me().catch(() => {});
    await store.logout();
    gate.resolve(ok({ user: data.user }));
    await p;
    expect(store.getSnapshot().user).toBeNull();
  });
});
describe("transport and validation", () => {
  it("204 does not parse JSON, credentials included, untrusted headers removed", async () => {
    const response = new Response(null, { status: 204 });
    const json = vi.spyOn(response, "json");
    const f = vi.fn(async () => response);
    await createTransport("http://gateway", f)("/api/v1/auth/logout", {
      headers: { "X-User-ID": "1", Authorization: "untrusted" },
    });
    expect(json).not.toHaveBeenCalled();
    const call = vi.mocked(f).mock.calls as unknown as [string, RequestInit][];
    expect(call[0][1].credentials).toBe("include");
    expect(new Headers(call[0][1].headers).has("X-User-ID")).toBe(false);
    expect(new Headers(call[0][1].headers).has("Authorization")).toBe(false);
  });
  it("rejects wrong envelope code", async () => {
    const send = createTransport(
      "http://gateway",
      async () =>
        new Response(
          JSON.stringify({
            status: "success",
            code: 201,
            message: "x",
            data: {},
          }),
        ),
    );
    await expect(send("/api/v1/users/me")).rejects.toMatchObject({
      code: "INVALID_ENVELOPE",
    });
  });
  it("does not use error message for credentials logic", () => {
    expect(errorText(new ApiError(503, "INVALID_CREDENTIALS"))).toContain(
      "thử lại",
    );
    expect(errorText(new ApiError(401, "INVALID_CREDENTIALS"))).toContain(
      "không đúng",
    );
  });
  it("rejects legacy integer ids", async () => {
    const { store } = setup(() =>
      ok({ ...data, user: { ...data.user, id: 1 } }),
    );
    await expect(store.bootstrap()).rejects.toMatchObject({
      code: "INVALID_AUTH_DATA",
    });
  });
  it("validates UTF-8 byte limit and username", () => {
    expect(
      validateRegistration({ username: "abc", password: "Coding2026" }),
    ).toBe("");
    expect(
      validateRegistration({
        username: "abc",
        password: "A1" + "ế".repeat(24),
      }),
    ).toContain("byte");
    expect(
      validateRegistration({ username: "x!", password: "Coding2026" }),
    ).toContain("Tên");
  });
});
