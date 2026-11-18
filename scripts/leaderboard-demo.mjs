export function createLeaderboardDemo(spec, now = () => new Date()) {
  const user =
    spec.paths["/api/v1/auth/login"].post.responses["200"].content[
      "application/json"
    ].example.data.user;
  const names = [
    "minhan",
    "baotran",
    "quanghuy",
    "lananh",
    "hoangnam",
    "thanhha",
    "ducminh",
    "thaonguyen",
    "giabao",
    "phuonglinh",
    "tuananh",
    "khanhvy",
    "nhatlong",
    "ngocmai",
    "haiphong",
    "thuyan",
    "trungtin",
    "yenchi",
    "duykhang",
    "linhdan",
    "anhkhoa",
    "nhuquynh",
    "quocbao",
    "hoaitrinh",
    "minhkhoi",
    "kimngan",
    "tienthanh",
    "ngocanh",
    "namphong",
    "tuongvi",
    "thanhtung",
  ];
  const seed = Array.from({ length: 62 }, (_, index) => ({
    userId: `90000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    username: `demo_${names[index % names.length]}${index >= names.length ? "_2" : ""}`,
    avatarUrl: null,
    solvedProblemCount: 70 - Math.floor(index / 2),
    acceptedSolutionCount: 100 - Math.floor(index / 2),
    rank: index % 2 === 0 ? index + 1 : index,
  }));
  const current = {
    userId: user.id,
    username: user.username,
    avatarUrl: null,
    solvedProblemCount: 3,
    acceptedSolutionCount: 4,
    rank: 63,
  };
  const ok = (data) => ({
    status: 200,
    body: { status: "success", code: 200, message: "Leaderboard demo", data },
  });
  const failure = (status, error) => ({
    status,
    body: {
      status: "error",
      code: status,
      message: "Demo request rejected",
      error,
      details: null,
    },
  });
  return (req, url) => {
    if (
      req.method !== "GET" ||
      !["/api/v1/leaderboard", "/api/v1/leaderboard/me"].includes(url.pathname)
    )
      return null;
    const me = url.pathname.endsWith("/me");
    const scope = url.searchParams.get("scope") ?? "all";
    const packageSlug = url.searchParams.get("package") || null;
    const readInt = (key, fallback, max) => {
      const raw = url.searchParams.get(key) ?? String(fallback);
      const value = Number(raw);
      return /^\d+$/.test(raw) &&
        Number.isSafeInteger(value) &&
        value >= 1 &&
        value <= max
        ? value
        : null;
    };
    const page = readInt("page", 1, Number.MAX_SAFE_INTEGER);
    const size = readInt("size", 50, 100);
    if (
      !["all", "week", "month"].includes(scope) ||
      page === null ||
      size === null
    )
      return failure(400, "BAD_REQUEST");
    const auth = req.headers.authorization;
    if (auth && auth !== "Bearer mock-access-token")
      return failure(401, "UNAUTHORIZED");
    if (!auth && (me || scope !== "all" || page !== 1 || size > 50))
      return failure(401, "UNAUTHORIZED");
    let periodStart = null;
    let periodEnd = null;
    if (scope !== "all") {
      const start = new Date(now());
      start.setUTCHours(0, 0, 0, 0);
      if (scope === "week")
        start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
      else start.setUTCDate(1);
      const end = new Date(start);
      if (scope === "week") end.setUTCDate(end.getUTCDate() + 7);
      else end.setUTCMonth(end.getUTCMonth() + 1);
      periodStart = start.toISOString();
      periodEnd = end.toISOString();
    }
    const base = { scope, packageSlug, periodStart, periodEnd };
    const items =
      packageSlug && packageSlug !== "arrays" ? [] : [...seed, current];
    if (me) return ok({ ...base, entry: items.length ? current : null });
    return ok({
      ...base,
      items: items.slice((page - 1) * size, page * size),
      page,
      size,
      total: items.length,
    });
  };
}
