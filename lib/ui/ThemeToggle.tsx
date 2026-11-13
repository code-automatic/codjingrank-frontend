"use client";
import { useSyncExternalStore } from "react";
import { Icon } from "./Icon";
import {
  applyTheme,
  getThemeSnapshot,
  getServerThemeSnapshot,
  subscribeToTheme,
} from "./theme";
import styles from "./ThemeToggle.module.css";
export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const label =
    theme === "dark"
      ? "Chuyển sang giao diện sáng"
      : "Chuyển sang giao diện tối";
  return (
    <button
      type="button"
      className={`${styles.toggle} theme-toggle`}
      aria-label={label}
      title={label}
      aria-pressed={theme === "dark"}
      onClick={() =>
        applyTheme(getThemeSnapshot() === "dark" ? "light" : "dark", true)
      }
    >
      <span className={styles.sun}>
        <Icon name="sun" size={18} />
      </span>
      <span className={styles.moon}>
        <Icon name="moon" size={18} />
      </span>
    </button>
  );
}
