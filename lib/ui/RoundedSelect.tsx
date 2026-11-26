"use client";
import {
  Children,
  isValidElement,
  useId,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Icon } from "./Icon";

type Option = { value: string; label: string; disabled: boolean };
function text(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? text(child.props.children)
        : String(child),
    )
    .join("");
}
function choices(node: ReactNode): Option[] {
  return Children.toArray(node).flatMap((child) => {
    if (
      !isValidElement<{
        value?: string | number;
        children?: ReactNode;
        disabled?: boolean;
      }>(child)
    )
      return [];
    return child.type === "option"
      ? [
          {
            value: String(child.props.value ?? text(child.props.children)),
            label: text(child.props.children),
            disabled: Boolean(child.props.disabled),
          },
        ]
      : choices(child.props.children);
  });
}
export function RoundedSelect({
  label,
  children,
  id,
  className,
  value,
  disabled,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const uid = useId();
  const panelId = `choice-${uid}`;
  const native = useRef<HTMLSelectElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 160,
    maxHeight: 260,
  });
  useEffect(() => {
    const close = (event: Event) => {
      if (
        event.type === "scroll" &&
        panel.current?.contains(event.target as Node)
      )
        return;
      panel.current?.hidePopover();
    };
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, []);
  const options = choices(children);
  const selected = String(
    value ?? props.defaultValue ?? options[0]?.value ?? "",
  );
  function place() {
    const box = trigger.current?.getBoundingClientRect();
    if (!box) return;
    const width = Math.min(Math.max(box.width, 160), innerWidth - 16);
    const height = Math.min(260, options.length * 44 + 12);
    const below = innerHeight - box.bottom - 12;
    const above = box.top - 12;
    const up = below < Math.min(height, 180) && above > below;
    const available = Math.max(60, up ? above : below);
    setPosition({
      left: Math.max(8, Math.min(box.left, innerWidth - width - 8)),
      top: up
        ? Math.max(8, box.top - Math.min(height, available) - 6)
        : box.bottom + 6,
      width,
      maxHeight: Math.min(height, available),
    });
  }
  function focusOption(index: number) {
    const buttons = panel.current?.querySelectorAll<HTMLButtonElement>(
      "[role=option]:not(:disabled)",
    );
    if (!buttons?.length) return;
    buttons[(index + buttons.length) % buttons.length]?.focus();
  }
  return (
    <div className={`rounded-select ${className ?? ""}`}>
      <select
        {...props}
        ref={native}
        value={value}
        disabled={disabled}
        hidden
        tabIndex={-1}
        aria-hidden="true"
      >
        {children}
      </select>
      <button
        ref={trigger}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-haspopup="listbox"
        popoverTarget={panelId}
        className="rounded-select-trigger"
        onClick={(event) => {
          place();
          if (panel.current)
            panel.current.dataset.pointerOpen = String(event.detail > 0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (panel.current) panel.current.dataset.pointerOpen = "false";
            place();
            panel.current?.showPopover();
            requestAnimationFrame(() =>
              focusOption(event.key === "ArrowUp" ? -1 : 0),
            );
          }
        }}
      >
        {options.find((item) => item.value === selected)?.label ?? selected}
        <Icon name="collapse" size={15} />
      </button>
      <div
        ref={panel}
        id={panelId}
        popover="auto"
        role="listbox"
        aria-label={label}
        className="rounded-select-menu"
        style={{
          left: position.left,
          top: position.top,
          width: position.width,
          maxHeight: position.maxHeight,
        }}
        onKeyDown={(event) => {
          const buttons = Array.from(
            panel.current?.querySelectorAll<HTMLButtonElement>(
              "[role=option]:not(:disabled)",
            ) ?? [],
          );
          const index = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            focusOption(
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? -1
                  : index + (event.key === "ArrowDown" ? 1 : -1),
            );
          }
          if (event.key === "Tab") panel.current?.hidePopover();
        }}
      >
        {options.map((option) => (
          <button
            type="button"
            role="option"
            aria-selected={selected === option.value}
            disabled={option.disabled}
            key={option.value}
            onClick={() => {
              if (native.current) {
                native.current.value = option.value;
                native.current.dispatchEvent(
                  new Event("change", { bubbles: true }),
                );
              }
              panel.current?.hidePopover();
              trigger.current?.focus();
            }}
          >
            {option.label}
            {selected === option.value && <Icon name="check" size={14} />}
          </button>
        ))}
      </div>
    </div>
  );
}
