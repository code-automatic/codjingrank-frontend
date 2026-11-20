const PATHS = {
  eyeOff:
    "m3 3 18 18M10.6 5.1 12 5c6.5 0 10 7 10 7s-1.2 2.4-3.5 4.4M6.2 6.2C3.5 8.2 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3M10 10a3 3 0 0 0 4 4",
  sparkles:
    "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3M20 2v4m-2-2h4",
  calendar:
    "M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2M7 2v4m10-4v4M3 9h18M7 13h2m4 0h2m-8 4h2",
  flame: "M12 2c1 5 6 7 6 12a6 6 0 0 1-12 0c0-3 2-6 4-8 0 4 2 5 2 5s3-3 0-9z",
  circle: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  lock: "M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4",
  search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  menu: "M4 6h16M4 12h16M4 18h16",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2",
  trophy:
    "M8 3h8v6a4 4 0 0 1-8 0V3m0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 1v7m-4 1h8",
  book: "M3 3h7l2 2 2-2h7v16h-7l-2 2-2-2H3V3m9 2v16",
  layers: "m12 2 10 6-10 6L2 8l10-6M2 12l10 6 10-6M2 16l10 6 10-6",
  logout: "M9 3H3v18h6m6-15 6 6-6 6m-8-6h14",
  chevronLeft: "m15 6-6 6 6 6",
  chevronRight: "m9 6 6 6-6 6",
  clock: "M9 2h6m-3 0v3m6 0 2 2M12 9v4l2 1m6-1a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  settings:
    "M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  expand:
    "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6",
  collapse: "m6 14 6-6 6 6",
  copy: "M9 9h12v12H9zM15 5V3H3v12h2",
  close: "m6 6 12 12M6 18 18 6",
  arrowUpRight: "M7 17 17 7M7 7h10v10",
  message: "M21 15a3 3 0 0 1-3 3H8l-5 3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7m10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z",
  sun: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  moon: "M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13",
  pause: "M9 5v14M15 5v14",
  code: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  play: "m8 5 12 7-12 7z",
  submit: "M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5",
  reset: "M3 11a9 9 0 1 1 2.5 7M3 4v7h7",
  check: "m5 12 4 4L19 6",
  history: "M3 11a9 9 0 1 1 2.5 7M3 4v7h7m2-4v5l3 2",
} as const;
export type IconName = keyof typeof PATHS;
export function Icon({
  name,
  size = 16,
}: {
  name: keyof typeof PATHS;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
