"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/features/auth/session";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { AdminResources } from "./AdminResources";
import { AdminOverview } from "./AdminOverview";
import { AdminManagement } from "./AdminManagement";
import { Icon } from "@/lib/ui/Icon";
import styles from "./admin.module.css";

const titles = {
  overview: "Tổng quan hệ thống",
  content: "Nội dung luyện tập",
  operations: "Ngôn ngữ & phân loại",
  users: "Quản lý tài khoản",
  community: "Kiểm duyệt cộng đồng",
  audit: "Nhật ký quản trị",
};
export function AdminDashboard({
  section = "overview",
}: {
  section?: keyof typeof titles;
}) {
  const { status, user } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
    else if (status === "authenticated" && user?.role !== "admin")
      router.replace("/protected");
  }, [status, user?.role, router]);
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
  return (
    <main className={`platform-route-main ${styles.dashboard}`}>
      <header className={styles.heading}>
        <div>
          <span className={styles.role}>
            <Icon name="shield" /> CodjingRank Admin
          </span>
          <h1>{titles[section]}</h1>
          <p>
            Xin chào {user.fullName || user.username}. Quản trị nội dung và hoạt
            động của nền tảng.
          </p>
        </div>
        <Link href="/protected">Mở giao diện học viên ↗</Link>
      </header>
      {section === "overview" ? (
        <AdminOverview />
      ) : section === "content" || section === "operations" ? (
        <AdminResources key={section} operations={section === "operations"} />
      ) : (
        <AdminManagement
          key={`${section}:${user.id}`}
          kind={section}
          userId={user.id}
        />
      )}
    </main>
  );
}
