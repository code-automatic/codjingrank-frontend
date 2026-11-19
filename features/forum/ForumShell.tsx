import type { ReactNode } from "react";
import styles from "./forum.module.css";

export function ForumShell({
  children,
}: {
  children: ReactNode;
  current?: "forum" | "new" | "post";
}) {
  return (
    <div className={styles.page}>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
