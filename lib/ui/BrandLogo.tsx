import styles from "./BrandLogo.module.css";

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
      <span className={styles.mark} data-brand-mark aria-hidden="true" />
      {!compact && (
        <span
          className={styles.wordmark}
          data-brand-wordmark
          aria-hidden="true"
        />
      )}
    </span>
  );
}
