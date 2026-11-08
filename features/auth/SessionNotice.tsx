"use client";
import { errorText } from "@/lib/api/client";
import { useSession } from "./session";
export function SessionNotice() {
  const { status, error, expired, loggingOut, store } = useSession();
  return (
    <>
      {status === "initializing" && !error && (
        <p role="status">Đang kiểm tra phiên…</p>
      )}
      {expired && (
        <p role="status">
          Phiên đã hết hạn hoặc chưa có phiên. Vui lòng đăng nhập.
        </p>
      )}
      {loggingOut && <p role="status">Đang kết thúc phiên trên máy chủ…</p>}
      {!!error && (
        <div role="alert">
          <p className="error">{errorText(error)}</p>
          <button
            type="button"
            disabled={loggingOut}
            onClick={() =>
              void (
                status === "anonymous" ? store.logout() : store.bootstrap()
              ).catch(() => {})
            }
          >
            {status === "anonymous"
              ? "Thử đăng xuất trên máy chủ lại"
              : "Thử kiểm tra phiên lại"}
          </button>
        </div>
      )}
    </>
  );
}
