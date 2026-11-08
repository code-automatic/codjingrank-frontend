"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorText } from "@/lib/api/client";
import { useSession } from "./session";
import { SessionNotice } from "./SessionNotice";
import { validateRegistration } from "./validation";
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { store, status, loggingOut } = useSession();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const alert = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (status === "authenticated") router.replace("/protected");
  }, [status, router]);
  useEffect(() => {
    if (error) alert.current?.focus();
  }, [error]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email")).trim(),
      password = String(data.get("password")),
      username = String(data.get("username") ?? ""),
      fullName = String(data.get("fullName") ?? "");
    setError("");
    if (mode === "register") {
      const message = validateRegistration({ username, password, fullName });
      if (message) {
        setError(message);
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "login") await store.login({ email, password });
      else
        await store.register({
          email,
          username,
          password,
          ...(fullName ? { fullName } : {}),
        });
      form.reset();
      router.replace("/protected");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main>
      <section className="card">
        <p className="muted">CODJINGRANK / TÀI KHOẢN</p>
        <h1>
          {mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản học tập"}
        </h1>
        <SessionNotice />
        {status === "anonymous" && !loggingOut && (
          <>
            <form onSubmit={submit}>
              <fieldset disabled={busy}>
                <legend className="sr-only">Thông tin tài khoản</legend>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={mode === "register" ? 254 : undefined}
                />
                {mode === "register" && (
                  <>
                    <label htmlFor="username">Tên người dùng</label>
                    <input
                      id="username"
                      name="username"
                      required
                      autoComplete="username"
                      pattern="[A-Za-z0-9_]{3,50}"
                      aria-describedby="username-hint"
                    />
                    <small id="username-hint">
                      3–50 ký tự chữ, số hoặc dấu gạch dưới.
                    </small>
                    <label htmlFor="fullName">Họ tên (tuỳ chọn)</label>
                    <input
                      id="fullName"
                      name="fullName"
                      autoComplete="name"
                      maxLength={120}
                    />
                  </>
                )}
                <label htmlFor="password">Mật khẩu</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  aria-describedby={
                    mode === "register" ? "password-hint" : undefined
                  }
                />
                {mode === "register" && (
                  <small id="password-hint">
                    8–72 ký tự, có chữ và số, tối đa 72 byte UTF-8.
                  </small>
                )}
                {error && (
                  <p ref={alert} tabIndex={-1} className="error" role="alert">
                    {error}
                  </p>
                )}
                <button disabled={busy}>
                  {busy
                    ? "Đang xử lý…"
                    : mode === "login"
                      ? "Đăng nhập"
                      : "Đăng ký"}
                </button>
              </fieldset>
            </form>
            <p>
              {mode === "login" ? (
                <>
                  Chưa có tài khoản? <Link href="/register">Đăng ký</Link>
                </>
              ) : (
                <>
                  Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
                </>
              )}
            </p>
          </>
        )}
      </section>
    </main>
  );
}
