import {
  clearProblemsFilters,
  hasActiveProblemFilters,
  toListPackagesQuery,
  toListProblemsQuery,
  type PackagesQueryState,
  type ProblemsQueryState,
} from "@/features/catalog/query";
import { isAbortError } from "@/features/catalog/viewModel";
import type {
  PackageDetailModel,
  PackageModel,
  ProblemSummaryModel,
  TagModel,
} from "@/lib/api/adapters/catalog";
import { ApiError } from "@/lib/api/client";
import { withDeadline } from "@/lib/api/deadline";
import type { ApiClient, PaginatedData } from "@/lib/api";

const DEFAULT_TIMEOUT_MS = 15_000;

function isTimeoutError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "REQUEST_TIMEOUT";
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

// ---------------------------------------------------------------------------
// 1. /packages resource
// ---------------------------------------------------------------------------

export type PackagesResourceState = {
  phase: "loading" | "ready" | "error";
  refreshing: boolean;
  data: PaginatedData<PackageModel> | null;
  error: unknown;
};

export function createPackagesResource(
  api: Pick<ApiClient, "catalog">,
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  let state: PackagesResourceState = {
    phase: "loading",
    refreshing: false,
    data: null,
    error: null,
  };
  const initial = state;
  const listeners = new Set<() => void>();
  let generation = 0;
  let activeAbort: AbortController | undefined;

  function publish(patch: Partial<PackagesResourceState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }

  function dispose() {
    generation++;
    activeAbort?.abort();
  }

  async function load(queryState: PackagesQueryState) {
    activeAbort?.abort();
    const epoch = ++generation;
    const controller = new AbortController();
    activeAbort = controller;

    publish({
      phase: state.data ? "ready" : "loading",
      refreshing: Boolean(state.data),
      error: null,
    });

    try {
      const pageData = await withDeadline(
        controller,
        () =>
          api.catalog.listPackages(toListPackagesQuery(queryState), {
            signal: controller.signal,
          }),
        timeoutMs,
      );
      if (controller.signal.aborted || epoch !== generation) return;
      publish({
        phase: "ready",
        refreshing: false,
        data: pageData,
        error: null,
      });
    } catch (error) {
      if (
        (isAbortError(error) || controller.signal.aborted) &&
        !isTimeoutError(error)
      ) {
        return;
      }
      if (epoch !== generation) return;
      publish({
        phase: "error",
        refreshing: false,
        data: null,
        error,
      });
    }
  }

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => initial,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    load,
    dispose,
  };
}

// ---------------------------------------------------------------------------
// 2. /packages/[slug] resource
// ---------------------------------------------------------------------------

export type PackageDetailResourceState = {
  packagePhase: "loading" | "ready" | "error";
  packageDetail: PackageDetailModel | null;
  packageError: unknown;
  refreshingLevels: boolean;
  levelsError: unknown;
  levelsNotice: string;
  tags: TagModel[];
  tagsError: unknown;
  problemsPhase: "loading" | "ready" | "error";
  problemsRefreshing: boolean;
  problemsPage: PaginatedData<ProblemSummaryModel> | null;
  problemsError: unknown;
};

export function createPackageDetailResource(
  api: Pick<ApiClient, "catalog">,
  slug: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  let state: PackageDetailResourceState = {
    packagePhase: "loading",
    packageDetail: null,
    packageError: null,
    refreshingLevels: false,
    levelsError: null,
    levelsNotice: "",
    tags: [],
    tagsError: null,
    problemsPhase: "loading",
    problemsRefreshing: false,
    problemsPage: null,
    problemsError: null,
  };
  const initial = state;
  const listeners = new Set<() => void>();

  let packageGen = 0;
  let levelsGen = 0;
  let tagsGen = 0;
  let problemsGen = 0;

  let packageAbort: AbortController | undefined;
  let levelsAbort: AbortController | undefined;
  let tagsAbort: AbortController | undefined;
  let problemsAbort: AbortController | undefined;

  function publish(patch: Partial<PackageDetailResourceState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }

  function dispose() {
    packageGen++;
    levelsGen++;
    tagsGen++;
    problemsGen++;
    packageAbort?.abort();
    levelsAbort?.abort();
    tagsAbort?.abort();
    problemsAbort?.abort();
  }

  async function loadPackageHeader() {
    packageAbort?.abort();
    const epoch = ++packageGen;
    const controller = new AbortController();
    packageAbort = controller;

    publish({
      packagePhase: "loading",
      packageError: null,
      levelsError: null,
      levelsNotice: "",
    });

    try {
      const detail = await withDeadline(
        controller,
        () => api.catalog.getPackage(slug, { signal: controller.signal }),
        timeoutMs,
      );
      if (controller.signal.aborted || epoch !== packageGen) return;
      if (detail.package.slug !== slug) {
        throw new ApiError(200, "INVALID_CONTRACT_DATA", {
          field: "package.slug",
          reason: "slug_mismatch",
        });
      }
      publish({
        packagePhase: "ready",
        packageDetail: detail,
        packageError: null,
      });
    } catch (error) {
      if (
        (isAbortError(error) || controller.signal.aborted) &&
        !isTimeoutError(error)
      ) {
        return;
      }
      if (epoch !== packageGen) return;
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 404)
      ) {
        problemsGen++;
        problemsAbort?.abort();
      }
      publish({
        packagePhase: "error",
        packageDetail: null,
        packageError: error,
      });
    }
  }

  async function loadTags() {
    tagsAbort?.abort();
    const epoch = ++tagsGen;
    const controller = new AbortController();
    tagsAbort = controller;

    publish({ tagsError: null });

    try {
      const tags = await withDeadline(
        controller,
        () => api.catalog.listTags({ signal: controller.signal }),
        timeoutMs,
      );
      if (controller.signal.aborted || epoch !== tagsGen) return;
      publish({ tags, tagsError: null });
    } catch (error) {
      if (
        (isAbortError(error) || controller.signal.aborted) &&
        !isTimeoutError(error)
      ) {
        return;
      }
      if (epoch !== tagsGen) return;
      publish({ tagsError: error });
    }
  }

  async function loadProblems(queryState: ProblemsQueryState) {
    problemsAbort?.abort();
    const epoch = ++problemsGen;
    const controller = new AbortController();
    problemsAbort = controller;

    const scopedState: ProblemsQueryState = {
      ...queryState,
      package: slug,
    };

    publish({
      problemsPhase: state.problemsPage ? "ready" : "loading",
      problemsRefreshing: Boolean(state.problemsPage),
      problemsError: null,
    });

    try {
      const pageData = await withDeadline(
        controller,
        () =>
          api.catalog.listProblems(toListProblemsQuery(scopedState), {
            signal: controller.signal,
          }),
        timeoutMs,
      );
      if (controller.signal.aborted || epoch !== problemsGen) return;
      publish({
        problemsPhase: "ready",
        problemsRefreshing: false,
        problemsPage: pageData,
        problemsError: null,
      });
    } catch (error) {
      if (
        (isAbortError(error) || controller.signal.aborted) &&
        !isTimeoutError(error)
      ) {
        return;
      }
      if (epoch !== problemsGen) return;
      publish({
        problemsPhase: "error",
        problemsRefreshing: false,
        problemsPage: null,
        problemsError: error,
      });
    }
  }

  async function refreshLevels(queryState?: ProblemsQueryState) {
    levelsAbort?.abort();
    const epoch = ++levelsGen;
    const controller = new AbortController();
    levelsAbort = controller;

    publish({
      refreshingLevels: true,
      levelsError: null,
      levelsNotice: "",
    });

    try {
      const detail = await withDeadline(
        controller,
        () => api.catalog.getPackageLevels(slug, { signal: controller.signal }),
        timeoutMs,
      );
      if (controller.signal.aborted || epoch !== levelsGen) return;
      if (detail.package.slug !== slug) {
        throw new ApiError(200, "INVALID_CONTRACT_DATA", {
          field: "package.slug",
          reason: "slug_mismatch",
        });
      }
      publish({
        packagePhase: "ready",
        packageDetail: detail,
        packageError: null,
        refreshingLevels: false,
        levelsError: null,
        levelsNotice: "Đã cập nhật trạng thái cấp độ mới nhất từ máy chủ.",
      });
      if (queryState) {
        await loadProblems(queryState);
      }
    } catch (error) {
      if (
        (isAbortError(error) || controller.signal.aborted) &&
        !isTimeoutError(error)
      ) {
        return;
      }
      if (epoch !== levelsGen) return;
      if (isUnauthorizedError(error)) {
        publish({
          packagePhase: "error",
          packageDetail: null,
          packageError: error,
          refreshingLevels: false,
          levelsError: null,
        });
        return;
      }
      publish({
        refreshingLevels: false,
        levelsError: error,
      });
    }
  }

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => initial,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    loadPackageHeader,
    loadTags,
    loadProblems,
    refreshLevels,
    dispose,
  };
}

// ---------------------------------------------------------------------------
// 3. /problems resource
// ---------------------------------------------------------------------------

export type ProblemsResourceState = {
  phase: "loading" | "ready" | "error";
  refreshing: boolean;
  data: PaginatedData<ProblemSummaryModel> | null;
  error: unknown;
  tags: TagModel[];
  tagsError: unknown;
  packages: PackageModel[];
  packagesTotal: number;
  packagesError: unknown;
};

export function createProblemsResource(
  api: Pick<ApiClient, "catalog">,
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  let state: ProblemsResourceState = {
    phase: "loading",
    refreshing: false,
    data: null,
    error: null,
    tags: [],
    tagsError: null,
    packages: [],
    packagesTotal: 0,
    packagesError: null,
  };
  const initial = state;
  const listeners = new Set<() => void>();

  let listGen = 0;
  let metaGen = 0;
  let listAbort: AbortController | undefined;
  let metaAbort: AbortController | undefined;

  function publish(patch: Partial<ProblemsResourceState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }

  function dispose() {
    listGen++;
    metaGen++;
    listAbort?.abort();
    metaAbort?.abort();
  }

  async function loadMetadata() {
    metaAbort?.abort();
    const epoch = ++metaGen;
    const controller = new AbortController();
    metaAbort = controller;

    publish({
      tagsError: null,
      packagesError: null,
    });

    const [tagsResult, packagesResult] = await Promise.allSettled([
      withDeadline(
        controller,
        () => api.catalog.listTags({ signal: controller.signal }),
        timeoutMs,
      ),
      withDeadline(
        controller,
        () =>
          api.catalog.listPackages(
            { page: 1, size: 100 },
            { signal: controller.signal },
          ),
        timeoutMs,
      ),
    ]);

    if (controller.signal.aborted || epoch !== metaGen) return;

    const nextPatch: Partial<ProblemsResourceState> = {};

    if (tagsResult.status === "fulfilled") {
      nextPatch.tags = tagsResult.value;
      nextPatch.tagsError = null;
    } else if (
      !isAbortError(tagsResult.reason) ||
      isTimeoutError(tagsResult.reason)
    ) {
      nextPatch.tagsError = tagsResult.reason;
    }

    if (packagesResult.status === "fulfilled") {
      nextPatch.packages = packagesResult.value.items;
      nextPatch.packagesTotal = packagesResult.value.total;
      nextPatch.packagesError = null;
    } else if (
      !isAbortError(packagesResult.reason) ||
      isTimeoutError(packagesResult.reason)
    ) {
      nextPatch.packagesError = packagesResult.reason;
    }

    publish(nextPatch);
  }

  async function loadProblems(queryState: ProblemsQueryState) {
    listAbort?.abort();
    const epoch = ++listGen;
    const controller = new AbortController();
    listAbort = controller;

    publish({
      phase: state.data ? "ready" : "loading",
      refreshing: Boolean(state.data),
      error: null,
    });

    try {
      const pageData = await withDeadline(
        controller,
        () =>
          api.catalog.listProblems(toListProblemsQuery(queryState), {
            signal: controller.signal,
          }),
        timeoutMs,
      );
      if (controller.signal.aborted || epoch !== listGen) return;
      publish({
        phase: "ready",
        refreshing: false,
        data: pageData,
        error: null,
      });
    } catch (error) {
      if (
        (isAbortError(error) || controller.signal.aborted) &&
        !isTimeoutError(error)
      ) {
        return;
      }
      if (epoch !== listGen) return;
      publish({
        phase: "error",
        refreshing: false,
        data: null,
        error,
      });
    }
  }

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => initial,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    loadMetadata,
    loadProblems,
    dispose,
  };
}

export { clearProblemsFilters, hasActiveProblemFilters };
