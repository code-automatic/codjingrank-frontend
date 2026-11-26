"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/session";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { useApiClient } from "@/lib/api/useApiClient";
import { errorText } from "@/lib/api";
import { UserAvatar, avatarSource } from "@/lib/ui/UserAvatar";

export function ProfilePage() {
  const { status, user } = useSession();
  const router = useRouter();
  const api = useApiClient();
  const [avatarDraft, setAvatarDraft] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const notice = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [router, status]);
  if (status !== "authenticated" || !user)
    return (
      <main className="platform-route-main">
        <SessionNotice />
      </main>
    );
  return (
    <main className="platform-route-main">
      <h1>Hồ sơ của bạn</h1>
      <p className="muted">Một chút về người đứng sau những lời giải.</p>
      <div className="platform-profile-layout">
        <aside className="platform-profile-card">
          <span className="platform-avatar">
            <UserAvatar
              name={user.fullName || user.username}
              avatarUrl={avatarDraft ?? user.avatarUrl}
            />
          </span>
          <h2>{user.fullName || user.username}</h2>
          <p>@{user.username}</p>
          <p>{user.bio || "Chưa có giới thiệu."}</p>
          <p>Tham gia {new Date(user.createdAt).toLocaleDateString("vi-VN")}</p>
        </aside>
        <form
          key={user.id}
          className="platform-profile-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            const data = new FormData(event.currentTarget);
            const avatarUrl = String(data.get("avatarUrl") || "").trim();
            if (avatarUrl && !avatarSource(avatarUrl)) {
              setError("Nhập đường dẫn ảnh HTTP hoặc HTTPS hợp lệ.");
              setMessage("");
              notice.current?.focus();
              return;
            }
            setBusy(true);
            setError("");
            setMessage("");
            try {
              await api.account.updateMe({
                fullName: String(data.get("fullName") || "").trim() || null,
                bio: String(data.get("bio") || "").trim() || null,
                avatarUrl: avatarUrl || null,
              });
              setMessage("Đã lưu hồ sơ của bạn.");
            } catch (error) {
              setError(errorText(error));
            } finally {
              setBusy(false);
              requestAnimationFrame(() => notice.current?.focus());
            }
          }}
        >
          <fieldset disabled={busy}>
            <div className="platform-profile-avatar-edit">
              <label htmlFor="profile-avatar">Ảnh đại diện</label>
              <input
                id="profile-avatar"
                name="avatarUrl"
                type="url"
                maxLength={2048}
                placeholder="https://example.com/anh-cua-ban.jpg"
                value={avatarDraft ?? user.avatarUrl ?? ""}
                onChange={(event) => setAvatarDraft(event.target.value)}
                aria-describedby="profile-avatar-help"
              />
              <small id="profile-avatar-help">
                Dán đường dẫn ảnh công khai để xem trước. Ảnh chỉ được cập nhật
                sau khi lưu. Chưa hỗ trợ tải file từ máy.
              </small>
              <button
                type="button"
                className="platform-profile-remove-avatar"
                disabled={busy || !(avatarDraft ?? user.avatarUrl)}
                onClick={() => setAvatarDraft("")}
              >
                Gỡ ảnh đại diện
              </button>
            </div>
            <label htmlFor="profile-email">Email</label>
            <input id="profile-email" value={user.email} readOnly />
            <small>Email được quản lý cùng tài khoản đăng nhập.</small>
            <label htmlFor="profile-username">Tên người dùng</label>
            <input id="profile-username" value={user.username} readOnly />
            <label htmlFor="profile-name">Họ tên</label>
            <input
              id="profile-name"
              name="fullName"
              defaultValue={user.fullName || ""}
              maxLength={120}
              autoComplete="name"
            />
            <label htmlFor="profile-bio">Giới thiệu</label>
            <textarea
              id="profile-bio"
              name="bio"
              defaultValue={user.bio || ""}
              maxLength={500}
            />
            <small>Tối đa 500 ký tự.</small>
            <button className="platform-primary" disabled={busy}>
              {busy ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
          </fieldset>
          <p
            ref={notice}
            tabIndex={-1}
            role={error ? "alert" : "status"}
            className={error ? "error" : "muted"}
          >
            {error || message}
          </p>
        </form>
      </div>
    </main>
  );
}
