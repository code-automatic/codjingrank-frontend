"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorText } from "@/lib/api/client";
import { useSession } from "./session";
import { SessionNotice } from "./SessionNotice";
import "./login-prototype.css";
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
    <main className={mode === "login" ? "login-prototype" : undefined}>
      {mode === "login" && (
        <aside className="login-story" aria-label="Codjingrank">
          <Link href="/" className="prototype-brand">
            <span aria-hidden="true" className="prototype-mark">
              c<span>.</span>
            </span>
            codjingrank
          </Link>
          <div className="login-story-content">
            <h2>
              Mỗi bài giải.
              <br />
              Một bước tiến.
            </h2>
            <p>
              Đọc đề, thử ý tưởng và tìm lời giải của bạn. Tiếp tục hành trình
              lập trình ngay từ nơi bạn đã dừng lại.
            </p>
            <div className="login-code-preview" aria-hidden="true">
              <div className="preview-file">
                sum_two.py <span>Python 3</span>
              </div>
              <pre>
                <span className="preview-comment">
                  # Bắt đầu từ những điều đơn giản
                </span>
                {"\n"}
                <span className="preview-keyword">def</span> sum_two(a, b):
                {"\n    "}<span className="preview-keyword">return</span> a + b
              </pre>
              <div className="preview-output">
                <span>
                  Đầu vào <strong>2 3</strong>
                </span>
                <span>
                  Đầu ra <strong>5</strong>
                </span>
              </div>
            </div>
          </div>
          <p className="login-story-footer">
            Không gian để tập trung. Công cụ để tiến bộ.
          </p>
        </aside>
      )}
      <section className="card">
        {mode === "register" && (
          <p className="muted">CODJINGRANK / TÀI KHOẢN</p>
        )}
        {mode === "login" && (
          <Link href="/" className="login-mobile-brand">
            codjingrank<span>.</span>
          </Link>
        )}
        <h1>
          {mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản học tập"}
        </h1>
        {mode === "login" && (
          <p className="login-intro">
            Đăng nhập để tiếp tục luyện tập cùng Codjingrank.
          </p>
        )}
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
                <div
                  className={mode === "login" ? "login-password" : undefined}
                >
                  <input
                    id="password"
                    name="password"
                    type={
                      mode === "login" && showPassword ? "text" : "password"
                    }
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    required
                    aria-describedby={
                      mode === "register" ? "password-hint" : undefined
                    }
                  />
                  {mode === "login" && (
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
                  )}
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
                <button
                  className={mode === "login" ? "login-submit" : undefined}
                  disabled={busy}
                >
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
