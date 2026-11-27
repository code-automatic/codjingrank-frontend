"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/api/useApiClient";
import { errorText } from "@/lib/api";
import { statsLabels } from "@/lib/api/domains/admin-management";
import styles from "./admin.module.css";

export function AdminOverview() {
  const api = useApiClient();
  const [data, setData] = useState<Record<keyof typeof statsLabels, number>>();
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    api.admin
      .stats({ signal: controller.signal })
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((reason) => {
        if (active)
          setError(
            controller.signal.aborted
              ? "Tải thống kê quá thời gian chờ."
              : errorText(reason),
          );
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [api, revision]);
  return (
    <>
      <div className={styles.sectionHeading}>
        <p className="muted">Thống kê toàn hệ thống từ API quản trị.</p>
        <button onClick={() => setRevision((value) => value + 1)}>
          Làm mới
        </button>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Đang tải thống kê…</p>}
      <section className={styles.statsGrid} aria-label="Thống kê hệ thống">
        {Object.entries(statsLabels).map(([key, label]) => (
          <div className={styles.panel} key={key}>
            <span>{label}</span>
            <strong className={styles.statValue}>
              {data
                ? data[key as keyof typeof statsLabels].toLocaleString("vi-VN")
                : "—"}
            </strong>
          </div>
        ))}
      </section>
      <section className={`${styles.panel} ${styles.shortcuts}`}>
        <h2>Không gian làm việc</h2>
        <nav aria-label="Lối tắt quản trị">
          <Link href="/admin/users">Quản lý tài khoản →</Link>
          <Link href="/admin/content">Bài tập & gói bài →</Link>
          <Link href="/admin/community">Kiểm duyệt cộng đồng →</Link>
          <Link href="/admin/audit">Nhật ký thao tác →</Link>
        </nav>
      </section>
      <p className={styles.boundary}>
        Danh sách bài nộp toàn hệ thống và lịch thử thách chưa được triển khai
        theo contract hiện tại.
      </p>
    </>
  );
}
