"use client";
export function WorkspaceSeparator({
  orientation,
  value,
  min = 30,
  max = 65,
  label,
  controls,
  onChange,
}: {
  orientation: "vertical" | "horizontal";
  value: number;
  min?: number;
  max?: number;
  label: string;
  controls: string;
  onChange: (next: number) => void;
}) {
  const vertical = orientation === "vertical";
  const clamp = (next: number) => onChange(Math.max(min, Math.min(max, next)));
  return (
    <div
      className={`workspace-resizer workspace-resizer--${orientation}`}
      role="separator"
      aria-label={label}
      aria-orientation={orientation}
      aria-controls={controls}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onKeyDown={(event) => {
        const next =
          event.key === "Home"
            ? min
            : event.key === "End"
              ? max
              : event.key === (vertical ? "ArrowLeft" : "ArrowUp")
                ? value - 2
                : event.key === (vertical ? "ArrowRight" : "ArrowDown")
                  ? value + 2
                  : null;
        if (next !== null) {
          event.preventDefault();
          clamp(next);
        }
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const bounds =
          event.currentTarget.parentElement!.getBoundingClientRect();
        clamp(
          Math.round(
            (vertical
              ? (event.clientX - bounds.left) / bounds.width
              : (event.clientY - bounds.top) / bounds.height) * 100,
          ),
        );
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
    >
      <span />
    </div>
  );
}
