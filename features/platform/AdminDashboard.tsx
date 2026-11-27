"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/session";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { useApiClient } from "@/lib/api/useApiClient";
import { errorText } from "@/lib/api";
import type { AdminItem } from "@/lib/api/domains/admin";
import { AdminResources } from "./AdminResources";
import { Icon } from "@/lib/ui/Icon";
import styles from "./admin.module.css";

export function AdminDashboard({
  section = "overview",
}: {
  section?: "overview" | "content" | "operations";
}) {
  const { status, user } = useSession();
  const router = useRouter();
  const api = useApiClient();
  const [data, setData] = useState<{
    problems: AdminItem[];
    totals: number[];
  }>();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string>();
  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
    else if (status === "authenticated" && user?.role !== "admin")
      router.replace("/protected");
  }, [status, user?.role, router]);
  useEffect(() => {
    if (status !== "authenticated" || user?.role !== "admin") return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const options = { signal: controller.signal };
    Promise.all([
      api.admin.list("problems", { page: 1, size: 5 }, options),
      api.admin.list("packages", { page: 1, size: 1 }, options),
      api.admin.list("languages", { page: 1, size: 1 }, options),
    ])
      .then(([problems, packages, posts]) => {
        if (!controller.signal.aborted) {
          setData({
            problems: problems.items,
            totals: [problems.total, packages.total, posts.total],
          });
          setUpdatedAt(
            new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(errorText(reason));
      })
      .finally(() => clearTimeout(timeout));
    controller.signal.addEventListener(
      "abort",
      () =>
        setError("Yêu cầu đã dừng hoặc quá thời gian chờ. Vui lòng tải lại."),
      { once: true },
    );
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [api, status, user?.role, retry]);
  if (status !== "authenticated")
    return (
      <main className="platform-route-main">
        <SessionNotice />
      </main>
    );
  if (user?.role !== "admin")
    return (
      <main className="platform-route-main">
        <h1>Không có quyền truy cập</h1>
        <Link href="/protected">Về tổng quan</Link>
      </main>
    );
  if (section !== "overview")
    return (
      <main className={`platform-route-main ${styles.dashboard}`}>
        <header className={styles.heading}>
          <div>
            <h1>
              {section === "content"
                ? "Quản lý nội dung"
                : "Ngôn ngữ & phân loại"}
            </h1>
            <p>Dữ liệu từ API admin, bao gồm nội dung chưa xuất bản.</p>
          </div>
          <Link href="/admin">Về tổng quan</Link>
        </header>
        <AdminResources operations={section === "operations"} />
      </main>
    );
  return (
    <main
      className={`platform-route-main ${styles.dashboard}`}
      data-admin-section={section}
    >
      <header className={styles.heading}>
        <div>
          <span className={styles.role}>
            <Icon name="shield" /> Không gian quản trị
          </span>
          <h1>Tổng quan vận hành</h1>
          <p>Quản lý nội dung luyện tập, lộ trình và cộng đồng CodjingRank.</p>
        </div>
        <button
          className="platform-primary"
          disabled={!data && !error}
          onClick={() => {
            setError("");
            setData(undefined);
            setRetry((value) => value + 1);
          }}
        >
          <Icon name="reset" /> Tải lại
        </button>
      </header>
      <div className={styles.context}>
        <span>
          <Icon name="user" /> {user.fullName || user.username}
        </span>
        <span>
          {updatedAt ? `Cập nhật lúc ${updatedAt}` : "Chưa có bản cập nhật"}
        </span>
        <span>Quyền: Admin</span>
      </div>
      <p className={styles.notice}>
        Số liệu danh mục từ API admin, bao gồm bản nháp và nội dung lưu trữ.
        Chưa có số liệu tài khoản và hàng đợi chấm.
        {process.env.NEXT_PUBLIC_MOCK_MODE === "true"
          ? " Môi trường dữ liệu demo."
          : ""}
      </p>
      {error && (
        <div role="alert" className={styles.notice}>
          {error}
        </div>
      )}
      <section
        className={styles.metrics}
        aria-label="Tổng quan nội dung"
        aria-busy={!data && !error}
      >
        {(
          [
            ["Bài tập", "code", "/admin/content"],
            ["Gói lộ trình", "book", "/admin/content"],
            ["Ngôn ngữ", "code", "/admin/operations"],
          ] as const
        ).map(([label, icon, href], index) => (
          <Link href={href} key={href} className={styles.panel}>
            <Icon name={icon} size={24} />
            <span>{label}</span>
            <strong>
              {data
                ? data.totals[index].toLocaleString("vi-VN")
                : error
                  ? "—"
                  : "Đang tải…"}
            </strong>
            <span className={styles.link}>
              Xem nội dung <Icon name="arrowUpRight" />
            </span>
          </Link>
        ))}
      </section>
      <div className={styles.columns}>
        <section id="catalog" className={styles.panel}>
          <div className={styles.sectionHeading}>
            <h2>Danh mục bài tập</h2>
            <Link href="/admin/content">Xem tất cả</Link>
          </div>
          <p className="muted">
            Xem nhanh tối đa 5 bài từ API kho bài. Mở kho bài để tìm trên toàn
            bộ danh mục.
          </p>
          <label className={styles.filter}>
            <Icon name="search" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Lọc danh sách đang hiển thị…"
              aria-label="Lọc các bài tập đang hiển thị"
            />
          </label>
          {!data && !error && <p role="status">Đang tải danh sách…</p>}
          {data?.problems.length === 0 && <p>Chưa có bài tập để hiển thị.</p>}
          <ul className={styles.list}>
            {data?.problems
              .filter((problem) =>
                problem.name
                  .toLocaleLowerCase("vi-VN")
                  .includes(query.toLocaleLowerCase("vi-VN")),
              )
              .map((problem) => (
                <li key={problem.slug}>
                  <Link href="/admin/content">
                    <Icon name="code" />
                    <span>
                      {problem.name}
                      <small className={styles.slug}>{problem.slug}</small>
                    </span>
                    <small className={styles.difficulty}>
                      {problem.status}
                    </small>
                    <Icon name="chevronRight" />
                  </Link>
                </li>
              ))}
          </ul>
          {data &&
            query &&
            !data.problems.some((problem) =>
              problem.name
                .toLocaleLowerCase("vi-VN")
                .includes(query.toLocaleLowerCase("vi-VN")),
            ) && <p role="status">Không có bài phù hợp trong danh sách này.</p>}
        </section>
        <section id="operations" className={styles.panel}>
          <h2>Phạm vi quản trị</h2>
          <p className="muted">
            Các mục dưới đây cần API quản trị trước khi có thể thao tác.
          </p>
          {[
            "Quản lý tài khoản và phân quyền",
            "Kiểm duyệt bài viết cộng đồng",
            "Thống kê và nhật ký toàn hệ thống",
          ].map((label) => (
            <div key={label} className={styles.pending}>
              <span>{label}</span>
              <small>Chưa kết nối</small>
            </div>
          ))}
          <p className={styles.boundary}>
            <Icon name="lock" /> Chỉ mở thao tác thay đổi dữ liệu khi đã kết nối
            API và kiểm tra quyền máy chủ.
          </p>
          <Link href="/protected">
            Mở giao diện luyện tập <Icon name="arrowUpRight" />
          </Link>
        </section>
      </div>
    </main>
  );
}
