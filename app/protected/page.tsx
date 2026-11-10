"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/session";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { errorText } from "@/lib/api/client";
import { useApiClient } from "@/lib/api/useApiClient";
export default function Protected() {
  const router = useRouter();
  const { status, user, store } = useSession();
  const api = useApiClient();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);
  async function me() {
    setBusy(true);
    setError("");
    try {
      await api.account.getMe();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main>
      <section className="card">
        <SessionNotice />
        {status === "authenticated" && user && (
          <>
            <p className="muted">TÀI KHOẢN CỦA BẠN</p>
            <h1>Xin chào, {user.fullName || user.username}</h1>
            <p>{user.email}</p>
            <p className="muted">
              Bạn đã đăng nhập. Trang này chỉ hiển thị khi phiên sẵn sàng.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="actions">
              <button disabled={busy} onClick={() => void me()}>
                {busy ? "Đang tải…" : "Tải lại thông tin tài khoản"}
              </button>
              <button onClick={() => void store.logout().catch(() => {})}>
                Đăng xuất
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
