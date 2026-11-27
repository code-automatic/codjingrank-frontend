"use client";
import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/api/useApiClient";
import { errorText } from "@/lib/api";
import {
  type ManagementKind,
  type ManagementPage,
  type ManagementRow,
} from "@/lib/api/domains/admin-management";
import { RoundedSelect } from "@/lib/ui/RoundedSelect";
import styles from "./admin.module.css";

export function AdminManagement({
  kind,
  userId,
}: {
  kind: ManagementKind;
  userId: string;
}) {
  const api = useApiClient();
  const [page, setPage] = useState(1),
    [revision, setRevision] = useState(0);
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("");
  const [data, setData] = useState<ManagementPage>();
  const [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState("");
  const [selected, setSelected] = useState<ManagementRow>();
  const [role, setRole] = useState("student"),
    [enabled, setEnabled] = useState(true),
    [status, setStatus] = useState("hidden");
  const [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false);
  const key = `${kind}:${page}:${filter}:${revision}`;
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    api.admin
      .management(
        kind,
        {
          page,
          size: 10,
          ...(kind === "audit"
            ? { actorEmail: filter || undefined }
            : { q: filter || undefined }),
        },
        { signal: controller.signal },
      )
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
          setLoaded(key);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(
            controller.signal.aborted
              ? "Tải dữ liệu quá thời gian chờ."
              : errorText(reason),
          );
          setLoaded(key);
        }
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [api, kind, page, filter, revision, key]);
  const loading = loaded !== key;
  return (
    <section className={styles.panel}>
      <form
        className={styles.resourceFilters}
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilter(query.trim());
          setRevision((value) => value + 1);
        }}
      >
        <input
          type={kind === "audit" ? "email" : "search"}
          aria-label={kind === "audit" ? "Email người thực hiện" : "Tìm kiếm"}
          placeholder={
            kind === "audit" ? "Lọc email người thực hiện…" : "Tìm kiếm…"
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button>Tìm</button>
        <button
          type="button"
          onClick={() => {
            setPage(1);
            setQuery("");
            setFilter("");
            setRevision((value) => value + 1);
          }}
        >
          Xóa lọc
        </button>
      </form>
      {loading && <p role="status">Đang tải dữ liệu…</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {!loading && !error && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.resourceTable}>
              <thead>
                <tr>
                  <th>
                    {kind === "users"
                      ? "Tài khoản"
                      : kind === "community"
                        ? "Bài viết"
                        : "Hành động"}
                  </th>
                  <th>
                    {kind === "users" ? "Vai trò / Trạng thái" : "Trạng thái"}
                  </th>
                  <th>Thời gian</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.title}</strong>
                      <small className={styles.slug}>{row.description}</small>
                    </td>
                    <td>
                      {row.role && <span>{row.role} · </span>}
                      {row.status}
                    </td>
                    <td>{new Date(row.createdAt).toLocaleString("vi-VN")}</td>
                    <td>
                      <button
                        disabled={busy}
                        onClick={() => {
                          setSelected(row);
                          setRole(row.role || "student");
                          setEnabled(row.isActive ?? true);
                          setStatus(
                            row.status === "hidden" ? "published" : "hidden",
                          );
                          setConfirm(false);
                          setMessage("");
                        }}
                      >
                        Mở
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data?.items.length && <p>Không tìm thấy dữ liệu phù hợp.</p>}
          <div className={styles.resourceFilters}>
            <span>
              {data?.total ?? 0} mục · Trang {page}
            </span>
            <button
              disabled={busy || page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Trước
            </button>
            <button
              disabled={busy || !data || page * data.size >= data.total}
              onClick={() => setPage((value) => value + 1)}
            >
              Sau
            </button>
          </div>
        </>
      )}
      <button
        disabled={busy || loading}
        onClick={() => setRevision((value) => value + 1)}
      >
        Tải lại
      </button>
      {selected && (
        <section className={styles.editor} aria-label="Chi tiết quản trị">
          <div className={styles.sectionHeading}>
            <h2>{selected.title}</h2>
            <button disabled={busy} onClick={() => setSelected(undefined)}>
              Đóng
            </button>
          </div>
          <p className="muted">{selected.id}</p>
          {selected.content && (
            <p className={styles.readContent}>{selected.content}</p>
          )}
          {kind !== "audit" && (
            <form
              className={styles.createForm}
              onSubmit={async (event) => {
                event.preventDefault();
                if (!confirm) {
                  setConfirm(true);
                  return;
                }
                if (busy) return;
                setBusy(true);
                setError("");
                try {
                  if (kind === "users")
                    await api.admin.updateUser(selected.id, {
                      role,
                      isActive: enabled,
                    });
                  else await api.admin.moderate(selected.id, status);
                  setSelected(undefined);
                  setMessage("Đã cập nhật thành công.");
                  setRevision((value) => value + 1);
                } catch (reason) {
                  setError(errorText(reason));
                } finally {
                  setBusy(false);
                  setConfirm(false);
                }
              }}
            >
              {kind === "users" ? (
                <>
                  <label>
                    Vai trò
                    <RoundedSelect label="Lựa chọn"
                      aria-label="Vai trò"
                      value={role}
                      disabled={busy || selected.id === userId}
                      onChange={(event) => {
                        setRole(event.target.value);
                        setConfirm(false);
                      }}
                    >
                      <option value="student">Học viên</option>
                      <option value="teacher">Giảng viên</option>
                      <option value="admin">Quản trị viên</option>
                    </RoundedSelect>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={busy || selected.id === userId}
                      onChange={(event) => {
                        setEnabled(event.target.checked);
                        setConfirm(false);
                      }}
                    />{" "}
                    Tài khoản hoạt động
                  </label>
                  {selected.id === userId && (
                    <p>
                      Không thay đổi quyền hoặc khóa chính tài khoản đang đăng
                      nhập tại đây.
                    </p>
                  )}
                </>
              ) : (
                <label>
                  Trạng thái bài viết
                  <RoundedSelect label="Lựa chọn"
                    value={status}
                    aria-label="Trạng thái bài viết"
                    disabled={busy}
                    onChange={(event) => {
                      setStatus(event.target.value);
                      setConfirm(false);
                    }}
                  >
                    <option value="published">Hiển thị</option>
                    <option value="hidden">Ẩn</option>
                    <option value="deleted">Đã xóa</option>
                  </RoundedSelect>
                </label>
              )}
              {confirm && (
                <p role="status">
                  Xác nhận thay đổi{" "}
                  {kind === "users"
                    ? `${role}, ${enabled ? "hoạt động" : "khóa"}`
                    : status}{" "}
                  trên máy chủ cho “{selected.title}”?
                </p>
              )}
              <button
                disabled={busy || (kind === "users" && selected.id === userId)}
              >
                {busy ? "Đang lưu…" : confirm ? "Xác nhận lưu" : "Lưu thay đổi"}
              </button>
              {confirm && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirm(false)}
                >
                  Hủy xác nhận
                </button>
              )}
            </form>
          )}
        </section>
      )}
    </section>
  );
}
