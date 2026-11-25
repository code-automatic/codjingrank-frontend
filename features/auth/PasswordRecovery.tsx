"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useApiClient } from "@/lib/api/useApiClient";
import { ApiError, errorText } from "@/lib/api/client";
import { Icon } from "@/lib/ui/Icon";
import { BrandLogo } from "@/lib/ui/BrandLogo";
import { AuthMotion } from "./AuthMotion";
import { validateRegistration } from "./validation";
import "./login-prototype.css";

export const passwordRecoveryEnabled =
  process.env.NEXT_PUBLIC_PASSWORD_RESET_ENABLED === "true" &&
  process.env.NEXT_PUBLIC_MOCK_MODE !== "true";

export function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const api = useApiClient();
  const params = useSearchParams();
  const token = params.get("token")?.trim() || "";
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [visible, setVisible] = useState(false);
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (done || error) feedback.current?.focus();
  }, [done, error]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordRecoveryEnabled || busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    if (reset) {
      const password = String(data.get("newPassword") || "");
      const invalid = validateRegistration({
        username: "valid_user",
        password,
      });
      if (invalid) {
        setError(invalid);
        return;
      }
      if (password !== data.get("confirmPassword")) {
        setError("Hai mật khẩu chưa khớp. Vui lòng kiểm tra lại.");
        return;
      }
    }
    setBusy(true);
    try {
      if (reset)
        await api.account.resetPassword({
          token,
          newPassword: String(data.get("newPassword")),
        });
      else
        await api.account.forgotPassword({
          email: String(data.get("email")).trim(),
        });
      form.reset();
      setDone(true);
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "RESET_TOKEN_INVALID") {
        setExpired(true);
        setError(
          "Liên kết đã hết hạn, đã được sử dụng hoặc không hợp lệ. Hãy yêu cầu liên kết mới.",
        );
      } else setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-prototype auth-page auth-page--recovery">
      <aside className="auth-story" aria-label="Codjingrank Community">
        <AuthMotion />
        <div className="auth-story-body">
          <p className="auth-welcome">Codjingrank Community</p>
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
            <Icon name="chevronLeft" />
            Đăng nhập
          </Link>
          <header className="auth-heading">
            <h1 id="recovery-title">
              {reset ? "Đặt mật khẩu mới" : "Quên mật khẩu?"}
            </h1>
            <p>
              {reset
                ? "Tạo mật khẩu mới để bảo vệ tài khoản Codjingrank của bạn."
                : "Nhập email tài khoản để yêu cầu liên kết khôi phục mật khẩu."}
            </p>
          </header>
          {!passwordRecoveryEnabled && (
            <div className="recovery-notice" role="note">
              <Icon name="lock" size={20} />
              <div>
                <strong>Khôi phục mật khẩu chưa sẵn sàng</strong>
                <p>
                  Dịch vụ gửi email và xác thực liên kết chưa được kết nối. Hiện
                  chưa thể gửi yêu cầu hoặc đổi mật khẩu tại đây.
                </p>
              </div>
            </div>
          )}
          <div
            ref={feedback}
            tabIndex={-1}
            role={error ? "alert" : "status"}
            className={error ? "error recovery-feedback" : "recovery-feedback"}
          >
            {error ||
              (done
                ? reset
                  ? "Đã đổi mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới."
                  : "Yêu cầu đã được tiếp nhận. Nếu email thuộc một tài khoản, hướng dẫn khôi phục sẽ được gửi đến email đó."
                : "")}
          </div>
          {reset && !token ? (
            <div className="recovery-notice">
              <p>
                Liên kết thiếu mã khôi phục. Hãy mở liên kết trong email hoặc
                yêu cầu liên kết mới.
              </p>
            </div>
          ) : (
            !done &&
            !expired && (
              <form onSubmit={submit}>
                <fieldset disabled={busy || !passwordRecoveryEnabled}>
                  <legend className="sr-only">Khôi phục tài khoản</legend>
                  {reset ? (
                    <>
                      <label htmlFor="new-password">Mật khẩu mới</label>
                      <div className="login-password">
                        <input
                          id="new-password"
                          name="newPassword"
                          type={visible ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          aria-describedby="recovery-password-hint"
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
                      <label htmlFor="confirm-password">
                        Nhập lại mật khẩu mới
                      </label>
                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type={visible ? "text" : "password"}
                        autoComplete="new-password"
                        required
                      />
                    </>
                  ) : (
                    <>
                      <label htmlFor="recovery-email">Email tài khoản</label>
                      <input
                        id="recovery-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        maxLength={254}
                        required
                      />
                    </>
                  )}
                  <button
                    className="login-submit"
                    disabled={busy || !passwordRecoveryEnabled}
                  >
                    {busy
                      ? "Đang xử lý…"
                      : reset
                        ? "Lưu mật khẩu mới"
                        : "Gửi liên kết khôi phục"}
                  </button>
                </fieldset>
              </form>
            )
          )}
          <p className="auth-switch">
            {reset && (!token || expired) ? (
              <Link href="/forgot-password">Yêu cầu liên kết mới</Link>
            ) : (
              <Link href="/login">Quay lại đăng nhập</Link>
            )}
          </p>
        </div>
      </section>
    </main>
  );
}
