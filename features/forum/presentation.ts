export function avatarTone(name: string) {
  return (
    Array.from(name).reduce(
      (hash, letter) => (hash * 31 + letter.codePointAt(0)!) >>> 0,
      0,
    ) % 5
  );
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : Array.from(parts[0] || "C")
          .slice(0, 2)
          .join("")
  ).toLocaleUpperCase("vi-VN");
}

export function relativeTime(iso: string, now: number) {
  const elapsed = (Date.parse(iso) - now) / 1000;
  const formatter = new Intl.RelativeTimeFormat("vi-VN", { numeric: "auto" });
  const units = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ] as const;
  for (const [seconds, unit] of units)
    if (Math.abs(elapsed) >= seconds)
      return formatter.format(Math.trunc(elapsed / seconds), unit);
  return "Vừa xong";
}

export function plainExcerpt(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/^[\s#>*-]+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);
}
