"use client";
import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

export function IconButton({
  icon,
  label,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  label: string;
}) {
  return (
    <button
      type="button"
      {...props}
      className={`button-secondary icon-button ${className}`}
      aria-label={label}
      title={label}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
