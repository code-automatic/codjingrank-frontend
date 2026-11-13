import Image from "next/image";
import styles from "./BrandLogo.module.css";

/** Symbol and original lettering are separate alpha assets, with no whole-logo filter. */
export function BrandLogo({
  compact = false,
  tone = "auto",
}: {
  compact?: boolean;
  tone?: "auto" | "on-dark";
}) {
  return (
    <span
      className={`${styles.brand} ${compact ? styles.compact : ""} ${tone === "on-dark" ? styles.onDark : ""}`}
      role={compact ? undefined : "img"}
      aria-label={compact ? undefined : "Codjingrank"}
      aria-hidden={compact ? true : undefined}
    >
      <Image
        src="/brand/codjingrank-mark.png"
        alt=""
        width={192}
        height={192}
        className={styles.mark}
        unoptimized
      />
      {!compact && <span className={styles.wordmark} aria-hidden="true" />}
    </span>
  );
}
