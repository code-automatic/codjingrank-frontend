"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorText } from "@/lib/api/client";
import { useSession } from "./session";
import { SessionNotice } from "./SessionNotice";
import "./login-prototype.css";
import { AuthMotion } from "./AuthMotion";
import { ThemeToggle } from "@/lib/ui/ThemeToggle";
import { validateRegistration } from "./validation";
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { store, status, loggingOut } = useSession();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <main className={`login-prototype auth-page auth-page--${mode}`}>
      <aside className="auth-story" aria-label="Codjingrank Community">
        <AuthMotion />
        <div className="auth-story-body">
          <p className="auth-welcome" lang="en">
            Welcome to
          </p>
          <h2 lang="en">
            Codjingrank <span className="auth-community-accent">Community</span>
          </h2>
          <p className="auth-story-caption">
            Luyện giải lập trình. Từng bài một.
          </p>
        </div>
      </aside>
      <section className="auth-form-side" aria-labelledby="auth-title">
        <div className="auth-theme-control">
          <ThemeToggle />
        </div>
        <div className="auth-form-content">
          <header className="auth-heading">
            <h1 id="auth-title" lang="en">
              <span>{mode === "login" ? "Welcome back" : "Join us"}</span>
              <span>
                {mode === "login"
                  ? "Log in to Codjingrank"
                  : "Create a Codjingrank account"}
              </span>
            </h1>
            <p>
              {mode === "login"
                ? "Tiếp tục luyện giải lập trình cùng Codjingrank."
                : "Tạo tài khoản để bắt đầu luyện giải lập trình."}
            </p>
          </header>
          <div className="auth-session">
            <SessionNotice />
          </div>
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
                    placeholder="you@example.com"
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
                        placeholder="Tên của bạn trên Codjingrank"
                      />
                      <small id="username-hint">
                        3–50 ký tự chữ, số hoặc dấu gạch dưới.
                      </small>
                      <label htmlFor="fullName">
                        Họ tên <span className="auth-optional">(tuỳ chọn)</span>
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        autoComplete="name"
                        maxLength={120}
                        placeholder="Họ tên (tuỳ chọn)"
                      />
                    </>
                  )}
                  <label htmlFor="password">Mật khẩu</label>
                  <div className="login-password">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      placeholder={
                        mode === "login"
                          ? "Nhập mật khẩu của bạn"
                          : "Tạo mật khẩu"
                      }
                      required
                      aria-describedby={
                        mode === "register" ? "password-hint" : undefined
                      }
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label={
                        showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
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
                  <button className="login-submit" disabled={busy}>
                    {busy
                      ? "Đang xử lý…"
                      : mode === "login"
                        ? "Đăng nhập"
                        : "Đăng ký"}
                  </button>
                </fieldset>
              </form>
              <p className="auth-switch">
                {mode === "login" ? (
                  <>
                    Chưa có tài khoản?{" "}
                    <Link href="/register">Đăng ký ngay</Link>
                  </>
                ) : (
                  <>
                    Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
