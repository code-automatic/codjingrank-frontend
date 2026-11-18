export function elapsedAt(
  accumulated: number,
  startedAt: number | null,
  now: number,
) {
  return accumulated + (startedAt === null ? 0 : Math.max(0, now - startedAt));
}

export function formatClock(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return [
    Math.floor(seconds / 3600),
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}
