"use client";

import { useEffect, useRef, useState } from "react";
import "./lucian-controls.css";

export function CopyButton({
  value,
  label = "Sao chép mã lượt nộp",
}: {
  value: string;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "busy" | "copied" | "error">(
    "idle",
  );
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const epoch = useRef(0);
  useEffect(
    () => () => {
      epoch.current++;
      clearTimeout(timer.current);
    },
    [],
  );
  const message =
    state === "copied"
      ? "Đã sao chép"
      : state === "busy"
        ? "Đang sao chép…"
        : state === "error"
          ? "Không sao chép được. Bạn có thể chọn mã và sao chép thủ công."
          : "";
  return (
    <span
      className={`ux u008 copy-control ${state === "copied" ? "is-copied" : ""}`}
    >
      <button
        className="u008-btn"
        type="button"
        aria-label={label}
        title={label}
        disabled={state === "busy"}
        aria-busy={state === "busy"}
        onClick={async () => {
          const run = ++epoch.current;
          clearTimeout(timer.current);
          setState("busy");
          try {
            await navigator.clipboard.writeText(value);
            if (run !== epoch.current) return;
            setState("copied");
            timer.current = setTimeout(() => setState("idle"), 1800);
          } catch {
            if (run === epoch.current) setState("error");
          }
        }}
      >
        <svg className="u008-cp" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
          <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
        </svg>
        <svg className="u008-ok" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5.5 12.5l4.2 4.2L18.5 8" />
        </svg>
      </button>
      <span className="u008-tip" aria-hidden="true">
        Đã sao chép
      </span>
      <span
        className={state === "error" ? "u008-error" : "sr-only"}
        role="status"
      >
        {message}
      </span>
    </span>
  );
}
