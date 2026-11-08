import { ApiError, createTransport } from "@/lib/api/client";
export type User = {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: "student" | "teacher" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type AuthData = { accessToken: string; user: User };
export type Register = {
  email: string;
  username: string;
  password: string;
  fullName?: string;
};
export type Snapshot = {
  status: "initializing" | "authenticated" | "anonymous";
  user: User | null;
  error: unknown;
  expired: boolean;
  loggingOut: boolean;
};
const initial: Snapshot = {
  status: "initializing",
  user: null,
  error: null,
  expired: false,
  loggingOut: false,
};
export function createSession(send: ReturnType<typeof createTransport>) {
  let state = initial,
    token: string | undefined,
    epoch = 0,
    revision = 0,
    flight: Promise<void> | undefined,
    logoutFlight: Promise<void> | undefined;
  const listeners = new Set<() => void>();
  const pub = (p: Partial<Snapshot>) => {
    state = { ...state, ...p };
    listeners.forEach((f) => f());
  };
  const clear = (expired = false) => {
    epoch++;
    token = undefined;
    pub({ status: "anonymous", user: null, error: null, expired });
  };
  const check = (n: number) => {
    if (n !== epoch) throw new ApiError(0, "SESSION_CHANGED");
  };
  const accept = (d: AuthData, n: number) => {
    check(n);
    if (
      !d?.accessToken ||
      !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(d.user?.id ?? "")
    )
      throw new ApiError(200, "INVALID_AUTH_DATA");
    token = d.accessToken;
    revision++;
    pub({ status: "authenticated", user: d.user, error: null, expired: false });
  };
  function refresh() {
    if (logoutFlight || state.loggingOut)
      return Promise.reject(new ApiError(0, "SESSION_CHANGED"));
    if (flight) return flight;
    const n = epoch;
    flight = (async () => {
      try {
        accept(
          await send<AuthData>("/api/v1/auth/refresh", { method: "POST" }),
          n,
        );
      } catch (e) {
        if (n === epoch) {
          if (e instanceof ApiError && e.status === 401) clear(true);
          else pub({ error: e });
        }
        throw e;
      }
    })().finally(() => {
      flight = undefined;
    });
    return flight;
  }
  async function auth(k: "login" | "register", body: object) {
    if (logoutFlight) await logoutFlight;
    if (flight) await flight.catch(() => {});
    const n = ++epoch;
    accept(
      await send<AuthData>(`/api/v1/auth/${k}`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
      n,
    );
  }
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (/^\/api\/v1\/auth\//.test(path)) return send<T>(path, init);
    const n = epoch,
      r = revision;
    try {
      const x = await send<T>(path, init, token);
      check(n);
      return x;
    } catch (e) {
      check(n);
      if (!(e instanceof ApiError) || e.status !== 401) throw e;
      if (revision === r) await refresh();
      check(n);
      try {
        const x = await send<T>(path, init, token);
        check(n);
        return x;
      } catch (x) {
        if (n === epoch && x instanceof ApiError && x.status === 401)
          clear(true);
        throw x;
      }
    }
  }
  function logout() {
    if (logoutFlight) return logoutFlight;
    clear();
    pub({ loggingOut: true });
    const p = flight;
    logoutFlight = (async () => {
      await p?.catch(() => {});
      try {
        await send<void>("/api/v1/auth/logout", { method: "POST" });
      } catch (e) {
        pub({ error: e });
        throw e;
      } finally {
        pub({ loggingOut: false });
      }
    })().finally(() => {
      logoutFlight = undefined;
    });
    return logoutFlight;
  }
  return {
    getSnapshot: () => state,
    getServerSnapshot: () => initial,
    subscribe: (f: () => void) => {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    bootstrap: refresh,
    login: (b: { email: string; password: string }) => auth("login", b),
    register: (b: Register) => auth("register", b),
    logout,
    request,
    me: async () => {
      const n = epoch;
      const d = await request<{ user: User }>("/api/v1/users/me");
      check(n);
      pub({ user: d.user });
      return d.user;
    },
  };
}
