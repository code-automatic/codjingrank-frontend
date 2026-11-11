import { isSlug } from "@/lib/api/guards";
import type {
  LevelDifficulty,
  ListPackagesQuery,
  ListProblemsQuery,
} from "@/lib/api/types";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_PAGE_NUMBER = 1_000_000;
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export type SearchParamReader = {
  get(name: string): string | null;
};

export type SolvedFilter = "" | "true" | "false";

export type PackagesQueryState = {
  q: string;
  page: number;
  size: number;
};

export type ProblemsQueryState = {
  q: string;
  package: string;
  difficulty: LevelDifficulty | "";
  tag: string;
  solved: SolvedFilter;
  page: number;
  size: number;
};

export type ProblemsQueryOptions = {
  fixedPackageSlug?: string;
};

const VALID_DIFFICULTIES = new Set<LevelDifficulty>(["easy", "medium", "hard"]);

export function parsePositiveIntParam(
  raw: string | null,
  fallback: number,
  options?: { min?: number; max?: number; clampMax?: boolean },
): number {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return fallback;
  const parsed = Number.parseInt(trimmed, 10);
  const min = options?.min ?? 1;
  const max = options?.max ?? MAX_PAGE_NUMBER;
  if (!Number.isSafeInteger(parsed) || parsed < min) return fallback;
  if (parsed > max) {
    return options?.clampMax ? max : fallback;
  }
  return parsed;
}

export function parsePageParam(raw: string | null): number {
  return parsePositiveIntParam(raw, DEFAULT_PAGE, {
    min: 1,
    max: MAX_PAGE_NUMBER,
  });
}

export function parsePageSizeParam(raw: string | null): number {
  return parsePositiveIntParam(raw, DEFAULT_PAGE_SIZE, {
    min: 1,
    max: MAX_PAGE_SIZE,
    clampMax: true,
  });
}

export function parseSearchTermParam(raw: string | null): string {
  if (!raw) return "";
  return raw.trim();
}

export function parseSlugFilterParam(raw: string | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  return isSlug(trimmed) ? trimmed : "";
}

export function parseDifficultyParam(raw: string | null): LevelDifficulty | "" {
  if (!raw) return "";
  const trimmed = raw.trim() as LevelDifficulty;
  return VALID_DIFFICULTIES.has(trimmed) ? trimmed : "";
}

export function parseSolvedParam(raw: string | null): SolvedFilter {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed === "true" || trimmed === "false") return trimmed;
  return "";
}

export function buildSizeSelectOptions(currentSize: number): number[] {
  const values = new Set<number>(PAGE_SIZE_OPTIONS);
  if (
    Number.isInteger(currentSize) &&
    currentSize >= 1 &&
    currentSize <= MAX_PAGE_SIZE
  ) {
    values.add(currentSize);
  }
  return Array.from(values).sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// /packages query state
// ---------------------------------------------------------------------------

export function parsePackagesSearchParams(
  params: SearchParamReader,
): PackagesQueryState {
  return {
    q: parseSearchTermParam(params.get("q")),
    page: parsePageParam(params.get("page")),
    size: parsePageSizeParam(params.get("size")),
  };
}

export function serializePackagesSearchParams(
  state: PackagesQueryState,
): string {
  const params = new URLSearchParams();
  const cleanQ = parseSearchTermParam(state.q);
  if (cleanQ) params.set("q", cleanQ);
  if (state.page > DEFAULT_PAGE) params.set("page", String(state.page));
  if (state.size !== DEFAULT_PAGE_SIZE) {
    params.set("size", String(state.size));
  }
  return params.toString();
}

export function buildPackagesHref(state: PackagesQueryState): string {
  const qs = serializePackagesSearchParams(state);
  return qs ? `/packages?${qs}` : "/packages";
}

export function updatePackagesFilter(
  current: PackagesQueryState,
  patch: Partial<Pick<PackagesQueryState, "q" | "size">>,
): PackagesQueryState {
  const nextQ =
    patch.q !== undefined ? parseSearchTermParam(patch.q) : current.q;
  const nextSize =
    patch.size !== undefined
      ? parsePageSizeParam(String(patch.size))
      : current.size;
  return {
    q: nextQ,
    size: nextSize,
    page: DEFAULT_PAGE,
  };
}

export function clearPackagesFilters(
  current: PackagesQueryState,
  options?: { keepSize?: boolean },
): PackagesQueryState {
  return {
    q: "",
    page: DEFAULT_PAGE,
    size: options?.keepSize ? current.size : DEFAULT_PAGE_SIZE,
  };
}

export function setPackagesPage(
  current: PackagesQueryState,
  nextPage: number,
): PackagesQueryState {
  const cleanPage =
    Number.isInteger(nextPage) && nextPage >= 1 && nextPage <= MAX_PAGE_NUMBER
      ? nextPage
      : DEFAULT_PAGE;
  return { ...current, page: cleanPage };
}

export function hasActivePackagesFilters(state: PackagesQueryState): boolean {
  return state.q.length > 0;
}

export function toListPackagesQuery(
  state: PackagesQueryState,
): ListPackagesQuery {
  return {
    page: state.page,
    size: state.size,
    ...(state.q ? { q: state.q } : {}),
  };
}

// ---------------------------------------------------------------------------
// /problems & /packages/[slug] query state
// ---------------------------------------------------------------------------

export function parseProblemsSearchParams(
  params: SearchParamReader,
  options?: ProblemsQueryOptions,
): ProblemsQueryState {
  const fixedPackage = options?.fixedPackageSlug
    ? parseSlugFilterParam(options.fixedPackageSlug)
    : "";
  return {
    q: parseSearchTermParam(params.get("q")),
    package: fixedPackage || parseSlugFilterParam(params.get("package")),
    difficulty: parseDifficultyParam(params.get("difficulty")),
    tag: parseSlugFilterParam(params.get("tag")),
    solved: parseSolvedParam(params.get("solved")),
    page: parsePageParam(params.get("page")),
    size: parsePageSizeParam(params.get("size")),
  };
}

export function serializeProblemsSearchParams(
  state: ProblemsQueryState,
  options?: ProblemsQueryOptions,
): string {
  const params = new URLSearchParams();
  const cleanQ = parseSearchTermParam(state.q);
  if (cleanQ) params.set("q", cleanQ);
  if (!options?.fixedPackageSlug) {
    const cleanPkg = parseSlugFilterParam(state.package);
    if (cleanPkg) params.set("package", cleanPkg);
  }
  if (state.difficulty) params.set("difficulty", state.difficulty);
  const cleanTag = parseSlugFilterParam(state.tag);
  if (cleanTag) params.set("tag", cleanTag);
  if (state.solved) params.set("solved", state.solved);
  if (state.page > DEFAULT_PAGE) params.set("page", String(state.page));
  if (state.size !== DEFAULT_PAGE_SIZE) {
    params.set("size", String(state.size));
  }
  return params.toString();
}

export function buildProblemsHref(
  state: ProblemsQueryState,
  options?: ProblemsQueryOptions & { pathname?: string },
): string {
  const basePath =
    options?.pathname ??
    (options?.fixedPackageSlug
      ? `/packages/${encodeURIComponent(options.fixedPackageSlug)}`
      : "/problems");
  const qs = serializeProblemsSearchParams(state, options);
  return qs ? `${basePath}?${qs}` : basePath;
}

export function updateProblemsFilter(
  current: ProblemsQueryState,
  patch: Partial<
    Pick<
      ProblemsQueryState,
      "q" | "package" | "difficulty" | "tag" | "solved" | "size"
    >
  >,
  options?: ProblemsQueryOptions,
): ProblemsQueryState {
  const fixedPackage = options?.fixedPackageSlug
    ? parseSlugFilterParam(options.fixedPackageSlug)
    : "";
  return {
    q: patch.q !== undefined ? parseSearchTermParam(patch.q) : current.q,
    package: fixedPackage
      ? fixedPackage
      : patch.package !== undefined
        ? parseSlugFilterParam(patch.package)
        : current.package,
    difficulty:
      patch.difficulty !== undefined
        ? parseDifficultyParam(patch.difficulty)
        : current.difficulty,
    tag:
      patch.tag !== undefined ? parseSlugFilterParam(patch.tag) : current.tag,
    solved:
      patch.solved !== undefined
        ? parseSolvedParam(patch.solved)
        : current.solved,
    size:
      patch.size !== undefined
        ? parsePageSizeParam(String(patch.size))
        : current.size,
    page: DEFAULT_PAGE,
  };
}

export function clearProblemsFilters(
  current: ProblemsQueryState,
  options?: ProblemsQueryOptions & { keepSize?: boolean },
): ProblemsQueryState {
  const fixedPackage = options?.fixedPackageSlug
    ? parseSlugFilterParam(options.fixedPackageSlug)
    : "";
  return {
    q: "",
    package: fixedPackage,
    difficulty: "",
    tag: "",
    solved: "",
    page: DEFAULT_PAGE,
    size: options?.keepSize ? current.size : DEFAULT_PAGE_SIZE,
  };
}

export function setProblemsPage(
  current: ProblemsQueryState,
  nextPage: number,
): ProblemsQueryState {
  const cleanPage =
    Number.isInteger(nextPage) && nextPage >= 1 && nextPage <= MAX_PAGE_NUMBER
      ? nextPage
      : DEFAULT_PAGE;
  return { ...current, page: cleanPage };
}

export function hasActiveProblemFilters(
  state: ProblemsQueryState,
  options?: ProblemsQueryOptions,
): boolean {
  return Boolean(
    state.q ||
    state.difficulty ||
    state.tag ||
    state.solved ||
    (!options?.fixedPackageSlug && state.package),
  );
}

export function toListProblemsQuery(
  state: ProblemsQueryState,
): ListProblemsQuery {
  return {
    page: state.page,
    size: state.size,
    ...(state.package ? { package: state.package } : {}),
    ...(state.difficulty ? { difficulty: state.difficulty } : {}),
    ...(state.tag ? { tag: state.tag } : {}),
    ...(state.solved === "true"
      ? { solved: true }
      : state.solved === "false"
        ? { solved: false }
        : {}),
    ...(state.q ? { q: state.q } : {}),
  };
}
