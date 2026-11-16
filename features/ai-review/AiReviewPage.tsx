"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSession } from "@/features/auth/session";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { useApiClient } from "@/lib/api/useApiClient";
import {
  AI_REVIEW_STATUS_META,
  AI_SEVERITY_META,
  formatAiDateTime,
  formatAiScore,
  formatLineRange,
  isLineHighlighted,
  resolveAiReviewErrorMessage,
  resolveUiAiStatus,
  splitSourceLines,
  type AiFindingModel,
} from "./aiReviewModel";
import {
  createAiReviewController,
  type AiReviewController,
  type AiReviewState,
} from "./controller";

export function AiReviewContent({
  state,
  onPause,
  onResume,
  onRetryAll,
  onSelectFinding,
}: {
  state: AiReviewState;
  onPause?: () => void;
  onResume?: () => void;
  onRetryAll?: () => void;
  onSelectFinding?: (id: string | null) => void;
}) {
  const submission = state.submission;
  const review = state.review;
  const uiStatus = resolveUiAiStatus(review);
  const statusMeta = AI_REVIEW_STATUS_META[uiStatus];
  const selectedFinding: AiFindingModel | null =
    (review?.findings.find((f) => f.id === state.selectedFindingId) as
      AiFindingModel | undefined) ?? null;

  const lines = submission ? splitSourceLines(submission.code) : [];
  const lineEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedFinding?.lineStart) {
      const lineEl = document.getElementById(
        `ai-code-line-${selectedFinding.lineStart}`,
      );
      if (lineEl) {
        lineEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedFinding]);

  if (state.phase === "loading" && !submission) {
    return (
      <div className="ai-review-loading-view" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <h2>Đang tải thông tin đánh giá AI…</h2>
        <p className="muted">
          Đang đọc dữ liệu bài nộp và trạng thái đánh giá từ máy chủ.
        </p>
      </div>
    );
  }

  if (state.phase === "error" && !submission) {
    return (
      <div className="ai-review-error-view" role="alert">
        <h2>Không thể tải trang đánh giá AI</h2>
        <p className="error">{resolveAiReviewErrorMessage(state.error)}</p>
        <div className="actions">
          {onRetryAll && (
            <button type="button" onClick={onRetryAll}>
              Thử lại
            </button>
          )}
          <Link href="/problems" className="button-secondary">
            Quay lại kho bài tập
          </Link>
        </div>
      </div>
    );
  }

  if (!submission) {
    return null;
  }

  return (
    <div className="ai-review-main">
      <header className="ai-review-page-header">
        <div className="ai-review-header-left">
          <nav aria-label="Breadcrumb" className="ai-breadcrumb">
            <Link
              href={`/problems/${encodeURIComponent(submission.problemSlug)}`}
            >
              ← Quay lại bài tập: {submission.problemTitle}
            </Link>
            <span aria-hidden="true"> / </span>
            <Link href="/problems">Kho bài tập</Link>
            <span aria-hidden="true"> / </span>
            <span>Đánh giá AI</span>
          </nav>
          <p className="eyebrow">MÀN HÌNH ĐÁNH GIÁ AI RIÊNG</p>
          <h1>{submission.problemTitle}</h1>
        </div>
        <div className="ai-review-header-links">
          <Link
            className="button-secondary"
            href={`/problems/${encodeURIComponent(submission.problemSlug)}`}
          >
            Mở trình soạn thảo bài này
          </Link>
        </div>
      </header>

      <section
        className="panel ai-verdict-banner"
        aria-labelledby="ai-submission-verdict-heading"
      >
        <div className="ai-verdict-row">
          <div>
            <h2 id="ai-submission-verdict-heading">Kết quả chấm bài nộp</h2>
            <p className="muted ai-submission-meta">
              {submission.passCount}/{submission.totalTestcases} test đạt ·{" "}
              {submission.languageSlug} · Thời gian:{" "}
              {submission.runtimeMs === null
                ? "—"
                : `${submission.runtimeMs} ms`}{" "}
              · Bộ nhớ:{" "}
              {submission.memoryKb === null ? "—" : `${submission.memoryKb} KB`}
            </p>
            <p className="muted ai-submission-id">
              Mã lượt nộp: {submission.id}
            </p>
          </div>
          <div className="ai-verdict-badges">
            <span
              className={`ai-badge ${
                submission.isAccepted ? "ai-badge--pass" : "ai-badge--fail"
              }`}
            >
              Verdict: {submission.status}
            </span>
            <span className="ai-badge ai-badge--neutral">
              Độc lập với điểm AI & xếp hạng
            </span>
          </div>
        </div>
      </section>

      {state.phase === "ineligible" ? (
        <section
          className="panel ai-review-section"
          aria-labelledby="ai-ineligible-heading"
        >
          <div className="ai-section-header">
            <div>
              <h2 id="ai-ineligible-heading">Chưa đủ điều kiện đánh giá AI</h2>
              <p className="muted">
                Chỉ bài nộp đạt kết quả Accepted mới được hệ thống xếp hàng đánh
                giá AI. Trạng thái hiện tại của lượt nộp này là{" "}
                <strong>{submission.status}</strong>.
              </p>
            </div>
            <span className="ai-badge ai-badge--warn">Không áp dụng AI</span>
          </div>
          <div className="actions ai-review-actions">
            <Link
              className="btn-primary-link"
              href={`/problems/${encodeURIComponent(submission.problemSlug)}`}
            >
              Quay lại sửa và nộp lại bài
            </Link>
          </div>
        </section>
      ) : state.phase === "error" ? (
        <section className="panel error-panel ai-review-section" role="alert">
          <h2>Không tải được đánh giá AI</h2>
          <p>{resolveAiReviewErrorMessage(state.error)}</p>
          <p className="muted">
            Kết quả Accepted của bài nộp phía trên vẫn được bảo toàn.
          </p>
          <div className="actions">
            {onRetryAll && (
              <button type="button" onClick={onRetryAll}>
                Thử tải lại
              </button>
            )}
          </div>
        </section>
      ) : (
        <section
          className="panel ai-review-section"
          aria-labelledby="ai-review-heading"
          aria-live="polite"
        >
          <div className="ai-section-header">
            <div className="ai-section-title">
              <div className="ai-title-line">
                <h2 id="ai-review-heading">Phân tích từ AI Review</h2>
                <span className={`ai-badge ai-badge--${statusMeta.tone}`}>
                  {statusMeta.label}
                </span>
              </div>
              <p className="muted ai-status-desc">{statusMeta.description}</p>
            </div>

            <div className="ai-review-actions">
              {state.phase === "polling" && onPause && (
                <button
                  type="button"
                  className="button-secondary"
                  onClick={onPause}
                >
                  ⏹ Dừng theo dõi
                </button>
              )}
              {(state.phase === "paused" ||
                (state.phase === "ready" && review?.isFailed)) &&
                onResume && (
                  <button type="button" onClick={onResume}>
                    ↻ Kiểm tra lại đánh giá AI
                  </button>
                )}
            </div>
          </div>

          {state.phase === "polling" && (
            <p className="notice ai-poll-banner" role="status">
              <span className="spinner" aria-hidden="true" />
              Đang tự động cập nhật trạng thái từ endpoint AI review (mỗi 3
              giây)…
            </p>
          )}

          {state.phase === "paused" && !state.pollError && (
            <p className="notice ai-poll-banner" role="status">
              {state.exhausted
                ? "AI vẫn đang xử lý lâu hơn dự kiến nên hệ thống tạm dừng tự động hỏi. Bạn có thể bấm «Kiểm tra lại đánh giá AI» để cập nhật."
                : "Đã tạm dừng theo dõi tự động. Bấm «Kiểm tra lại đánh giá AI» bất cứ lúc nào để đọc trạng thái mới nhất."}
            </p>
          )}

          {!!state.pollError && (
            <p className="error ai-poll-banner" role="alert">
              {resolveAiReviewErrorMessage(state.pollError)}
            </p>
          )}

          {review && (
            <p className="muted ai-timestamps">
              Tạo lúc: {formatAiDateTime(review.createdAt)} · Bắt đầu:{" "}
              {formatAiDateTime(review.startedAt)} · Hoàn tất:{" "}
              {formatAiDateTime(review.completedAt)}
            </p>
          )}

          {!review?.isCompleted && !review?.isFailed && (
            <div className="ai-waiting-box" role="status">
              <h3>Trạng thái hàng đợi AI</h3>
              <p className="muted">{statusMeta.description}</p>
            </div>
          )}

          {review?.isFailed && (
            <div className="ai-failed-box" role="status">
              <h3>Đánh giá AI chưa hoàn tất</h3>
              <p className="error">
                {review.errorMessage ||
                  "Dịch vụ đánh giá AI tạm thời gián đoạn."}
              </p>
              <p className="muted">
                Trạng thái lỗi này chỉ thuộc dịch vụ AI. Kết quả chấm{" "}
                <strong>Accepted</strong>, tiến độ mở cấp và thứ hạng của bạn
                hoàn toàn không thay đổi.
              </p>
            </div>
          )}

          {review?.isCompleted && (
            <>
              <div className="ai-overview-grid">
                <div className="ai-score-card">
                  <p className="eyebrow">Điểm đánh giá AI</p>
                  <p className="ai-score-value">
                    {formatAiScore(review.score)}
                  </p>
                  <p className="muted">
                    Chỉ mang tính chất gợi ý cải thiện chất lượng mã nguồn.
                  </p>
                </div>

                <div className="ai-summary-card">
                  <h3>Tóm tắt nhận xét</h3>
                  <p>
                    {review.summary?.trim()
                      ? review.summary
                      : "Không có tóm tắt văn bản kèm theo."}
                  </p>
                </div>
              </div>

              <div className="ai-dimensions-block">
                <h3>Điểm theo từng tiêu chí</h3>
                {review.dimensionList.length === 0 ? (
                  <p className="muted">
                    Chưa có điểm chi tiết theo tiêu chí cho lượt đánh giá này.
                  </p>
                ) : (
                  <ul className="ai-dimensions-grid">
                    {review.dimensionList.map((dim) => (
                      <li key={dim.key} className="ai-dimension-card">
                        <div className="ai-dimension-head">
                          <span className="ai-dimension-label">
                            {dim.label}
                          </span>
                          <strong>{formatAiScore(dim.score)}</strong>
                        </div>
                        <div
                          className="ai-dimension-track"
                          role="progressbar"
                          aria-valuenow={Math.round(dim.score)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={dim.label}
                        >
                          <div
                            className="ai-dimension-fill"
                            style={{
                              width: `${Math.min(100, Math.max(0, dim.score))}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="ai-split-layout">
                <section
                  className="ai-code-pane"
                  aria-labelledby="ai-submitted-code-heading"
                >
                  <div className="ai-pane-header">
                    <h3 id="ai-submitted-code-heading">Mã nguồn đã nộp</h3>
                    <span className="muted">
                      {lines.length} dòng · {submission.languageSlug}
                    </span>
                  </div>
                  <div
                    className="ai-code-viewer"
                    role="region"
                    tabIndex={0}
                    aria-label="Khung xem mã nguồn bài nộp"
                  >
                    <table className="ai-code-table">
                      <tbody>
                        {lines.map((lineText, index) => {
                          const lineNum = index + 1;
                          const active = isLineHighlighted(
                            lineNum,
                            selectedFinding,
                          );
                          return (
                            <tr
                              key={lineNum}
                              id={`ai-code-line-${lineNum}`}
                              className={`ai-code-row ${
                                active ? "ai-code-line--active" : ""
                              }`}
                            >
                              <td className="ai-line-number" aria-hidden="true">
                                {lineNum}
                              </td>
                              <td className="ai-line-content">
                                <code>{lineText || " "}</code>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div ref={lineEndRef} />
                  </div>
                </section>

                <section
                  className="ai-findings-pane"
                  aria-labelledby="ai-findings-heading"
                >
                  <div className="ai-pane-header">
                    <h3 id="ai-findings-heading">
                      Góp ý chi tiết ({review.findings.length})
                    </h3>
                    {selectedFinding && (
                      <span className="ai-active-indicator">
                        Đang xem: {formatLineRange(selectedFinding)}
                      </span>
                    )}
                  </div>

                  {review.findings.length === 0 ? (
                    <div className="ai-empty-findings">
                      <p className="muted">
                        Mã nguồn đạt chuẩn tốt, AI không phát hiện điểm cần lưu
                        ý nào.
                      </p>
                    </div>
                  ) : (
                    <div className="ai-findings-list" role="list">
                      {review.findings.map((findingItem) => {
                        const f = findingItem as AiFindingModel;
                        const isSelected = f.id === state.selectedFindingId;
                        const sev = AI_SEVERITY_META[f.severity];
                        return (
                          <article
                            key={f.id}
                            className={`ai-finding-card ai-finding-card--${f.severity} ${
                              isSelected ? "ai-finding-card--selected" : ""
                            }`}
                            onClick={() => onSelectFinding?.(f.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onSelectFinding?.(f.id);
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-pressed={isSelected}
                          >
                            <header className="ai-finding-header">
                              <span
                                className={`ai-severity-badge ai-severity-badge--${sev.tone}`}
                              >
                                {sev.label}
                              </span>
                              <span className="ai-finding-range">
                                {formatLineRange(f)}
                              </span>
                            </header>

                            <h4 className="ai-finding-title">{f.title}</h4>
                            <p className="ai-finding-explanation">
                              {f.explanation}
                            </p>

                            {f.suggestion && (
                              <div className="ai-finding-suggestion">
                                <strong>Đề xuất: </strong>
                                <span>{f.suggestion}</span>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function AuthenticatedAiReview({
  submissionId,
  userId,
}: {
  submissionId: string;
  userId: string;
}) {
  const api = useApiClient();
  const [controller] = useState<AiReviewController>(() =>
    createAiReviewController(api, { userId, submissionId }),
  );

  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );

  useEffect(() => {
    controller.activate();
    void controller.start();

    let pausedByVisibility = false;
    function handleVisibility() {
      if (document.hidden && controller.getSnapshot().phase === "polling") {
        pausedByVisibility = true;
        controller.pause();
      } else if (!document.hidden && pausedByVisibility) {
        pausedByVisibility = false;
        controller.resume();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      controller.dispose();
    };
  }, [controller]);

  return (
    <AiReviewContent
      state={state}
      onPause={() => controller.pause()}
      onResume={() => controller.resume()}
      onRetryAll={() => void controller.retryRead()}
      onSelectFinding={(id) => controller.selectFinding(id)}
    />
  );
}

export function AiReviewPage({ id }: { id: string }) {
  const { status, user } = useSession();

  if (status === "initializing") {
    return (
      <main className="container" role="status" aria-live="polite">
        <div className="panel">
          <div className="spinner" aria-hidden="true" />
          <p>Đang kiểm tra thông tin đăng nhập…</p>
        </div>
      </main>
    );
  }

  if (status === "anonymous" || !user) {
    return (
      <main className="container">
        <div className="panel">
          <h2>Đăng nhập để xem đánh giá AI</h2>
          <p className="muted">
            Chỉ người nộp bài mới có quyền xem thông tin chi tiết và nhận xét từ
            AI.
          </p>
          <SessionNotice />
          <div className="actions">
            <Link href="/login" className="btn-primary-link">
              Đăng nhập
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container ai-review-container">
      <AuthenticatedAiReview submissionId={id} userId={user.id} />
    </main>
  );
}
