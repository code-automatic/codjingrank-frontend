"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { useSession } from "@/features/auth/session";
import {
  CatalogEmptyPanel,
  CatalogErrorPanel,
  CatalogLoadingState,
  CatalogPaginationBar,
  CatalogSearchBar,
  PackageLevelsSection,
  ProblemSummaryList,
} from "@/features/catalog/CatalogSections";
import {
  buildProblemsHref,
  clearProblemsFilters,
  hasActiveProblemFilters,
  parseDifficultyParam,
  parseProblemsSearchParams,
  parseSlugFilterParam,
  parseSolvedParam,
  setProblemsPage,
  updateProblemsFilter,
  type ProblemsQueryState,
} from "@/features/catalog/query";
import { createPackageDetailResource } from "@/features/catalog/resources";
import {
  classifyCatalogError,
  computePaginationMeta,
} from "@/features/catalog/viewModel";
import { errorText } from "@/lib/api/client";
import { useApiClient } from "@/lib/api/useApiClient";

function AuthenticatedPackageDetail({ slug }: { slug: string }) {
  const api = useApiClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const queryOptions = useMemo(() => ({ fixedPackageSlug: slug }), [slug]);
  const queryState = useMemo(
    () =>
      parseProblemsSearchParams(new URLSearchParams(searchKey), queryOptions),
    [searchKey, queryOptions],
  );
  const currentHref = useMemo(
    () => buildProblemsHref(queryState, queryOptions),
    [queryState, queryOptions],
  );

  const [resource] = useState(() => createPackageDetailResource(api, slug));
  const state = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getServerSnapshot,
  );
  const [headerReloadTick, setHeaderReloadTick] = useState(0);
  const [problemsReloadTick, setProblemsReloadTick] = useState(0);

  useEffect(() => {
    void resource.loadPackageHeader();
    void resource.loadTags();
  }, [resource, headerReloadTick]);

  useEffect(() => {
    void resource.loadProblems(queryState);
  }, [resource, queryState, problemsReloadTick]);

  useEffect(() => () => resource.dispose(), [resource]);

  function navigateWithState(nextState: ProblemsQueryState) {
    const nextHref = buildProblemsHref(nextState, queryOptions);
    if (nextHref === currentHref) {
      setProblemsReloadTick((tick) => tick + 1);
      return;
    }
    router.push(nextHref, { scroll: false });
  }

  const hasFilters = hasActiveProblemFilters(queryState, queryOptions);
  const paginationMeta = state.problemsPage
    ? computePaginationMeta(
        queryState.page,
        queryState.size,
        state.problemsPage.total,
        state.problemsPage.items.length,
      )
    : null;

  const hasSelectedTagOption =
    !queryState.tag || state.tags.some((t) => t.slug === queryState.tag);

  if (state.packagePhase === "loading") {
    return (
      <main className="workspace-main catalog-main">
        <div className="catalog-topbar">
          <p className="breadcrumb muted">
            <Link href="/packages">← Danh sách gói bài</Link>
          </p>
        </div>
        <CatalogLoadingState label="Đang tải thông tin gói bài và 3 cấp độ…" />
      </main>
    );
  }

  if (state.packagePhase === "error" || !state.packageDetail) {
    return (
      <main className="workspace-main catalog-main">
        <div className="catalog-topbar">
          <p className="breadcrumb muted">
            <Link href="/packages">← Danh sách gói bài</Link>
          </p>
        </div>
        <CatalogErrorPanel
          info={classifyCatalogError(state.packageError, "package")}
          onRetry={() => {
            setHeaderReloadTick((tick) => tick + 1);
            setProblemsReloadTick((tick) => tick + 1);
          }}
          secondaryAction={
            <Link href="/packages" className="btn-secondary-link">
              Về danh sách gói
            </Link>
          }
        />
      </main>
    );
  }

  const detail = state.packageDetail;

  return (
    <main className="workspace-main catalog-main">
      <div className="catalog-topbar">
        <p className="breadcrumb muted">
          <Link href="/protected">Tài khoản</Link> /{" "}
          <Link href="/packages">Gói bài</Link> / {detail.package.name}
        </p>
        <div className="catalog-nav-links">
          <Link href="/problems" className="btn-secondary-link">
            Kho bài tổng hợp →
          </Link>
        </div>
      </div>

      <header className="workspace-header">
        <div>
          <p className="eyebrow">Gói bài · {detail.package.slug}</p>
          <h1>{detail.package.name}</h1>
          {detail.package.description && (
            <p className="muted catalog-section-note">
              {detail.package.description}
            </p>
          )}
        </div>
        <ul className="badges" aria-label="Tổng quan gói bài">
          <li>
            Tiến độ: {detail.solvedCount}/{detail.totalCount} bài (
            {detail.completionPercent}%)
          </li>
          {detail.allCompleted && (
            <li className="badge-solved">Hoàn thành cả 3 cấp</li>
          )}
        </ul>
      </header>

      <PackageLevelsSection
        levels={detail.levels}
        activeDifficulty={queryState.difficulty}
        refreshing={state.refreshingLevels}
        refreshError={state.levelsError ? errorText(state.levelsError) : ""}
        refreshNotice={state.levelsNotice}
        onRefreshLevels={() => void resource.refreshLevels(queryState)}
        onFilterByDifficulty={(nextDifficulty) =>
          navigateWithState(
            updateProblemsFilter(
              queryState,
              { difficulty: nextDifficulty },
              queryOptions,
            ),
          )
        }
      />

      <section
        className="catalog-section"
        aria-labelledby="package-problems-heading"
      >
        <div className="catalog-section-head">
          <div>
            <h2 id="package-problems-heading">Bài tập trong gói</h2>
            <p className="muted catalog-section-note">
              Bộ lọc và trang hiện tại được lưu trên URL. Đổi bộ lọc sẽ đưa về
              trang 1.
            </p>
          </div>
        </div>

        <CatalogSearchBar
          id="package-problems-q"
          label="Tìm tên bài trong gói"
          placeholder="Nhập tên hoặc từ khóa bài tập…"
          value={queryState.q}
          busy={state.problemsRefreshing}
          hasActiveFilters={hasFilters}
          onSubmitQuery={(nextQ) =>
            navigateWithState(
              updateProblemsFilter(queryState, { q: nextQ }, queryOptions),
            )
          }
          onClearFilters={() =>
            navigateWithState(
              clearProblemsFilters(queryState, {
                ...queryOptions,
                keepSize: true,
              }),
            )
          }
        >
          <div className="field">
            <label htmlFor="package-problems-difficulty">Độ khó / Cấp</label>
            <select
              id="package-problems-difficulty"
              value={queryState.difficulty}
              onChange={(event) =>
                navigateWithState(
                  updateProblemsFilter(
                    queryState,
                    { difficulty: parseDifficultyParam(event.target.value) },
                    queryOptions,
                  ),
                )
              }
            >
              <option value="">Tất cả độ khó</option>
              <option value="easy">Dễ (Cấp 1)</option>
              <option value="medium">Trung bình (Cấp 2)</option>
              <option value="hard">Khó (Cấp 3)</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="package-problems-tag">Thẻ chủ đề</label>
            <select
              id="package-problems-tag"
              value={queryState.tag}
              onChange={(event) =>
                navigateWithState(
                  updateProblemsFilter(
                    queryState,
                    { tag: parseSlugFilterParam(event.target.value) },
                    queryOptions,
                  ),
                )
              }
            >
              <option value="">Tất cả thẻ</option>
              {!hasSelectedTagOption && (
                <option value={queryState.tag}>{queryState.tag}</option>
              )}
              {state.tags.map((tag) => (
                <option key={tag.id} value={tag.slug}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="package-problems-solved">Trạng thái giải</label>
            <select
              id="package-problems-solved"
              value={queryState.solved}
              onChange={(event) =>
                navigateWithState(
                  updateProblemsFilter(
                    queryState,
                    { solved: parseSolvedParam(event.target.value) },
                    queryOptions,
                  ),
                )
              }
            >
              <option value="">Tất cả trạng thái</option>
              <option value="false">Chưa giải</option>
              <option value="true">Đã giải</option>
            </select>
          </div>
        </CatalogSearchBar>

        {Boolean(state.tagsError) && (
          <p className="muted catalog-soft-note" role="status">
            Không tải được danh sách thẻ gợi ý ({errorText(state.tagsError)}).{" "}
            <button
              type="button"
              className="button-secondary pagination-inline-btn"
              onClick={() => void resource.loadTags()}
            >
              Tải lại thẻ
            </button>
          </p>
        )}

        {state.problemsPhase === "loading" && (
          <CatalogLoadingState label="Đang tải danh sách bài tập trong gói…" />
        )}

        {state.problemsPhase === "error" && (
          <CatalogErrorPanel
            info={classifyCatalogError(state.problemsError, "problems")}
            onRetry={() => setProblemsReloadTick((tick) => tick + 1)}
            onResetFilters={() =>
              navigateWithState(clearProblemsFilters(queryState, queryOptions))
            }
          />
        )}

        {state.problemsPhase === "ready" && state.problemsPage && (
          <>
            {state.problemsPage.items.length === 0 ? (
              paginationMeta?.isOutOfRange ? (
                <CatalogPaginationBar
                  meta={paginationMeta}
                  itemLabel="bài tập"
                  busy={state.problemsRefreshing}
                  onChangePage={(nextPage) =>
                    navigateWithState(setProblemsPage(queryState, nextPage))
                  }
                  onChangeSize={(nextSize) =>
                    navigateWithState(
                      updateProblemsFilter(
                        queryState,
                        { size: nextSize },
                        queryOptions,
                      ),
                    )
                  }
                />
              ) : (
                <CatalogEmptyPanel
                  title={
                    hasFilters
                      ? "Không có bài tập phù hợp với bộ lọc"
                      : "Gói này chưa có bài tập nào được xuất bản"
                  }
                  description={
                    hasFilters
                      ? "Hãy thử bỏ bớt điều kiện lọc để xem tất cả bài hiện có trong gói."
                      : "Các bài tập mới sau khi xuất bản sẽ hiển thị tại đây."
                  }
                  hasActiveFilters={hasFilters}
                  onClearFilters={() =>
                    navigateWithState(
                      clearProblemsFilters(queryState, {
                        ...queryOptions,
                        keepSize: true,
                      }),
                    )
                  }
                />
              )
            ) : (
              <>
                <ProblemSummaryList
                  problems={state.problemsPage.items}
                  showPackageLink={false}
                />
                {paginationMeta && (
                  <CatalogPaginationBar
                    meta={paginationMeta}
                    itemLabel="bài tập"
                    busy={state.problemsRefreshing}
                    onChangePage={(nextPage) =>
                      navigateWithState(setProblemsPage(queryState, nextPage))
                    }
                    onChangeSize={(nextSize) =>
                      navigateWithState(
                        updateProblemsFilter(
                          queryState,
                          { size: nextSize },
                          queryOptions,
                        ),
                      )
                    }
                  />
                )}
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export function PackageDetailPage({ slug }: { slug: string }) {
  const router = useRouter();
  const { status, user } = useSession();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status === "initializing") {
    return (
      <main className="workspace-main catalog-main">
        <SessionNotice />
      </main>
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <main className="workspace-main catalog-main">
        <SessionNotice />
        <p className="muted">Cần đăng nhập để xem chi tiết gói bài.</p>
      </main>
    );
  }

  return <AuthenticatedPackageDetail key={`${user.id}:${slug}`} slug={slug} />;
}
