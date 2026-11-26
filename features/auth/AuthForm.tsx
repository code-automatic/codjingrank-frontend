"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authErrorText, authFieldErrors, type AuthFieldErrors } from "./feedback";
import { useSession } from "./session";
import { SessionNotice } from "./SessionNotice";
import "./login-prototype.css";
import { AuthMotion } from "./AuthMotion";
import { validateRegistration } from "./validation";
import { Icon } from "@/lib/ui/Icon";
import { BrandLogo } from "@/lib/ui/BrandLogo";
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { store, status, loggingOut } = useSession();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const alert = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (status === "authenticated") router.replace("/protected");
  }, [status, router]);
  useEffect(() => {
    if (error) alert.current?.focus();
  }, [error]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email")).trim(),
      password = String(data.get("password")),
      username = String(data.get("username") ?? ""),
      fullName = String(data.get("fullName") ?? "");
    setError("");
    setFieldErrors({});
    if (mode === "register") {
      const message = validateRegistration({ username, password, fullName });
      if (message) {
        const field = message.startsWith("Tên") ? "username" : message.startsWith("Mật") ? "password" : "fullName";
        setFieldErrors({ [field]: message });
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
      const fields = authFieldErrors(e);
      setFieldErrors(fields);
      if (!Object.keys(fields).length) setError(authErrorText(e, mode));
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
        <div className="auth-form-content">
          <Link
            href="/"
            className="auth-brand"
            aria-label="Codjingrank — trang chủ"
          >
            <BrandLogo />
          </Link>
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
              <form onSubmit={submit} aria-busy={busy} onInvalid={(event) => {
                event.preventDefault();
                const input = event.target as unknown as HTMLInputElement;
                const field = input.name as keyof AuthFieldErrors;
                const message = input.validity.valueMissing ? "Vui lòng nhập thông tin này." : field === "email" ? "Email chưa đúng định dạng, ví dụ: ban@example.com." : input.validationMessage;
                setFieldErrors((current) => ({ ...current, [field]: message }));
                event.currentTarget.querySelector<HTMLInputElement>(":invalid")?.focus();
              }} onChange={(event) => {
                if (error) setError("");
                const field = (event.target as unknown as HTMLInputElement).name;
                setFieldErrors((current) => { const next = { ...current }; delete next[field as keyof AuthFieldErrors]; return next; });
              }}>
                <fieldset disabled={busy}>
                  <legend className="sr-only">Thông tin tài khoản</legend>
                  <div className="auth-field auth-field-email">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? "email-error" : undefined}
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      maxLength={mode === "register" ? 254 : undefined}
                    />
                    {fieldErrors.email && <p id="email-error" className="auth-field-error" role="alert">{fieldErrors.email}</p>}
                  </div>
                  {mode === "register" && (
                    <>
                      <div className="auth-field auth-field-username">
                        <label htmlFor="username">Tên người dùng</label>
                        <input
                          id="username"
                          aria-invalid={!!fieldErrors.username}
                          name="username"
                          required
                          autoComplete="username"
                          pattern="[A-Za-z0-9_]{3,50}"
                          aria-describedby={`username-hint${fieldErrors.username ? " username-error" : ""}`}
                          placeholder="Tên của bạn trên Codjingrank"
                        />
                        <small id="username-hint">
                          3–50 ký tự chữ, số hoặc dấu gạch dưới.
                        </small>
                        {fieldErrors.username && <p id="username-error" className="auth-field-error" role="alert">{fieldErrors.username}</p>}
                      </div>
                      <div className="auth-field auth-field-name">
                        <label htmlFor="fullName">
                          Họ tên{" "}
                          <span className="auth-optional">(tuỳ chọn)</span>
                        </label>
                        <input
                          id="fullName"
                          aria-invalid={!!fieldErrors.fullName}
                          aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
                          name="fullName"
                          autoComplete="name"
                          maxLength={120}
                          placeholder="Họ tên (tuỳ chọn)"
                        />
                        {fieldErrors.fullName && <p id="fullName-error" className="auth-field-error" role="alert">{fieldErrors.fullName}</p>}
                      </div>
                    </>
                  )}
                  <div className="auth-field auth-field-password">
                    <label htmlFor="password">Mật khẩu</label>
                    <div className="login-password">
                      <input
                        id="password"
                        aria-invalid={!!fieldErrors.password}
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
                          [mode === "register" ? "password-hint" : "", fieldErrors.password ? "password-error" : ""].filter(Boolean).join(" ") || undefined
                        }
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        aria-label={
                          showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
                        aria-pressed={showPassword}
                        title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <Icon
                          name={showPassword ? "eyeOff" : "eye"}
                          size={20}
                        />
                      </button>
                    </div>
                    {fieldErrors.password && <p id="password-error" className="auth-field-error" role="alert">{fieldErrors.password}</p>}
                    {mode === "register" && (
                      <small id="password-hint">
                        8–72 ký tự, có chữ và số, tối đa 72 byte UTF-8.
                      </small>
                    )}
                  </div>
                  {mode === "login" && (
                    <div className="auth-recovery-link">
                      <Link href="/forgot-password">Quên mật khẩu?</Link>
                    </div>
                  )}
                  {error && (
                    <p id="auth-error" ref={alert} tabIndex={-1} className="error auth-error" role="alert">
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
