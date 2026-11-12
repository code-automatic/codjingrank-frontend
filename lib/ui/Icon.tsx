const PATHS = {
  code: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  play: "m8 5 12 7-12 7z",
  submit: "M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5",
  reset: "M3 11a9 9 0 1 1 2.5 7M3 4v7h7",
  check: "m5 12 4 4L19 6",
  history: "M3 11a9 9 0 1 1 2.5 7M3 4v7h7m2-4v5l3 2",
} as const;
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
