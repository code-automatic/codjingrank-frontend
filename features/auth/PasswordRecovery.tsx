"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useApiClient } from "@/lib/api/useApiClient";
import { ApiError, errorText } from "@/lib/api/client";
import { Icon } from "@/lib/ui/Icon";
import { BrandLogo } from "@/lib/ui/BrandLogo";
import { AuthMotion } from "./AuthMotion";
import { validateRegistration } from "./validation";
import "./login-prototype.css";

export const passwordRecoveryEnabled =
  process.env.NEXT_PUBLIC_MOCK_MODE !== "true";

export function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const api = useApiClient();
  const [stage, setStage] = useState(reset);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(false);
  const feedback = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const field = Object.keys(fieldErrors)[0];
    if (field)
      formRef.current
        ?.querySelector<HTMLInputElement>(`[name="${field}"]`)
        ?.focus();
    else if (done || error || message) feedback.current?.focus();
  }, [done, error, message, fieldErrors]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordRecoveryEnabled || busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setMessage("");
    setFieldErrors({});
    const errors: Record<string, string> = {};
    const otp = String(data.get("otp") || "").trim();
    const password = String(data.get("newPassword") || "");
    if (stage) {
      if (!/^\d{6}$/.test(otp)) errors.otp = "Nhập đủ 6 chữ số trong email.";
      const invalid = validateRegistration({
        username: "valid_user",
        password,
      });
      if (invalid) errors.newPassword = invalid;
      if (password !== data.get("confirmPassword"))
        errors.confirmPassword = "Hai mật khẩu chưa khớp.";
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        return;
      }
    }
    setBusy(true);
    try {
      const options = { signal: AbortSignal.timeout(15000) };
      if (stage) {
        await api.account.resetPassword(
          { email: email.trim(), otp, newPassword: password },
          options,
        );
        form.reset();
        setDone(true);
      } else {
        await api.account.forgotPassword({ email: email.trim() }, options);
        setStage(true);
        setMessage(
          "Yêu cầu đã được tiếp nhận. Nếu email thuộc tài khoản hợp lệ, bạn sẽ nhận mã OTP. Hãy kiểm tra cả thư rác.",
        );
      }
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "RESET_TOKEN_INVALID")
        setFieldErrors({
          otp: "Mã không đúng, đã hết hạn hoặc đã sử dụng. Kiểm tra lại hoặc yêu cầu mã mới.",
        });
      else if (reason instanceof ApiError && reason.status === 404)
        setError(
          "Dịch vụ khôi phục chưa có trên máy chủ đang kết nối. Vui lòng thử lại sau.",
        );
      else if (
        reason instanceof Error &&
        ["TimeoutError", "AbortError"].includes(reason.name)
      )
        setError("Yêu cầu quá thời gian chờ. Vui lòng thử lại.");
      else setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }
  function fieldError(name: string) {
    return (
      fieldErrors[name] && (
        <p id={`${name}-error`} className="auth-field-error" role="alert">
          {fieldErrors[name]}
        </p>
      )
    );
  }
  return (
    <main className="login-prototype auth-page auth-page--recovery">
      <aside className="auth-story" aria-label="Codjingrank Community">
        <AuthMotion />
        <div className="auth-story-body">
          <h2>
            Tiếp tục hành trình
            <br />
            <span className="auth-community-accent">của bạn.</span>
          </h2>
          <p className="auth-story-caption">
            Luyện giải lập trình. Từng bài một.
          </p>
        </div>
      </aside>
      <section className="auth-form-side" aria-labelledby="recovery-title">
        <div className="auth-form-content">
          <Link
            href="/"
            className="auth-brand"
            aria-label="Codjingrank — trang chủ"
          >
            <BrandLogo />
          </Link>
          <Link href="/login" className="recovery-back">
            <Icon name="chevronLeft" /> Đăng nhập
          </Link>
          <header className="auth-heading">
            <h1 id="recovery-title">
              {done
                ? "Mật khẩu đã được cập nhật"
                : stage
                  ? "Đặt mật khẩu mới"
                  : "Quên mật khẩu?"}
            </h1>
            <p>
              {stage
                ? "Nhập mã OTP trong email và tạo mật khẩu mới."
                : "Nhập email tài khoản để nhận mã khôi phục."}
            </p>
          </header>
          {!passwordRecoveryEnabled && (
            <div className="recovery-notice" role="note">
              <Icon name="lock" />
              <p>
                Không gửi email hoặc đổi mật khẩu trong môi trường mock. Hãy thử
                trên website kết nối backend thật.
              </p>
            </div>
          )}
          <div
            ref={feedback}
            tabIndex={-1}
            role={error ? "alert" : "status"}
            className={
              error ? "error auth-error recovery-feedback" : "recovery-feedback"
            }
          >
            {error ||
              (done
                ? "Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới."
                : message)}
          </div>
          {!done && (
            <form
              ref={formRef}
              onSubmit={submit}
              aria-busy={busy}
              onChange={(event) => {
                setError("");
                const name = (event.target as unknown as HTMLInputElement).name;
                setFieldErrors((current) => {
                  const next = { ...current };
                  delete next[name];
                  return next;
                });
              }}
            >
              <fieldset disabled={busy || !passwordRecoveryEnabled}>
                <legend className="sr-only">Khôi phục tài khoản</legend>
                <div className="auth-field">
                  <label htmlFor="recovery-email">Email tài khoản</label>
                  <input
                    id="recovery-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                {stage && (
                  <>
                    <div className="auth-field">
                      <label htmlFor="recovery-otp">Mã OTP</label>
                      <input
                        id="recovery-otp"
                        name="otp"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                        pattern="[0-9]{6}"
                        maxLength={6}
                        aria-invalid={!!fieldErrors.otp}
                        aria-describedby={
                          fieldErrors.otp ? "otp-error" : undefined
                        }
                        placeholder="6 chữ số"
                      />
                      {fieldError("otp")}
                    </div>
                    <div className="auth-field">
                      <label htmlFor="recovery-password">Mật khẩu mới</label>
                      <div className="login-password">
                        <input
                          id="recovery-password"
                          name="newPassword"
                          type={visible ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          aria-invalid={!!fieldErrors.newPassword}
                          aria-describedby={`recovery-password-hint${fieldErrors.newPassword ? " newPassword-error" : ""}`}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          title={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          aria-pressed={visible}
                          onClick={() => setVisible(!visible)}
                        >
                          <Icon name={visible ? "eyeOff" : "eye"} size={20} />
                        </button>
                      </div>
                      <small id="recovery-password-hint">
                        8–72 ký tự, có chữ và số, tối đa 72 byte UTF-8.
                      </small>
                      {fieldError("newPassword")}
                    </div>
                    <div className="auth-field">
                      <label htmlFor="recovery-confirm">
                        Nhập lại mật khẩu mới
                      </label>
                      <input
                        id="recovery-confirm"
                        name="confirmPassword"
                        type={visible ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        aria-invalid={!!fieldErrors.confirmPassword}
                        aria-describedby={
                          fieldErrors.confirmPassword
                            ? "confirmPassword-error"
                            : undefined
                        }
                      />
                      {fieldError("confirmPassword")}
                    </div>
                  </>
                )}
                <button
                  className="login-submit"
                  disabled={busy || !passwordRecoveryEnabled}
                >
                  {busy
                    ? "Đang xử lý…"
                    : stage
                      ? "Lưu mật khẩu mới"
                      : "Yêu cầu mã OTP"}
                </button>
              </fieldset>
            </form>
          )}
          {stage && !done && (
            <p className="auth-switch">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setStage(false);
                  setError("");
                  setMessage("");
                  setFieldErrors({});
                }}
              >
                Yêu cầu mã mới
              </button>
              <small>Mỗi yêu cầu nên cách nhau ít nhất 1 phút.</small>
            </p>
          )}
          {!stage && (
            <p className="auth-switch">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setStage(true);
                  setMessage("");
                  setError("");
                }}
              >
                Tôi đã có mã OTP
              </button>
            </p>
          )}
          <p className="auth-switch">
            <Link href="/login">Quay lại đăng nhập</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
