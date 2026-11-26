"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/session";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { useApiClient } from "@/lib/api/useApiClient";
import { errorText } from "@/lib/api";
import { UserAvatar } from "@/lib/ui/UserAvatar";

export function ProfilePage() {
  const { status, user } = useSession();
  const router = useRouter();
  const api = useApiClient();
  const [avatarDraft, setAvatarDraft] = useState<string>();
  const [photoPreview, setPhotoPreview] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);
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
            {photoPreview ? <Image unoptimized src={photoPreview} alt="Ảnh đại diện đang xem trước" width={96} height={96} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : <UserAvatar
              name={user.fullName || user.username}
              avatarUrl={avatarDraft ?? user.avatarUrl}
            />}
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
            if (photoPreview) {
              setError("Chưa thể tải ảnh lên: backend chưa cung cấp API upload ảnh đại diện. Bỏ ảnh đã chọn để lưu các thông tin khác.");
              return;
            }
            const avatarUrl = avatarDraft ?? user.avatarUrl;
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
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-describedby="profile-avatar-help"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setError("");
                  setMessage("");
                  if (!file) return;
                  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
                    setError("Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB.");
                    event.target.value = "";
                    return;
                  }
                  setPhotoPreview(URL.createObjectURL(file));
                }}
              />
              <small id="profile-avatar-help">
                JPG, PNG hoặc WebP, tối đa 5 MB. Có thể xem trước; tải ảnh lên tài khoản đang chờ backend hỗ trợ.
              </small>
              <button
                type="button"
                className="platform-profile-remove-avatar"
                disabled={busy || !(photoPreview || avatarDraft || user.avatarUrl)}
                onClick={() => { setPhotoPreview(undefined); setAvatarDraft(""); if (fileInput.current) fileInput.current.value = ""; setError(""); }}
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
