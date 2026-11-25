"use client";
import { useSyncExternalStore } from "react";
import {
  applyTheme,
  getThemeSnapshot,
  getServerThemeSnapshot,
  subscribeToTheme,
} from "./theme";
import "./theme-toggle-447.css";
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
      className="u447 theme-toggle"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label={label}
      title={label}
      onClick={() =>
        applyTheme(getThemeSnapshot() === "dark" ? "light" : "dark", true)
      }
    >
      <span className="u447-canvas" aria-hidden="true">
        <span className="u447-b">
          <span className="u447-sky"></span>
          <span className="u447-ngt"></span>
          <svg className="u447-sr" viewBox="0 0 90 58" aria-hidden="true">
            <path d="M14 9Q14 14 19 14Q14 14 14 19Q14 14 9 14Q14 14 14 9Z" />
            <path d="M42 6Q42 10 46 10Q42 10 42 14Q42 10 38 10Q42 10 42 6Z" />
            <path d="M28 31Q28 35 32 35Q28 35 28 39Q28 35 24 35Q28 35 28 31Z" />
            <path d="M60 23Q60 26 63 26Q60 26 60 29Q60 26 57 26Q60 26 60 23Z" />
            <circle cx="7" cy="31" r="1.3" />
            <circle cx="50" cy="42" r="1.1" />
            <circle cx="68" cy="10" r="1.3" />
            <circle cx="36" cy="51" r="1" />
            <circle cx="76" cy="38" r="1" />
          </svg>
          <span className="u447-halo">
            <i></i>
            <i></i>
            <i></i>
          </span>
          <svg className="u447-cl" viewBox="0 0 136 68" aria-hidden="true">
            <g fill="#CFE7FF">
              <circle cx="34" cy="46" r="18" />
              <circle cx="58" cy="36" r="20" />
              <circle cx="86" cy="40" r="18" />
              <circle cx="110" cy="28" r="21" />
              <circle cx="132" cy="40" r="18" />
            </g>
            <g fill="#FFFFFF">
              <circle cx="22" cy="60" r="16" />
              <circle cx="46" cy="52" r="18" />
              <circle cx="74" cy="56" r="18" />
              <circle cx="98" cy="46" r="19" />
              <circle cx="124" cy="54" r="19" />
            </g>
          </svg>
          <span className="u447-th">
            <svg viewBox="0 0 62 62" aria-hidden="true">
              <circle cx="22" cy="24" r="6.5" />
              <circle cx="40" cy="38" r="8" />
              <circle cx="39" cy="18" r="3.6" />
            </svg>
          </span>
        </span>
      </span>
    </button>
  );
}
