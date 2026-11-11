import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import {
  CatalogEmptyPanel,
  CatalogErrorPanel,
  CatalogLoadingState,
  CatalogPaginationBar,
  PackageLevelsSection,
  PackagesGrid,
  ProblemSummaryList,
} from "@/features/catalog/CatalogSections";
import {
  buildPackagesHref,
  buildProblemsHref,
  clearPackagesFilters,
  clearProblemsFilters,
  parsePackagesSearchParams,
  parseProblemsSearchParams,
  setPackagesPage,
  setProblemsPage,
  toListPackagesQuery,
  toListProblemsQuery,
  updatePackagesFilter,
  updateProblemsFilter,
} from "@/features/catalog/query";
import {
  createPackageDetailResource,
  createPackagesResource,
  createProblemsResource,
} from "@/features/catalog/resources";
import {
  classifyCatalogError,
  computePaginationMeta,
  describeLevelCard,
  describeProblemItem,
} from "@/features/catalog/viewModel";
import {
  ApiError,
  createApiClient,
  createTransport,
  type ApiClient,
  type LevelProgressModel,
  type PackageDetailModel,
  type PackageModel,
  type PaginatedData,
  type ProblemSummaryModel,
  type TagModel,
} from "@/lib/api";
import {
  adaptPackageDetail,
  adaptPackagesPage,
  adaptProblemsPage,
  adaptTagsResponse,
} from "@/lib/api/adapters/catalog";

const UUID1 = "11111111-1111-4111-8111-111111111111";
const UUID2 = "22222222-2222-4222-8222-222222222222";
const UUID3 = "33333333-3333-4333-8333-333333333333";
const UUID_LVL1 = "22222222-2222-4222-8222-222222222221";
const UUID_LVL2 = "22222222-2222-4222-8222-222222222222";

const openApiSpec = parse(
  readFileSync(
    new URL("../contracts/openapi_fe.yaml", import.meta.url),
    "utf8",
  ),
) as {
  paths: Record<
    string,
    {
      get?: {
        responses: Record<
          string,
          {
            content?: {
              "application/json"?: {
                example?: { data: unknown };
                examples?: Record<string, { value: { data: unknown } }>;
              };
            };
          }
        >;
      };
    }
  >;
};

function getExampleData(path: string, exampleName?: string): unknown {
  const content =
    openApiSpec.paths[path]?.get?.responses["200"]?.content?.[
      "application/json"
    ];
  if (exampleName) {
    return content?.examples?.[exampleName]?.value.data;
  }
  return content?.example?.data;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeEnvelope(data: unknown, status = 200) {
  return new Response(
    JSON.stringify({
      status: "success",
      code: status,
      message: "ok",
      data,
    }),
    { status },
  );
}

const samplePackagesPage: PaginatedData<PackageModel> = adaptPackagesPage(
  getExampleData("/api/v1/packages", "populated"),
);

const samplePackageDetail: PackageDetailModel = adaptPackageDetail(
  getExampleData("/api/v1/packages/{slug}"),
);

const sampleTags: TagModel[] = adaptTagsResponse(
  getExampleData("/api/v1/tags"),
);

const sampleProblemsPage: PaginatedData<ProblemSummaryModel> =
  adaptProblemsPage(getExampleData("/api/v1/problems", "populated"));

describe("catalog URL query serialization and filter resets", () => {
  it("parses and round-trips /packages URL params safely", () => {
    const state = parsePackagesSearchParams(
      new URLSearchParams("q=%20arrays%20&page=3&size=10"),
    );
    expect(state).toEqual({ q: "arrays", page: 3, size: 10 });
    expect(buildPackagesHref(state)).toBe("/packages?q=arrays&page=3&size=10");
    expect(toListPackagesQuery(state)).toEqual({
      q: "arrays",
      page: 3,
      size: 10,
    });

    const sanitized = parsePackagesSearchParams(
      new URLSearchParams("q=%20%20&page=-5&size=999"),
    );
    expect(sanitized).toEqual({ q: "", page: 1, size: 100 });
    expect(buildPackagesHref({ q: "", page: 1, size: 20 })).toBe("/packages");
  });

  it("resets /packages page to 1 when search query or size changes", () => {
    const page3 = setPackagesPage({ q: "", page: 1, size: 20 }, 3);
    expect(page3.page).toBe(3);

    const afterSearch = updatePackagesFilter(page3, { q: "graph" });
    expect(afterSearch).toEqual({ q: "graph", page: 1, size: 20 });

    const afterSize = updatePackagesFilter(page3, { size: 50 });
    expect(afterSize).toEqual({ q: "", page: 1, size: 50 });

    const afterClear = clearPackagesFilters(page3, { keepSize: true });
    expect(afterClear).toEqual({ q: "", page: 1, size: 20 });
  });

  it("parses, serializes, and resets page=1 for /problems filters", () => {
    const initial = parseProblemsSearchParams(
      new URLSearchParams(
        "q=%20sum%20&package=arrays&difficulty=easy&tag=dp&solved=false&page=4&size=10",
      ),
    );
    expect(initial).toEqual({
      q: "sum",
      package: "arrays",
      difficulty: "easy",
      tag: "dp",
      solved: "false",
      page: 4,
      size: 10,
    });
    expect(buildProblemsHref(initial)).toBe(
      "/problems?q=sum&package=arrays&difficulty=easy&tag=dp&solved=false&page=4&size=10",
    );
    expect(toListProblemsQuery(initial)).toEqual({
      q: "sum",
      package: "arrays",
      difficulty: "easy",
      tag: "dp",
      solved: false,
      page: 4,
      size: 10,
    });

    for (const patch of [
      { q: "prefix" },
      { package: "strings" },
      { difficulty: "hard" as const },
      { tag: "arrays" },
      { solved: "true" as const },
      { size: 50 },
    ]) {
      expect(updateProblemsFilter(initial, patch).page).toBe(1);
    }

    const cleared = clearProblemsFilters(initial);
    expect(cleared).toEqual({
      q: "",
      package: "",
      difficulty: "",
      tag: "",
      solved: "",
      page: 1,
      size: 20,
    });
  });

  it("enforces fixedPackageSlug and sanitizes invalid /packages/[slug] query values", () => {
    const parsed = parseProblemsSearchParams(
      new URLSearchParams(
        "package=other-pkg&difficulty=invalid&tag=../bad&solved=maybe&page=0&size=abc",
      ),
      { fixedPackageSlug: "arrays" },
    );
    expect(parsed).toEqual({
      q: "",
      package: "arrays",
      difficulty: "",
      tag: "",
      solved: "",
      page: 1,
      size: 20,
    });
    expect(
      buildProblemsHref(
        setProblemsPage(
          updateProblemsFilter(
            parsed,
            { difficulty: "medium" },
            { fixedPackageSlug: "arrays" },
          ),
          2,
        ),
        { fixedPackageSlug: "arrays" },
      ),
    ).toBe("/packages/arrays?difficulty=medium&page=2");
  });
});

describe("server-driven levels, problem locks, and Gateway /api/v1 wiring", () => {
  it("never derives unlock or completion state on the client for levels or paginated problems", () => {
    // Even though solved === total on lv1 and lv2, render strictly what server says.
    const serverLevel: LevelProgressModel = {
      id: UUID_LVL2,
      packageId: UUID1,
      levelNo: 2,
      slug: "medium",
      name: "Medium",
      difficulty: "medium",
      total: 2,
      solved: 2,
      unlocked: false,
      completed: false,
      completionPercent: 100,
      lockStatus: "locked",
    };
    const levelCard = describeLevelCard(serverLevel);
    expect(levelCard.statusTone).toBe("locked");
    expect(levelCard.statusLabel).toBe("Đang khóa");

    const emptyLevelCard = describeLevelCard({
      id: UUID_LVL1,
      packageId: UUID1,
      levelNo: 1,
      slug: "easy",
      name: "Easy",
      difficulty: "easy",
      total: 0,
      solved: 0,
      unlocked: true,
      completed: true,
      completionPercent: 100,
      lockStatus: "completed",
    });
    expect(emptyLevelCard.statusTone).toBe("completed");
    expect(emptyLevelCard.progressText).toBe("0/0 bài");

    // Problem difficulty alone does not imply open/locked across a paginated slice
    const lockedEasyProblem: ProblemSummaryModel = {
      ...sampleProblemsPage.items[0],
      id: UUID2,
      slug: "locked-easy",
      title: "Locked easy item",
      difficulty: "easy",
      unlocked: false,
      canOpen: false,
    };
    const lockedView = describeProblemItem(lockedEasyProblem);
    expect(lockedView.isLocked).toBe(true);
    expect(lockedView.openHref).toBeNull();

    const openHardProblem: ProblemSummaryModel = {
      ...sampleProblemsPage.items[0],
      id: UUID3,
      slug: "open-hard",
      title: "Open hard item",
      difficulty: "hard",
      unlocked: true,
      canOpen: true,
      solved: true,
    };
    const openView = describeProblemItem(openHardProblem);
    expect(openView.isLocked).toBe(false);
    expect(openView.openHref).toBe("/problems/open-hard");
    expect(openView.solvedLabel).toBe("Đã giải");
  });

  it("sends canonical /api/v1 requests with UUID/slug params via Gateway transport", async () => {
    const calls: string[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("/api/v1/packages/arrays/levels")) {
        return makeEnvelope(getExampleData("/api/v1/packages/{slug}/levels"));
      }
      if (url.includes("/api/v1/packages?")) {
        return makeEnvelope(getExampleData("/api/v1/packages", "populated"));
      }
      if (url.includes("/api/v1/problems?")) {
        return makeEnvelope(getExampleData("/api/v1/problems", "populated"));
      }
      return makeEnvelope(getExampleData("/api/v1/tags"));
    });

    const api = createApiClient({
      authRequest: async <T>(path: string, init?: RequestInit) =>
        createTransport("http://localhost:4010", fetcher)<T>(path, init, "tok"),
      publicRequest: async <T>(path: string, init?: RequestInit) =>
        createTransport("http://localhost:4010", fetcher)<T>(path, init),
    });

    await api.catalog.listPackages({ page: 2, size: 10, q: "arr" });
    await api.catalog.getPackageLevels("arrays");
    await api.catalog.listProblems({
      page: 2,
      size: 10,
      package: "arrays",
      difficulty: "medium",
      tag: "arrays",
      solved: false,
      q: "sum",
    });
    await api.catalog.listTags();

    expect(calls[0]).toBe(
      "http://localhost:4010/api/v1/packages?page=2&size=10&q=arr",
    );
    expect(calls[1]).toBe(
      "http://localhost:4010/api/v1/packages/arrays/levels",
    );
    expect(calls[2]).toBe(
      "http://localhost:4010/api/v1/problems?page=2&size=10&package=arrays&difficulty=medium&tag=arrays&solved=false&q=sum",
    );
    expect(calls[3]).toBe("http://localhost:4010/api/v1/tags");
  });
});

describe("catalog async resources, race safety, error states, and refresh", () => {
  it("keeps latest filter response on /packages and cancels stale slow requests", async () => {
    const first = deferred<PaginatedData<PackageModel>>();
    const second = deferred<PaginatedData<PackageModel>>();
    const signals: AbortSignal[] = [];

    const listPackages = vi.fn((query, opts) => {
      signals.push(opts!.signal!);
      return query?.page === 1 ? first.promise : second.promise;
    });

    const resource = createPackagesResource({
      catalog: { listPackages } as unknown as ApiClient["catalog"],
    });

    const load1 = resource.load({ q: "", page: 1, size: 20 });
    const load2 = resource.load({ q: "str", page: 2, size: 20 });
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);

    const page2Data: PaginatedData<PackageModel> = {
      ...samplePackagesPage,
      page: 2,
      total: 25,
    };
    second.resolve(page2Data);
    await load2;

    first.resolve(samplePackagesPage);
    await load1;

    expect(resource.getSnapshot().phase).toBe("ready");
    expect(resource.getSnapshot().data?.page).toBe(2);

    resource.dispose();
  });

  it("refreshes 3 levels cleanly via getPackageLevels without resetting problems filters", async () => {
    const updatedDetail: PackageDetailModel = {
      ...samplePackageDetail,
      levels: [
        {
          ...samplePackageDetail.levels[0],
          solved: 1,
          completed: true,
          lockStatus: "completed",
          completionPercent: 100,
        },
        {
          ...samplePackageDetail.levels[1],
          unlocked: true,
          lockStatus: "in_progress",
        },
        samplePackageDetail.levels[2],
      ],
      solvedCount: 1,
      completionPercent: 33,
      highestUnlockedLevelNo: 2,
    };

    const getPackage = vi.fn().mockResolvedValue(samplePackageDetail);
    const getPackageLevels = vi.fn().mockResolvedValue(updatedDetail);
    const listTags = vi.fn().mockResolvedValue(sampleTags);
    const listProblems = vi.fn().mockResolvedValue(sampleProblemsPage);

    const resource = createPackageDetailResource(
      {
        catalog: {
          getPackage,
          getPackageLevels,
          listTags,
          listProblems,
        } as unknown as ApiClient["catalog"],
      },
      "arrays",
    );

    const initialFilter = parseProblemsSearchParams(
      new URLSearchParams("difficulty=medium&page=2"),
      { fixedPackageSlug: "arrays" },
    );

    await Promise.all([
      resource.loadPackageHeader(),
      resource.loadTags(),
      resource.loadProblems(initialFilter),
    ]);
    expect(getPackage).toHaveBeenCalledTimes(1);
    expect(resource.getSnapshot().packageDetail?.levels[1].unlocked).toBe(
      false,
    );

    // Filter changes reload ONLY listProblems, never refetch getPackage
    await resource.loadProblems(
      updateProblemsFilter(
        initialFilter,
        { difficulty: "hard" },
        { fixedPackageSlug: "arrays" },
      ),
    );
    expect(getPackage).toHaveBeenCalledTimes(1);
    expect(listProblems).toHaveBeenCalledTimes(2);

    // Explicit level refresh calls GET /packages/{slug}/levels
    await resource.refreshLevels(initialFilter);
    expect(getPackageLevels).toHaveBeenCalledWith(
      "arrays",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(resource.getSnapshot().packageDetail?.levels[1].unlocked).toBe(true);
    expect(resource.getSnapshot().levelsNotice).toContain("máy chủ");
  });

  it("handles 404 package, slug mismatch guard, refresh error preserving levels, and soft metadata failures on /problems", async () => {
    const wrongSlugResource = createPackageDetailResource(
      {
        catalog: {
          getPackage: vi.fn().mockResolvedValue(samplePackageDetail),
        } as unknown as ApiClient["catalog"],
      },
      "different-slug",
    );
    await wrongSlugResource.loadPackageHeader();
    expect(wrongSlugResource.getSnapshot().packagePhase).toBe("error");
    expect(wrongSlugResource.getSnapshot().packageError).toBeInstanceOf(
      ApiError,
    );
    expect(
      (wrongSlugResource.getSnapshot().packageError as ApiError).code,
    ).toBe("INVALID_CONTRACT_DATA");

    const getPackage = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(404, "NOT_FOUND"))
      .mockResolvedValueOnce(samplePackageDetail);
    const getPackageLevels = vi
      .fn()
      .mockRejectedValue(new ApiError(500, "INTERNAL_ERROR"));
    const listTags = vi.fn().mockRejectedValue(new Error("network"));
    const listProblems = vi.fn().mockResolvedValue(sampleProblemsPage);

    const pkgResource = createPackageDetailResource(
      {
        catalog: {
          getPackage,
          getPackageLevels,
          listTags,
          listProblems,
        } as unknown as ApiClient["catalog"],
      },
      "arrays",
    );

    await pkgResource.loadPackageHeader();
    expect(pkgResource.getSnapshot().packagePhase).toBe("error");
    expect(
      classifyCatalogError(pkgResource.getSnapshot().packageError, "package")
        .kind,
    ).toBe("not_found");

    // Second attempt succeeds header, then refreshLevels fails softly keeping 3 levels visible
    await pkgResource.loadPackageHeader();
    await pkgResource.refreshLevels();
    expect(pkgResource.getSnapshot().packagePhase).toBe("ready");
    expect(pkgResource.getSnapshot().packageDetail?.levels).toHaveLength(3);
    expect(pkgResource.getSnapshot().levelsError).toBeInstanceOf(ApiError);

    // /problems still loads main list even when tags or package dropdown metadata fail
    const problemsResource = createProblemsResource({
      catalog: {
        listTags,
        listPackages: vi
          .fn()
          .mockRejectedValue(new ApiError(503, "UPSTREAM_ERROR")),
        listProblems,
      } as unknown as ApiClient["catalog"],
    });

    await Promise.all([
      problemsResource.loadMetadata(),
      problemsResource.loadProblems(
        parseProblemsSearchParams(new URLSearchParams("")),
      ),
    ]);

    expect(problemsResource.getSnapshot().phase).toBe("ready");
    expect(problemsResource.getSnapshot().data?.items).toHaveLength(1);
    expect(problemsResource.getSnapshot().tagsError).toBeTruthy();
    expect(problemsResource.getSnapshot().packagesError).toBeInstanceOf(
      ApiError,
    );
  });

  it("enforces timeout via withDeadline on hung requests", async () => {
    const never = new Promise<PaginatedData<ProblemSummaryModel>>(() => {});
    const listProblems = vi.fn(() => never);
    const resource = createProblemsResource(
      {
        catalog: { listProblems } as unknown as ApiClient["catalog"],
      },
      15,
    );

    await resource.loadProblems(
      parseProblemsSearchParams(new URLSearchParams("")),
    );
    expect(resource.getSnapshot().phase).toBe("error");
    expect(resource.getSnapshot().error).toBeInstanceOf(ApiError);
    expect((resource.getSnapshot().error as ApiError).code).toBe(
      "REQUEST_TIMEOUT",
    );
  });
});

describe("catalog request race regressions", () => {
  it.each(["tags", "packages"])(
    "reports a %s timeout without losing the other metadata result",
    async (hung) => {
      const resource = createProblemsResource(
        {
          catalog: {
            listTags: () =>
              hung === "tags"
                ? new Promise(() => {})
                : Promise.resolve(sampleTags),
            listPackages: () =>
              hung === "packages"
                ? new Promise(() => {})
                : Promise.resolve(samplePackagesPage),
          } as unknown as ApiClient["catalog"],
        },
        15,
      );
      await resource.loadMetadata();
      const state = resource.getSnapshot();
      expect(
        hung === "tags" ? state.tagsError : state.packagesError,
      ).toMatchObject({ code: "REQUEST_TIMEOUT" });
      expect(hung === "tags" ? state.packages : state.tags).toEqual(
        hung === "tags" ? samplePackagesPage.items : sampleTags,
      );
      expect(
        hung === "tags" ? state.packagesError : state.tagsError,
      ).toBeNull();
    },
  );

  it("hides the previous list during navigation and ignores responses after disposal", async () => {
    const pending = deferred<PaginatedData<ProblemSummaryModel>>();
    const resource = createProblemsResource({
      catalog: {
        listProblems: vi
          .fn()
          .mockResolvedValueOnce(sampleProblemsPage)
          .mockReturnValueOnce(pending.promise),
      } as unknown as ApiClient["catalog"],
    });
    await resource.loadProblems(
      parseProblemsSearchParams(new URLSearchParams()),
    );
    const loading = resource.loadProblems(
      parseProblemsSearchParams(new URLSearchParams("q=new&page=2")),
    );
    expect(resource.getSnapshot()).toMatchObject({
      phase: "loading",
      data: null,
    });
    resource.dispose();
    const snapshot = resource.getSnapshot();
    pending.resolve(sampleProblemsPage);
    await loading;
    expect(resource.getSnapshot()).toBe(snapshot);
  });

  it("does not replay an old filter after a level refresh", async () => {
    const pending = deferred<PackageDetailModel>();
    const listProblems = vi.fn().mockResolvedValue(sampleProblemsPage);
    const resource = createPackageDetailResource(
      {
        catalog: {
          getPackageLevels: () => pending.promise,
          listProblems,
        } as unknown as ApiClient["catalog"],
      },
      "arrays",
    );
    const refresh = resource.refreshLevels(
      parseProblemsSearchParams(new URLSearchParams("difficulty=easy")),
    );
    await resource.loadProblems(
      parseProblemsSearchParams(new URLSearchParams("difficulty=hard")),
    );
    pending.resolve(samplePackageDetail);
    await refresh;
    expect(listProblems).toHaveBeenCalledTimes(1);
    expect(listProblems.mock.calls[0][0]).toMatchObject({
      difficulty: "hard",
      package: "arrays",
    });
  });

  it("ignores an older level response when reloading the package header", async () => {
    const pending = deferred<PackageDetailModel>();
    const resource = createPackageDetailResource(
      {
        catalog: {
          getPackage: () => Promise.resolve(samplePackageDetail),
          getPackageLevels: () => pending.promise,
        } as unknown as ApiClient["catalog"],
      },
      "arrays",
    );
    const refresh = resource.refreshLevels();
    await resource.loadPackageHeader();
    pending.resolve({ ...samplePackageDetail, completionPercent: 99 });
    await refresh;
    expect(resource.getSnapshot().packageDetail).toBe(samplePackageDetail);
    expect(resource.getSnapshot().refreshingLevels).toBe(false);
  });

  it.each([401, 404])(
    "clears package data and invalidates pending list work on level refresh HTTP %s",
    async (status) => {
      const pending = deferred<PaginatedData<ProblemSummaryModel>>();
      const resource = createPackageDetailResource(
        {
          catalog: {
            getPackage: () => Promise.resolve(samplePackageDetail),
            getPackageLevels: () =>
              Promise.reject(new ApiError(status, "UNAVAILABLE")),
            listProblems: vi
              .fn()
              .mockResolvedValueOnce(sampleProblemsPage)
              .mockReturnValueOnce(pending.promise),
          } as unknown as ApiClient["catalog"],
        },
        "arrays",
      );
      const query = parseProblemsSearchParams(new URLSearchParams());
      await resource.loadPackageHeader();
      await resource.loadProblems(query);
      const loading = resource.loadProblems(query);
      await resource.refreshLevels(query);
      pending.resolve(sampleProblemsPage);
      await loading;
      expect(resource.getSnapshot()).toMatchObject({
        packagePhase: "error",
        packageDetail: null,
        problemsPage: null,
        problemsRefreshing: false,
      });
    },
  );
});

describe("UI rendering coverage across all catalog states", () => {
  it("renders exact 3 server levels, locked vs open problems linking to /problems/[slug], loading, empty, error, and pagination", () => {
    const levelsMarkup = renderToStaticMarkup(
      createElement(PackageLevelsSection, {
        levels: samplePackageDetail.levels,
        activeDifficulty: "",
        refreshing: false,
        refreshError: "",
        refreshNotice: "",
        onRefreshLevels: () => {},
        onFilterByDifficulty: () => {},
      }),
    );
    expect(levelsMarkup).toContain("Cấp 1 · Dễ");
    expect(levelsMarkup).toContain("Cấp 2 · Trung bình");
    expect(levelsMarkup).toContain("Cấp 3 · Khó");
    expect(levelsMarkup).toContain("Đang mở");
    expect(levelsMarkup).toContain("Đang khóa");

    const openProblem = sampleProblemsPage.items[0];
    const lockedProblem: ProblemSummaryModel = {
      ...openProblem,
      id: UUID2,
      slug: "locked-two-sum",
      title: "Locked Two Sum",
      difficulty: "medium",
      unlocked: false,
      canOpen: false,
    };

    const listMarkup = renderToStaticMarkup(
      createElement(ProblemSummaryList, {
        problems: [openProblem, lockedProblem],
        showPackageLink: true,
      }),
    );
    expect(listMarkup).toContain('href="/problems/sum-two"');
    expect(listMarkup).toContain('href="/packages/arrays"');
    expect(listMarkup).not.toContain('href="/problems/locked-two-sum"');
    expect(listMarkup).toContain("Chưa mở khóa");
    expect(listMarkup).toContain("disabled");

    const packagesMarkup = renderToStaticMarkup(
      createElement(PackagesGrid, { packages: samplePackagesPage.items }),
    );
    expect(packagesMarkup).toContain('href="/packages/arrays"');
    expect(packagesMarkup).toContain("Arrays");

    const loadingMarkup = renderToStaticMarkup(
      createElement(CatalogLoadingState, { label: "Đang tải..." }),
    );
    expect(loadingMarkup).toContain("Đang tải...");

    const emptyMarkup = renderToStaticMarkup(
      createElement(CatalogEmptyPanel, {
        title: "Không có bài tập nào khớp bộ lọc",
        description: "Thử xóa bộ lọc",
        hasActiveFilters: true,
        onClearFilters: () => {},
      }),
    );
    expect(emptyMarkup).toContain("Xóa bộ lọc");

    const errorMarkup = renderToStaticMarkup(
      createElement(CatalogErrorPanel, {
        info: classifyCatalogError(
          new ApiError(500, "INTERNAL_ERROR"),
          "problems",
        ),
        onRetry: () => {},
      }),
    );
    expect(errorMarkup).toContain("Thử lại");

    const paginationMeta = computePaginationMeta(3, 10, 12, 0);
    expect(paginationMeta.isOutOfRange).toBe(true);
    expect(paginationMeta.fromItem).toBe(0);
    expect(paginationMeta.toItem).toBe(0);
    const paginationMarkup = renderToStaticMarkup(
      createElement(CatalogPaginationBar, {
        meta: paginationMeta,
        itemLabel: "bài tập",
        onChangePage: () => {},
        onChangeSize: () => {},
      }),
    );
    expect(paginationMarkup).toContain("vượt quá tổng số 2 trang");
    expect(paginationMarkup).toContain("Trang 3 / 2");

    // Stateless mock / stale slice returning 1 item on ?page=2&size=10 when total=1
    // must still guard fromItem/toItem cleanly (no "21–1") and retain size=10 option selection.
    const outOfRangeWithItems = computePaginationMeta(2, 10, 1, 1);
    expect(outOfRangeWithItems.isOutOfRange).toBe(true);
    expect(outOfRangeWithItems.fromItem).toBe(0);
    expect(outOfRangeWithItems.toItem).toBe(0);
    expect(outOfRangeWithItems.hasPrev).toBe(true);
    expect(outOfRangeWithItems.hasNext).toBe(false);
    const outOfRangeMarkup = renderToStaticMarkup(
      createElement(CatalogPaginationBar, {
        meta: outOfRangeWithItems,
        itemLabel: "bài tập",
        onChangePage: () => {},
        onChangeSize: () => {},
      }),
    );
    expect(outOfRangeMarkup).toContain("Trang 2 vượt quá tổng số 1 trang");
    expect(outOfRangeMarkup).not.toContain("21–1");
    expect(outOfRangeMarkup).toContain(
      '<option value="10" selected="">10</option>',
    );

    // Empty-slice within valid range still avoids impossible range text
    const emptyWithinRange = computePaginationMeta(1, 20, 5, 0);
    expect(emptyWithinRange.isOutOfRange).toBe(false);
    expect(emptyWithinRange.fromItem).toBe(0);
    expect(emptyWithinRange.toItem).toBe(0);
    const emptyWithinRangeMarkup = renderToStaticMarkup(
      createElement(CatalogPaginationBar, {
        meta: emptyWithinRange,
        itemLabel: "bài tập",
        onChangePage: () => {},
        onChangeSize: () => {},
      }),
    );
    expect(emptyWithinRangeMarkup).toContain("chưa có dữ liệu hiển thị");
  });
});
