import type {
  LeaderboardQuery,
  LeaderboardScope,
  MyRankQuery,
} from "@/lib/api/types";

export type BoardQuery = {
  scope: LeaderboardScope;
  package: string;
  page: number;
  size: number;
};

export function parseBoardQuery(params: URLSearchParams): BoardQuery {
  const scope = params.get("scope");
  const integer = (key: string, fallback: number, max: number) => {
    const raw = params.get(key) ?? "";
    const value = Number(raw);
    return /^\d+$/.test(raw) &&
      Number.isSafeInteger(value) &&
      value >= 1 &&
      value <= max
      ? value
      : fallback;
  };
  return {
    scope: scope === "week" || scope === "month" ? scope : "all",
    package: (params.get("package") ?? "").trim(),
    page: integer("page", 1, Number.MAX_SAFE_INTEGER),
    size: integer("size", 50, 100),
  };
}

export function boardHref(query: BoardQuery): string {
  const params = new URLSearchParams();
  if (query.scope !== "all") params.set("scope", query.scope);
  if (query.package) params.set("package", query.package);
  if (query.page !== 1) params.set("page", String(query.page));
  if (query.size !== 50) params.set("size", String(query.size));
  return `/leaderboard${params.size ? `?${params}` : ""}`;
}

export function boardApiQuery(query: BoardQuery): LeaderboardQuery {
  return {
    scope: query.scope,
    ...(query.package ? { package: query.package } : {}),
    page: query.page,
    size: query.size,
  };
}

export function myRankQuery(query: BoardQuery): MyRankQuery {
  return {
    scope: query.scope,
    ...(query.package ? { package: query.package } : {}),
  };
}
