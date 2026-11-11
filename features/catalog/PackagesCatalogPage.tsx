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
  PackagesGrid,
} from "@/features/catalog/CatalogSections";
import {
  buildPackagesHref,
  clearPackagesFilters,
  hasActivePackagesFilters,
  parsePackagesSearchParams,
  setPackagesPage,
  updatePackagesFilter,
  type PackagesQueryState,
} from "@/features/catalog/query";
import { createPackagesResource } from "@/features/catalog/resources";
import {
  classifyCatalogError,
  computePaginationMeta,
} from "@/features/catalog/viewModel";
import { useApiClient } from "@/lib/api/useApiClient";

function AuthenticatedPackagesBrowser() {
  const api = useApiClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const queryState = useMemo(
    () => parsePackagesSearchParams(new URLSearchParams(searchKey)),
    [searchKey],
  );
  const currentHref = useMemo(
    () => buildPackagesHref(queryState),
    [queryState],
  );

  const [resource] = useState(() => createPackagesResource(api));
  const state = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getServerSnapshot,
  );
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    void resource.load(queryState);
  }, [resource, queryState, reloadTick]);

  useEffect(() => () => resource.dispose(), [resource]);

  function navigateWithState(nextState: PackagesQueryState) {
    const nextHref = buildPackagesHref(nextState);
    if (nextHref === currentHref) {
      setReloadTick((tick) => tick + 1);
      return;
    }
    router.push(nextHref, { scroll: false });
  }

  const hasFilters = hasActivePackagesFilters(queryState);
  const paginationMeta = state.data
    ? computePaginationMeta(
        queryState.page,
        queryState.size,
        state.data.total,
        state.data.items.length,
      )
    : null;

  return (
    <main className="workspace-main catalog-main">
      <div className="catalog-topbar">
        <p className="breadcrumb muted">
          <Link href="/protected">← Tài khoản</Link> / Gói bài tập
        </p>
        <div className="catalog-nav-links">
          <Link href="/problems" className="btn-secondary-link">
            Kho bài tập & Bộ lọc →
          </Link>
        </div>
      </div>

      <header className="workspace-header">
        <div>
          <p className="eyebrow">Lộ trình học tập</p>
          <h1>Danh sách gói bài tập</h1>
        </div>
      </header>

      <CatalogSearchBar
        id="packages-search-q"
        label="Tìm kiếm gói bài"
        placeholder="Nhập tên hoặc từ khóa chủ đề (ví dụ: arrays)…"
        value={queryState.q}
        busy={state.refreshing}
        hasActiveFilters={hasFilters}
        onSubmitQuery={(nextQ) =>
          navigateWithState(updatePackagesFilter(queryState, { q: nextQ }))
        }
        onClearFilters={() =>
          navigateWithState(
            clearPackagesFilters(queryState, { keepSize: true }),
          )
        }
      />

      <section className="catalog-section" aria-label="Kết quả gói bài">
        {state.phase === "loading" && (
          <CatalogLoadingState label="Đang tải danh sách gói bài tập…" />
        )}

        {state.phase === "error" && (
          <CatalogErrorPanel
            info={classifyCatalogError(state.error, "packages")}
            onRetry={() => setReloadTick((tick) => tick + 1)}
            onResetFilters={() =>
              navigateWithState(clearPackagesFilters(queryState))
            }
          />
        )}

        {state.phase === "ready" && state.data && (
          <>
            {state.data.items.length === 0 ? (
              paginationMeta?.isOutOfRange ? (
                <CatalogPaginationBar
                  meta={paginationMeta}
                  itemLabel="gói bài"
                  busy={state.refreshing}
                  onChangePage={(nextPage) =>
                    navigateWithState(setPackagesPage(queryState, nextPage))
                  }
                  onChangeSize={(nextSize) =>
                    navigateWithState(
                      updatePackagesFilter(queryState, { size: nextSize }),
                    )
                  }
                />
              ) : (
                <CatalogEmptyPanel
                  title={
                    hasFilters
                      ? "Không tìm thấy gói bài khớp từ khóa"
                      : "Chưa có gói bài tập nào được xuất bản"
                  }
                  description={
                    hasFilters
                      ? `Không có gói bài nào phù hợp với "${queryState.q}". Bạn có thể xóa từ khóa để xem lại toàn bộ.`
                      : "Hệ thống chưa có gói bài xuất bản nào cho tài khoản này."
                  }
                  hasActiveFilters={hasFilters}
                  onClearFilters={() =>
                    navigateWithState(
                      clearPackagesFilters(queryState, { keepSize: true }),
                    )
                  }
                  action={
                    <Link href="/problems" className="btn-secondary-link">
                      Mở kho bài tập tổng hợp
                    </Link>
                  }
                />
              )
            ) : (
              <>
                <PackagesGrid packages={state.data.items} />
                {paginationMeta && (
                  <CatalogPaginationBar
                    meta={paginationMeta}
                    itemLabel="gói bài"
                    busy={state.refreshing}
                    onChangePage={(nextPage) =>
                      navigateWithState(setPackagesPage(queryState, nextPage))
                    }
                    onChangeSize={(nextSize) =>
                      navigateWithState(
                        updatePackagesFilter(queryState, { size: nextSize }),
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

export function PackagesCatalogPage() {
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
        <p className="muted">Cần đăng nhập để xem danh sách gói bài.</p>
      </main>
    );
  }

  return <AuthenticatedPackagesBrowser key={user.id} />;
}
