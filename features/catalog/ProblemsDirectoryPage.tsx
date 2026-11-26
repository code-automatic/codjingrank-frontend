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
import { FilterSelect } from "@/lib/ui/FilterSelect";
import { ProblemTable } from "@/features/platform/ProblemTable";

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
          <h1>Kho bài tập luyện tập</h1>
        </div>
      </header>

      {state.tags.length > 0 && (
        <nav
          className="platform-topic-chips"
          aria-label="Lọc nhanh theo chủ đề"
        >
          <button
            aria-pressed={!queryState.tag}
            onClick={() =>
              navigateWithState(updateProblemsFilter(queryState, { tag: "" }))
            }
          >
            Tất cả chủ đề
          </button>
          {state.tags.map((tag) => (
            <button
              key={tag.id}
              aria-pressed={queryState.tag === tag.slug}
              onClick={() =>
                navigateWithState(
                  updateProblemsFilter(queryState, { tag: tag.slug }),
                )
              }
            >
              {tag.name}
            </button>
          ))}
        </nav>
      )}

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
          <span>Gói bài</span>
          <FilterSelect
            label="Gói bài"
            value={queryState.package}
            options={[
              { value: "", label: "Tất cả gói bài" },
              ...(!hasSelectedPackageOption
                ? [{ value: queryState.package, label: queryState.package }]
                : []),
              ...state.packages.map((pkg) => ({
                value: pkg.slug,
                label: pkg.name,
              })),
            ]}
            onChange={(value) =>
              navigateWithState(
                updateProblemsFilter(queryState, {
                  package: parseSlugFilterParam(value),
                }),
              )
            }
          />
        </div>
        <div className="field">
          <span>Độ khó</span>
          <FilterSelect
            label="Độ khó"
            value={queryState.difficulty}
            options={[
              { value: "", label: "Tất cả độ khó" },
              { value: "easy", label: "Dễ" },
              { value: "medium", label: "Trung bình" },
              { value: "hard", label: "Khó" },
            ]}
            onChange={(value) =>
              navigateWithState(
                updateProblemsFilter(queryState, {
                  difficulty: parseDifficultyParam(value),
                }),
              )
            }
          />
        </div>
        <div className="field">
          <span>Thẻ chủ đề</span>
          <FilterSelect
            label="Thẻ chủ đề"
            value={queryState.tag}
            options={[
              { value: "", label: "Tất cả thẻ" },
              ...(!hasSelectedTagOption
                ? [{ value: queryState.tag, label: queryState.tag }]
                : []),
              ...state.tags.map((tag) => ({
                value: tag.slug,
                label: tag.name,
              })),
            ]}
            onChange={(value) =>
              navigateWithState(
                updateProblemsFilter(queryState, {
                  tag: parseSlugFilterParam(value),
                }),
              )
            }
          />
        </div>
        <div className="field">
          <span>Trạng thái giải</span>
          <FilterSelect
            label="Trạng thái giải"
            value={queryState.solved}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "false", label: "Chưa giải" },
              { value: "true", label: "Đã giải" },
            ]}
            onChange={(value) =>
              navigateWithState(
                updateProblemsFilter(queryState, {
                  solved: parseSolvedParam(value),
                }),
              )
            }
          />
        </div>
        <button
          type="button"
          className="button-secondary catalog-clear-filters"
          disabled={!hasFilters || state.refreshing}
          onClick={() =>
            navigateWithState(
              clearProblemsFilters(queryState, { keepSize: true }),
            )
          }
        >
          Xóa lọc
        </button>
      </CatalogSearchBar>

      {state.packagesTotal > state.packages.length && (
        <p className="muted catalog-soft-note">
          Bộ lọc đang gợi ý {state.packages.length}/{state.packagesTotal} gói
          đầu tiên.{" "}
          <Link href="/packages">Tìm thêm gói trong danh sách gói bài</Link>.
          Chọn gói tại đó để xem đầy đủ bài trong gói.
        </p>
      )}

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
                <ProblemTable problems={state.data.items} />
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
