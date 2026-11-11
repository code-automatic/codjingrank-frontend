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
import { createProblemsResource } from "@/features/catalog/resources";
import {
  classifyCatalogError,
  computePaginationMeta,
} from "@/features/catalog/viewModel";
import { errorText } from "@/lib/api/client";
import { useApiClient } from "@/lib/api/useApiClient";

function AuthenticatedProblemsDirectory() {
  const api = useApiClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const queryState = useMemo(
    () => parseProblemsSearchParams(new URLSearchParams(searchKey)),
    [searchKey],
  );
  const currentHref = useMemo(
    () => buildProblemsHref(queryState),
    [queryState],
  );

  const [resource] = useState(() => createProblemsResource(api));
  const state = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getServerSnapshot,
  );
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    void resource.loadMetadata();
  }, [resource]);

  useEffect(() => {
    void resource.loadProblems(queryState);
  }, [resource, queryState, reloadTick]);

  useEffect(() => () => resource.dispose(), [resource]);

  function navigateWithState(nextState: ProblemsQueryState) {
    const nextHref = buildProblemsHref(nextState);
    if (nextHref === currentHref) {
      setReloadTick((tick) => tick + 1);
      return;
    }
    router.push(nextHref, { scroll: false });
  }

  const hasFilters = hasActiveProblemFilters(queryState);
  const paginationMeta = state.data
    ? computePaginationMeta(
        queryState.page,
        queryState.size,
        state.data.total,
        state.data.items.length,
      )
    : null;

  const hasSelectedPackageOption =
    !queryState.package ||
    state.packages.some((pkg) => pkg.slug === queryState.package);
  const hasSelectedTagOption =
    !queryState.tag || state.tags.some((t) => t.slug === queryState.tag);

  return (
    <main className="workspace-main catalog-main">
      <div className="catalog-topbar">
        <p className="breadcrumb muted">
          <Link href="/protected">← Tài khoản</Link> / Kho bài tập
        </p>
        <div className="catalog-nav-links">
          <Link href="/packages" className="btn-secondary-link">
            Xem theo Gói bài →
          </Link>
        </div>
      </div>

      <header className="workspace-header">
        <div>
          <p className="eyebrow">Bộ lọc bài tập</p>
          <h1>Kho bài tập luyện tập</h1>
        </div>
      </header>

      <CatalogSearchBar
        id="problems-search-q"
        label="Tìm kiếm bài tập"
        placeholder="Nhập tên hoặc từ khóa bài tập…"
        value={queryState.q}
        busy={state.refreshing}
        hasActiveFilters={hasFilters}
        onSubmitQuery={(nextQ) =>
          navigateWithState(updateProblemsFilter(queryState, { q: nextQ }))
        }
        onClearFilters={() =>
          navigateWithState(
            clearProblemsFilters(queryState, { keepSize: true }),
          )
        }
      >
        <div className="field">
          <label htmlFor="problems-filter-package">Gói bài</label>
          <select
            id="problems-filter-package"
            value={queryState.package}
            onChange={(event) =>
              navigateWithState(
                updateProblemsFilter(queryState, {
                  package: parseSlugFilterParam(event.target.value),
                }),
              )
            }
          >
            <option value="">Tất cả gói bài</option>
            {!hasSelectedPackageOption && (
              <option value={queryState.package}>{queryState.package}</option>
            )}
            {state.packages.map((pkg) => (
              <option key={pkg.id} value={pkg.slug}>
                {pkg.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="problems-filter-difficulty">Độ khó</label>
          <select
            id="problems-filter-difficulty"
            value={queryState.difficulty}
            onChange={(event) =>
              navigateWithState(
                updateProblemsFilter(queryState, {
                  difficulty: parseDifficultyParam(event.target.value),
                }),
              )
            }
          >
            <option value="">Tất cả độ khó</option>
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="problems-filter-tag">Thẻ chủ đề</label>
          <select
            id="problems-filter-tag"
            value={queryState.tag}
            onChange={(event) =>
              navigateWithState(
                updateProblemsFilter(queryState, {
                  tag: parseSlugFilterParam(event.target.value),
                }),
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
          <label htmlFor="problems-filter-solved">Trạng thái giải</label>
          <select
            id="problems-filter-solved"
            value={queryState.solved}
            onChange={(event) =>
              navigateWithState(
                updateProblemsFilter(queryState, {
                  solved: parseSolvedParam(event.target.value),
                }),
              )
            }
          >
            <option value="">Tất cả trạng thái</option>
            <option value="false">Chưa giải</option>
            <option value="true">Đã giải</option>
          </select>
        </div>
      </CatalogSearchBar>

      {(Boolean(state.tagsError) || Boolean(state.packagesError)) && (
        <p className="muted catalog-soft-note" role="status">
          Không tải đủ tùy chọn gói/thẻ (
          {errorText(state.tagsError || state.packagesError)}).{" "}
          <button
            type="button"
            className="button-secondary pagination-inline-btn"
            onClick={() => void resource.loadMetadata()}
          >
            Tải lại bộ lọc
          </button>
        </p>
      )}

      <section
        className="catalog-section"
        aria-label="Kết quả danh sách bài tập"
      >
        {state.phase === "loading" && (
          <CatalogLoadingState label="Đang tải danh sách bài tập…" />
        )}

        {state.phase === "error" && (
          <CatalogErrorPanel
            info={classifyCatalogError(state.error, "problems")}
            onRetry={() => setReloadTick((tick) => tick + 1)}
            onResetFilters={() =>
              navigateWithState(clearProblemsFilters(queryState))
            }
          />
        )}

        {state.phase === "ready" && state.data && (
          <>
            {state.data.items.length === 0 ? (
              paginationMeta?.isOutOfRange ? (
                <CatalogPaginationBar
                  meta={paginationMeta}
                  itemLabel="bài tập"
                  busy={state.refreshing}
                  onChangePage={(nextPage) =>
                    navigateWithState(setProblemsPage(queryState, nextPage))
                  }
                  onChangeSize={(nextSize) =>
                    navigateWithState(
                      updateProblemsFilter(queryState, { size: nextSize }),
                    )
                  }
                />
              ) : (
                <CatalogEmptyPanel
                  title={
                    hasFilters
                      ? "Không có bài tập nào khớp bộ lọc"
                      : "Chưa có bài tập nào được xuất bản"
                  }
                  description={
                    hasFilters
                      ? "Thử xóa bớt bộ lọc hiện tại hoặc đổi từ khóa tìm kiếm."
                      : "Hệ thống chưa có bài tập xuất bản nào."
                  }
                  hasActiveFilters={hasFilters}
                  onClearFilters={() =>
                    navigateWithState(
                      clearProblemsFilters(queryState, { keepSize: true }),
                    )
                  }
                  action={
                    <Link href="/packages" className="btn-secondary-link">
                      Xem theo gói bài
                    </Link>
                  }
                />
              )
            ) : (
              <>
                <ProblemSummaryList
                  problems={state.data.items}
                  showPackageLink={true}
                />
                {paginationMeta && (
                  <CatalogPaginationBar
                    meta={paginationMeta}
                    itemLabel="bài tập"
                    busy={state.refreshing}
                    onChangePage={(nextPage) =>
                      navigateWithState(setProblemsPage(queryState, nextPage))
                    }
                    onChangeSize={(nextSize) =>
                      navigateWithState(
                        updateProblemsFilter(queryState, { size: nextSize }),
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

export function ProblemsDirectoryPage() {
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
        <p className="muted">Cần đăng nhập để xem kho bài tập.</p>
      </main>
    );
  }

  return <AuthenticatedProblemsDirectory key={user.id} />;
}
