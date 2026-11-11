"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import {
  describeLevelCard,
  describeProblemItem,
  type CatalogErrorInfo,
  type PaginationMeta,
} from "@/features/catalog/viewModel";
import { buildSizeSelectOptions } from "@/features/catalog/query";
import type {
  LevelProgressModel,
  PackageModel,
  ProblemSummaryModel,
} from "@/lib/api/adapters/catalog";
import type { LevelDifficulty } from "@/lib/api/types";

export function CatalogLoadingState({ label }: { label: string }) {
  return (
    <p className="status-line" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </p>
  );
}

export function CatalogErrorPanel({
  info,
  onRetry,
  onResetFilters,
  secondaryAction,
}: {
  info: CatalogErrorInfo;
  onRetry?: () => void;
  onResetFilters?: () => void;
  secondaryAction?: ReactNode;
}) {
  return (
    <div className="panel error-panel" role="alert">
      <h2>{info.title}</h2>
      <p>{info.message}</p>
      <div className="actions catalog-actions">
        {info.kind === "unauthorized" ? (
          <Link href="/login" className="btn-primary-link">
            Đăng nhập lại
          </Link>
        ) : (
          info.canRetry &&
          onRetry && (
            <button type="button" onClick={onRetry}>
              Thử lại
            </button>
          )
        )}
        {info.canResetFilters && onResetFilters && (
          <button
            type="button"
            className="button-secondary"
            onClick={onResetFilters}
          >
            Xóa bộ lọc về mặc định
          </button>
        )}
        {secondaryAction}
      </div>
    </div>
  );
}

export function CatalogEmptyPanel({
  title,
  description,
  hasActiveFilters,
  onClearFilters,
  action,
}: {
  title: string;
  description: string;
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="panel catalog-empty" role="status">
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      <div className="actions catalog-actions">
        {hasActiveFilters && onClearFilters && (
          <button type="button" onClick={onClearFilters}>
            Xóa bộ lọc
          </button>
        )}
        {action}
      </div>
    </div>
  );
}

export function CatalogSearchBar({
  id,
  label,
  placeholder,
  value,
  busy,
  hasActiveFilters,
  onSubmitQuery,
  onClearFilters,
  children,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  busy?: boolean;
  hasActiveFilters: boolean;
  onSubmitQuery: (nextQuery: string) => void;
  onClearFilters: () => void;
  children?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <form
      className="panel catalog-filter-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmitQuery(inputRef.current?.value ?? "");
      }}
      aria-label={label}
    >
      <div className="catalog-filter-grid">
        <div className="field catalog-field-search">
          <label htmlFor={id}>{label}</label>
          <input
            ref={inputRef}
            id={id}
            name="q"
            type="search"
            defaultValue={value}
            placeholder={placeholder}
          />
        </div>
        {children}
      </div>

      <div className="catalog-filter-footer">
        <div className="actions catalog-actions">
          <button type="submit" disabled={busy}>
            Tìm / Áp dụng
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              className="button-secondary"
              disabled={busy}
              onClick={() => {
                if (inputRef.current) inputRef.current.value = "";
                onClearFilters();
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
        {busy && (
          <p className="muted catalog-inline-status" role="status">
            <span className="spinner" aria-hidden="true" />
            Đang cập nhật kết quả…
          </p>
        )}
      </div>
    </form>
  );
}

export function PackagesGrid({ packages }: { packages: PackageModel[] }) {
  return (
    <ul className="package-grid">
      {packages.map((pkg) => (
        <li key={pkg.id} className="panel package-card">
          <div className="package-card-body">
            <span className="eyebrow">Gói #{pkg.displayOrder + 1}</span>
            <h2 className="package-card-title">{pkg.name}</h2>
            <p className="muted package-card-desc">
              {pkg.description?.trim()
                ? pkg.description
                : "Lộ trình luyện tập 3 cấp độ theo chủ đề."}
            </p>
          </div>
          <div className="package-card-footer">
            <span className="catalog-badge catalog-badge--neutral">
              {pkg.totalProblems} bài tập
            </span>
            <Link
              href={`/packages/${pkg.slug}`}
              className="btn-primary-link"
              aria-label={`Xem 3 cấp độ của gói ${pkg.name}`}
            >
              Xem 3 cấp độ →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PackageLevelsSection({
  levels,
  activeDifficulty,
  refreshing,
  refreshError,
  refreshNotice,
  onRefreshLevels,
  onFilterByDifficulty,
}: {
  levels: LevelProgressModel[];
  activeDifficulty: LevelDifficulty | "";
  refreshing: boolean;
  refreshError: string;
  refreshNotice: string;
  onRefreshLevels: () => void;
  onFilterByDifficulty: (difficulty: LevelDifficulty | "") => void;
}) {
  return (
    <section
      className="catalog-section"
      aria-labelledby="package-levels-heading"
    >
      <div className="catalog-section-head">
        <div>
          <h2 id="package-levels-heading">Tiến độ 3 cấp độ trong gói</h2>
          <p className="muted catalog-section-note">
            Trạng thái mở khóa và hoàn thành được tính trực tiếp từ máy chủ.
          </p>
        </div>
        <button
          type="button"
          className="button-secondary"
          disabled={refreshing}
          onClick={onRefreshLevels}
        >
          {refreshing ? "Đang cập nhật…" : "↻ Cập nhật tiến độ cấp"}
        </button>
      </div>

      {refreshError && (
        <p className="error" role="alert">
          {refreshError}
        </p>
      )}
      {!refreshError && refreshNotice && (
        <p className="notice" role="status">
          {refreshNotice}
        </p>
      )}

      <div className="levels-grid">
        {levels.map((level) => {
          const info = describeLevelCard(level);
          const isSelected = activeDifficulty === level.difficulty;
          return (
            <article
              key={level.id}
              className={`panel level-card level-card--${info.statusTone}${isSelected ? " level-card--active" : ""}`}
            >
              <div className="level-card-top">
                <span className="eyebrow">
                  Cấp {info.levelNo} · {info.difficultyLabel}
                </span>
                <span
                  className={`catalog-badge catalog-badge--${info.statusTone}`}
                >
                  {info.statusTone === "locked"
                    ? `🔒 ${info.statusLabel}`
                    : info.statusTone === "completed"
                      ? `✓ ${info.statusLabel}`
                      : info.statusLabel}
                </span>
              </div>

              <h3 className="level-card-title">{info.name}</h3>

              <div className="level-progress-row">
                <span>Tiến độ</span>
                <strong>{info.progressText}</strong>
              </div>
              <div
                className="level-progress-track"
                role="progressbar"
                aria-label={`Tiến độ ${info.name}`}
                aria-valuemin={0}
                aria-valuemax={Math.max(1, info.total)}
                aria-valuenow={
                  info.total === 0 ? 1 : Math.min(info.solved, info.total)
                }
                aria-valuetext={`${info.progressText} (${info.completionPercent}%)`}
              >
                <div
                  className={`level-progress-fill level-progress-fill--${info.statusTone}`}
                  style={{ width: `${info.completionPercent}%` }}
                />
              </div>

              <p className="muted level-helper">{info.helperText}</p>

              <button
                type="button"
                className={isSelected ? "" : "button-secondary"}
                aria-pressed={isSelected}
                onClick={() =>
                  onFilterByDifficulty(isSelected ? "" : level.difficulty)
                }
              >
                {isSelected
                  ? `Đang lọc ${info.difficultyLabel} · Bỏ lọc`
                  : `Lọc bài ${info.difficultyLabel}`}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ProblemSummaryList({
  problems,
  showPackageLink,
}: {
  problems: ProblemSummaryModel[];
  showPackageLink: boolean;
}) {
  return (
    <ul className="problem-list">
      {problems.map((problem) => {
        const view = describeProblemItem(problem);
        return (
          <li
            key={problem.id}
            className={`panel problem-row${view.isLocked ? " problem-row--locked" : ""}`}
          >
            <div className="problem-row-main">
              <div className="problem-row-badges">
                <span className="catalog-badge catalog-badge--neutral">
                  {view.difficultyLabel}
                </span>
                <span
                  className={`catalog-badge ${
                    problem.solved
                      ? "catalog-badge--completed"
                      : "catalog-badge--neutral"
                  }`}
                >
                  {problem.solved ? `✓ ${view.solvedLabel}` : view.solvedLabel}
                </span>
                <span
                  className={`catalog-badge ${
                    view.isLocked
                      ? "catalog-badge--locked"
                      : "catalog-badge--open"
                  }`}
                >
                  {view.isLocked ? `🔒 ${view.unlockLabel}` : view.unlockLabel}
                </span>
                {showPackageLink && (
                  <Link
                    href={`/packages/${problem.packageSlug}`}
                    className="catalog-package-pill"
                  >
                    Gói: {problem.packageSlug}
                  </Link>
                )}
              </div>

              <h3 className="problem-row-title">{problem.title}</h3>

              <div className="problem-row-meta">
                <span className="muted">
                  Tỉ lệ Accepted:{" "}
                  <strong>{problem.formattedAcceptanceRate}</strong>
                </span>
                {problem.tags.length > 0 && (
                  <ul className="tags catalog-tags" aria-label="Thẻ bài tập">
                    {problem.tags.map((tag) => (
                      <li key={tag.id}>{tag.name}</li>
                    ))}
                  </ul>
                )}
              </div>

              {view.lockReason && (
                <p className="muted problem-lock-note">{view.lockReason}</p>
              )}
            </div>

            <div className="problem-row-action">
              {view.openHref ? (
                <Link
                  href={view.openHref}
                  className="btn-primary-link"
                  aria-label={`Mở bài ${problem.title}`}
                >
                  {view.actionLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  className="button-secondary button-locked"
                  disabled
                  aria-label={`${problem.title} — ${view.actionLabel}`}
                >
                  🔒 {view.actionLabel}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function CatalogPaginationBar({
  meta,
  itemLabel,
  busy,
  onChangePage,
  onChangeSize,
}: {
  meta: PaginationMeta;
  itemLabel: string;
  busy?: boolean;
  onChangePage: (nextPage: number) => void;
  onChangeSize: (nextSize: number) => void;
}) {
  const sizeOptions = buildSizeSelectOptions(meta.size);
  const sizeSelectId = `page-size-${itemLabel.replace(/\s+/g, "-")}`;

  return (
    <div className="panel pagination-bar">
      <div className="pagination-summary">
        {meta.total === 0 ? (
          <span>Không có {itemLabel} nào.</span>
        ) : meta.isOutOfRange ? (
          <span>
            Trang {meta.page} vượt quá tổng số {meta.totalPages} trang (tổng{" "}
            {meta.total} {itemLabel}).{" "}
            <button
              type="button"
              className="button-secondary pagination-inline-btn"
              onClick={() => onChangePage(meta.totalPages)}
            >
              Về trang {meta.totalPages}
            </button>
          </span>
        ) : meta.currentCount === 0 ? (
          <span>
            Trang {meta.page} hiện chưa có dữ liệu hiển thị (tổng {meta.total}{" "}
            {itemLabel}).{" "}
            {meta.hasPrev && (
              <button
                type="button"
                className="button-secondary pagination-inline-btn"
                onClick={() => onChangePage(1)}
              >
                Về trang 1
              </button>
            )}
          </span>
        ) : (
          <span>
            Hiển thị{" "}
            <strong>
              {meta.fromItem}–{meta.toItem}
            </strong>{" "}
            trên tổng <strong>{meta.total}</strong> {itemLabel}
          </span>
        )}
      </div>

      <div className="pagination-controls">
        <label htmlFor={sizeSelectId} className="pagination-size-label">
          Mỗi trang
        </label>
        <select
          id={sizeSelectId}
          className="pagination-size-select"
          value={String(meta.size)}
          disabled={busy}
          onChange={(event) => onChangeSize(Number(event.target.value))}
        >
          {sizeOptions.map((opt) => (
            <option key={opt} value={String(opt)}>
              {opt}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="button-secondary"
          disabled={busy || !meta.hasPrev}
          onClick={() =>
            onChangePage(Math.min(meta.totalPages, Math.max(1, meta.page - 1)))
          }
        >
          ← Trước
        </button>

        <span className="pagination-page-indicator" aria-live="polite">
          Trang {meta.page} / {meta.totalPages}
        </span>

        <button
          type="button"
          className="button-secondary"
          disabled={busy || !meta.hasNext}
          onClick={() => onChangePage(Math.min(meta.totalPages, meta.page + 1))}
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
