"use client";

import { useEffect, useRef } from "react";
import { Icon, type IconName } from "./Icon";
import "./lucian-controls.css";

type Segment = {
  value: string;
  label: string;
  icon?: IconName;
  id?: string;
  controls?: string;
};

export function SegmentedControl({
  options,
  value,
  onChange,
  label,
  className = "",
  kind = "tabs",
}: {
  options: Segment[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  kind?: "tabs" | "toggle";
}) {
  const root = useRef<HTMLDivElement>(null);
  const pointer = useRef(false);
  const signature = options.map((option) => option.value).join("|");
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const track = element.querySelector<HTMLElement>(".u416-tl");
    const thumb = element.querySelector<HTMLElement>(".u416-th");
    if (!track || !thumb) return;
    const selected = Array.from(
      track.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.dataset.value === value);
    if (!selected) return;
    const update = () => {
      const left = selected.offsetLeft;
      const previous = parseFloat(thumb.style.left || "4");
      const right = track.clientWidth - left - selected.offsetWidth;
      if (
        element.dataset.measured === "true" &&
        thumb.style.left === `${left}px` &&
        thumb.style.right === `${right}px`
      )
        return;
      element.dataset.motion = String(
        pointer.current &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
      thumb.style.setProperty("--tl", left > previous ? ".24s" : ".16s");
      thumb.style.setProperty("--tr", left > previous ? ".16s" : ".24s");
      thumb.style.left = `${left}px`;
      thumb.style.right = `${track.clientWidth - left - selected.offsetWidth}px`;
      element.dataset.measured = "true";
      pointer.current = false;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => observer.disconnect();
  }, [value, signature]);
  return (
    <div ref={root} className={`ux u416 ${className}`} data-ui-segmented>
      <div
        className="u416-tl"
        role={kind === "tabs" ? "tablist" : "group"}
        aria-label={label}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const index = options.findIndex((option) => option.value === value);
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? options.length - 1
                : (index +
                    (event.key === "ArrowLeft" ? -1 : 1) +
                    options.length) %
                  options.length;
          pointer.current = false;
          if (root.current) root.current.dataset.motion = "false";
          onChange(options[next].value);
          event.currentTarget
            .querySelectorAll<HTMLButtonElement>("button")
            [next]?.focus({ preventScroll: true });
        }}
      >
        <span className="u416-th" aria-hidden="true" />
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="u416-tab"
            data-value={option.value}
            id={option.id}
            role={kind === "tabs" ? "tab" : undefined}
            aria-selected={kind === "tabs" ? value === option.value : undefined}
            aria-pressed={
              kind === "toggle" ? value === option.value : undefined
            }
            aria-controls={option.controls}
            tabIndex={kind === "tabs" && value !== option.value ? -1 : 0}
            onClick={(event) => {
              pointer.current = event.detail > 0 && option.value !== value;
              onChange(option.value);
            }}
          >
            {option.icon && <Icon name={option.icon} size={16} />}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
