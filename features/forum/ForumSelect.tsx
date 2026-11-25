"use client";
import { useEffect, useRef } from "react";
import { Icon } from "@/lib/ui/Icon";
import styles from "./forum.module.css";

export function ForumSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const root = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node))
        root.current.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <details
      ref={root}
      className={styles.filterSelect}
      onKeyDown={(event) => {
        const buttons = Array.from(
          root.current?.querySelectorAll<HTMLButtonElement>("[role=option]") ??
            [],
        );
        const index = buttons.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          if (root.current) root.current.open = true;
          const target =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? buttons.length - 1
                : event.key === "ArrowDown"
                  ? (index + 1) % buttons.length
                  : index < 0
                    ? buttons.length - 1
                    : (index - 1 + buttons.length) % buttons.length;
          buttons[target]?.focus();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          if (root.current) root.current.open = false;
          root.current?.querySelector("summary")?.focus();
        }
      }}
    >
      <summary aria-label={label}>
        {options.find((option) => option.value === value)?.label}
        <Icon name="collapse" size={15} />
      </summary>
      <div role="listbox" aria-label={label}>
        {options.map((option) => (
          <button
            type="button"
            role="option"
            aria-selected={value === option.value}
            key={option.value}
            onClick={() => {
              if (root.current) root.current.open = false;
              root.current?.querySelector("summary")?.focus();
              onChange(option.value);
            }}
          >
            {option.label}
            {value === option.value && <Icon name="check" size={14} />}
          </button>
        ))}
      </div>
    </details>
  );
}
