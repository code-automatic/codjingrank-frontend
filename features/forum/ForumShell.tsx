import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/lib/ui/BrandLogo";
import { ThemeToggle } from "@/lib/ui/ThemeToggle";
import styles from "./forum.module.css";

export function ForumShell({
  children,
  current = "forum",
}: {
  children: ReactNode;
  current?: "forum" | "new" | "post";
}) {
  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <Link href="/protected" aria-label="Codjingrank — tài khoản">
          <BrandLogo compact />
        </Link>
        <nav aria-label="Điều hướng chính">
          <Link href="/packages">Gói bài</Link>
          <Link href="/problems">Kho bài</Link>
          <Link
            href="/forum"
            aria-current={current !== "new" ? "page" : undefined}
          >
            Cộng đồng
          </Link>
          <Link href="/leaderboard">Ranking</Link>
        </nav>
        <ThemeToggle />
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
