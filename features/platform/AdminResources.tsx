"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useApiClient } from "@/lib/api/useApiClient";
import { ApiError, errorText } from "@/lib/api";
import type {
  AdminItem,
  AdminPage,
  AdminResource,
} from "@/lib/api/domains/admin";
import styles from "./admin.module.css";

const labels = {
  problems: "Bài tập",
  packages: "Gói bài",
  languages: "Ngôn ngữ",
  tags: "Tag",
};
export function AdminResources({
  operations = false,
}: {
  operations?: boolean;
}) {
  const api = useApiClient();
  const [resource, setResource] = useState<AdminResource>(
    operations ? "languages" : "problems",
  );
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState<AdminPage>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [confirm, setConfirm] = useState<AdminItem>();
  const key = `${resource}:${page}:${filter}:${status}:${revision}`;
  const [loaded, setLoaded] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        setError("Tải dữ liệu quá thời gian chờ.");
        setLoaded(key);
      }
      controller.abort();
    }, 15000);
    api.admin
      .list(
        resource,
        { page, size: 10, ...(!operations ? { q: filter, status } : {}) },
        { signal: controller.signal },
      )
      .then((value) => {
        if (active) {
          setData(value);
          setError("");
          setLoaded(key);
        }
      })
      .catch((reason) => {
        if (active && !controller.signal.aborted) {
          setError(
            reason instanceof ApiError && reason.status === 404
              ? "Endpoint admin chưa có trên máy chủ đang kết nối. Không sử dụng dữ liệu giả thay thế."
              : errorText(reason),
          );
          setLoaded(key);
        }
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [api, resource, page, filter, status, revision, key, operations]);
  const loading = loaded !== key;
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const payload = {
      name: String(fields.get("name")).trim(),
      slug: String(fields.get("slug")).trim(),
    };
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (resource === "packages")
        await api.admin.createPackage({
          ...payload,
          description: String(fields.get("description") || "").trim() || null,
          displayOrder: 0,
        });
      else await api.admin.createTag(payload);
      form.reset();
      setMessage("Đã tạo thành công.");
      setRevision((value) => value + 1);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.panel}>
      <div className={styles.resourceTabs} aria-label="Nhóm nội dung">
        {(operations
          ? (["languages", "tags"] as const)
          : (["problems", "packages"] as const)
        ).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={resource === value}
            disabled={busy}
            onClick={() => {
              setResource(value);
              setPage(1);
              setConfirm(undefined);
              setMessage("");
            }}
          >
            {labels[value]}
          </button>
        ))}
      </div>
      {!operations && (
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
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tên hoặc slug…"
            aria-label="Tìm tên hoặc slug"
          />
          <select
            aria-label="Trạng thái"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="published">Đã xuất bản</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
          <button type="submit">Tìm</button>
        </form>
      )}
      {error && !loading && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {loading ? (
        <p role="status">Đang tải {labels[resource].toLowerCase()}…</p>
      ) : (
        !error && (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.resourceTable}>
                <thead>
                  <tr>
                    <th>Tên / Slug</th>
                    <th>Trạng thái</th>
                    {!operations && <th>Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        <small className={styles.slug}>{item.slug}</small>
                      </td>
                      <td>
                        {item.status === "draft"
                          ? "Bản nháp"
                          : item.status === "published"
                            ? "Đã xuất bản"
                            : item.status === "archived"
                              ? "Đã lưu trữ"
                              : item.isActive === false
                                ? "Đã tắt"
                                : item.isActive === true
                                  ? "Đang bật"
                                  : "—"}
                      </td>
                      {!operations && (
                        <td>
                          {item.status !== "archived" && (
                            <button
                              disabled={busy}
                              onClick={() => setConfirm(item)}
                            >
                              {item.status === "published"
                                ? "Lưu trữ"
                                : "Xuất bản"}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data?.items.length && <p>Không có dữ liệu phù hợp.</p>}
            <div className={styles.resourceFilters}>
              <span>
                {data?.total ?? 0} mục · Trang {page}
              </span>
              <button
                disabled={page <= 1 || busy}
                onClick={() => setPage((value) => value - 1)}
              >
                Trước
              </button>
              <button
                disabled={!data || page * data.size >= data.total || busy}
                onClick={() => setPage((value) => value + 1)}
              >
                Sau
              </button>
            </div>
          </>
        )
      )}
      <button
        disabled={busy || loading}
        onClick={() => setRevision((value) => value + 1)}
      >
        Tải lại dữ liệu
      </button>
      {confirm && (
        <div
          className={styles.notice}
          role="group"
          aria-label="Xác nhận thay đổi trạng thái"
        >
          <p>
            {confirm.status === "published" ? "Lưu trữ" : "Xuất bản"} “
            {confirm.name}”? Thay đổi sẽ được lưu trên máy chủ.
          </p>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await api.admin.transition(
                  resource as "problems" | "packages",
                  confirm.id,
                  confirm.status === "published" ? "archive" : "publish",
                );
                setMessage("Đã cập nhật trạng thái.");
                setConfirm(undefined);
                setRevision((value) => value + 1);
              } catch (reason) {
                setError(errorText(reason));
              } finally {
                setBusy(false);
              }
            }}
          >
            Xác nhận
          </button>
          <button disabled={busy} onClick={() => setConfirm(undefined)}>
            Hủy
          </button>
        </div>
      )}
      {(resource === "packages" || resource === "tags") && (
        <details>
          <summary>Tạo {labels[resource].toLowerCase()}</summary>
          <form onSubmit={create} className={styles.createForm}>
            <label>
              Tên
              <input
                name="name"
                required
                maxLength={resource === "packages" ? 120 : 80}
              />
            </label>
            <label>
              Slug
              <input
                name="slug"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="vi-du-slug"
              />
            </label>
            {resource === "packages" && (
              <label>
                Mô tả
                <textarea name="description" maxLength={10000} />
              </label>
            )}
            <button disabled={busy}>{busy ? "Đang lưu…" : "Tạo mới"}</button>
          </form>
        </details>
      )}
    </section>
  );
}
