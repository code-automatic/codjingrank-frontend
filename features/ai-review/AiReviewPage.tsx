"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { useSession } from "@/features/auth/session";
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
} from "./aiReviewModel";
import { createAiReviewController, type AiReviewState } from "./controller";

export function AiReviewContent({
  state,
  onSelectFinding,
  onPause,
  onResume,
  onRetryAll,
}: {
  state: AiReviewState;
  onSelectFinding?: (findingId: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetryAll?: () => void;
}) {
  const submission = state.submission;

  if (state.phase === "loading" && !submission) {
    return (
      <main className="workspace-main ai-review-main">
        <p className="status-line" role="status">
          <span className="spinner" aria-hidden="true" />
          Đang tải thông tin bài nộp và đánh giá AI…
        </p>
      </main>
    );
  }

  if (state.phase === "error" && !submission) {
    return (
      <main className="workspace-main ai-review-main">
        <div className="panel error-panel" role="alert">
          <p className="breadcrumb muted">
            <Link href="/problems">← Kho bài tập</Link>
            <span aria-hidden="true"> · </span>
            <Link href="/protected">Tài khoản</Link>
          </p>
          <h1>Không tải được đánh giá AI</h1>
          <p>{resolveAiReviewErrorMessage(state.error)}</p>
          <div className="actions">
            {onRetryAll && (
              <button type="button" onClick={onRetryAll}>
                Thử lại
              </button>
            )}
            <Link className="btn-secondary-link" href="/problems">
              Về kho bài tập
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!submission) return null;

  const uiStatus = resolveUiAiStatus(state.review);
  const statusMeta = AI_REVIEW_STATUS_META[uiStatus];
  const review = state.review;
  const codeLines = splitSourceLines(submission.code);
  const activeFinding =
    review?.findings.find((item) => item.id === state.selectedFindingId) ??
    null;

  function focusLine(lineNumber: number | null) {
    if (lineNumber === null || typeof document === "undefined") return;
    document
      .getElementById(`ai-code-line-${lineNumber}`)
      ?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }

  return (
    <main className="workspace-main ai-review-main">
      <nav className="breadcrumb muted" aria-label="Điều hướng">
        <Link href={`/problems/${encodeURIComponent(submission.problemSlug)}`}>
          ← Quay lại bài tập: {submission.problemTitle}
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href="/problems">Kho bài tập</Link>
        <span aria-hidden="true"> / </span>
        <span>Đánh giá AI</span>
      </nav>

      <header className="workspace-header ai-review-page-header">
        <div>
          <p className="eyebrow">Màn hình đánh giá AI riêng</p>
          <h1>{submission.problemTitle}</h1>
        </div>
        <div className="ai-review-header-links">
          <Link
            className="btn-secondary-link"
            href={`/problems/${encodeURIComponent(submission.problemSlug)}`}
          >
            Mở trình soạn thảo bài này
          </Link>
        </div>
      </header>

      <section
        className="panel ai-verdict-banner"
        aria-labelledby="verdict-separation-heading"
      >
        <div className="ai-verdict-row">
          <div>
            <h2 id="verdict-separation-heading">Kết quả chấm bài nộp</h2>
            <p className="muted ai-submission-meta">
              {submission.passCount}/{submission.totalTestcases} test đạt ·{" "}
              {submission.languageSlug} · Thời gian:{" "}
              {submission.runtimeMs === null
                ? "—"
                : `${submission.runtimeMs} ms`}{" "}
              · Bộ nhớ:{" "}
              {submission.memoryKb === null ? "—" : `${submission.memoryKb} KB`}
            </p>
            <p className="muted submission-id">Mã lượt nộp: {submission.id}</p>
          </div>
          <div className="ai-verdict-badges">
            <span
              className={`ai-badge ai-badge--${
                submission.isAccepted ? "pass" : "neutral"
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
                          aria-label={dim.label}
                          aria-valuenow={dim.score}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="ai-dimension-fill"
                            style={{
                              width: `${Math.max(0, Math.min(100, dim.score))}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="ai-split-layout">
                <div className="ai-code-pane">
                  <div className="ai-pane-header">
                    <h3>Mã nguồn đã nộp</h3>
                    <span className="muted">
                      {codeLines.length} dòng · {submission.languageSlug}
                    </span>
                  </div>
                  <div
                    className="ai-code-viewer"
                    tabIndex={0}
                    role="region"
                    aria-label="Mã nguồn đã nộp có đánh số dòng"
                  >
                    {codeLines.map((lineText, idx) => {
                      const lineNumber = idx + 1;
                      const highlighted = isLineHighlighted(
                        lineNumber,
                        activeFinding,
                      );
                      return (
                        <div
                          key={lineNumber}
                          id={`ai-code-line-${lineNumber}`}
                          className={
                            highlighted
                              ? "ai-code-line ai-code-line--active"
                              : "ai-code-line"
                          }
                        >
                          <span className="ai-code-gutter" aria-hidden="true">
                            {lineNumber}
                          </span>
                          <code className="ai-code-text">
                            {lineText.length > 0 ? lineText : " "}
                          </code>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="ai-findings-pane">
                  <div className="ai-pane-header">
                    <h3>Góp ý chi tiết ({review.findings.length})</h3>
                    {activeFinding && (
                      <span className="muted">
                        Đang xem:{" "}
                        {formatLineRange(
                          activeFinding.lineStart,
                          activeFinding.lineEnd,
                        )}
                      </span>
                    )}
                  </div>

                  {review.findings.length === 0 ? (
                    <p className="muted ai-empty-findings">
                      AI không ghi nhận vấn đề cụ thể nào cần chỉnh sửa thêm cho
                      lời giải này.
                    </p>
                  ) : (
                    <ul className="ai-findings-list">
                      {review.findings.map((finding) => {
                        const sevMeta = AI_SEVERITY_META[finding.severity];
                        const isSelected = activeFinding?.id === finding.id;
                        return (
                          <li key={finding.id}>
                            <button
                              type="button"
                              aria-pressed={isSelected}
                              className={
                                isSelected
                                  ? "ai-finding-card ai-finding-card--selected"
                                  : "ai-finding-card"
                              }
                              onClick={() => {
                                onSelectFinding?.(finding.id);
                                focusLine(finding.lineStart);
                              }}
                            >
                              <div className="ai-finding-head">
                                <span
                                  className={`ai-badge ai-badge--${sevMeta.tone}`}
                                >
                                  {sevMeta.label}
                                </span>
                                <span className="ai-finding-lines">
                                  {formatLineRange(
                                    finding.lineStart,
                                    finding.lineEnd,
                                  )}
                                </span>
                              </div>
                              <strong className="ai-finding-title">
                                {finding.title}
                              </strong>
                              <p className="ai-finding-explanation">
                                {finding.explanation}
                              </p>
                              {finding.suggestion && (
                                <p className="ai-finding-suggestion">
                                  <strong>Đề xuất:</strong> {finding.suggestion}
                                </p>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}

function AuthenticatedAiReview({
  userId,
  submissionId,
}: {
  userId: string;
  submissionId: string;
}) {
  const api = useApiClient();
  const { store } = useSession();
  const [controller] = useState(() =>
    createAiReviewController(api, { userId, submissionId }),
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );

  useEffect(() => {
    controller.activate();
    const unsubscribe = store.subscribe(() => {
      const session = store.getSnapshot();
      if (session.status !== "authenticated" || session.user?.id !== userId) {
        controller.dispose();
      }
    });

    let pausedByVisibility = false;
    function handleVisibility() {
      if (document.hidden && controller.getSnapshot().phase === "polling") {
        pausedByVisibility = true;
        controller.pause();
      } else if (!document.hidden && pausedByVisibility) {
        pausedByVisibility = false;
        void controller.resume();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    void controller.start();

    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
      controller.dispose();
    };
  }, [controller, store, userId]);

  return (
    <AiReviewContent
      state={state}
      onSelectFinding={(findingId) => controller.selectFinding(findingId)}
      onPause={() => controller.pause()}
      onResume={() => void controller.resume()}
      onRetryAll={() => void controller.start()}
    />
  );
}

export function AiReviewPage({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const { status, user } = useSession();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, router]);

  return (
    <>
      <SessionNotice />
      {status === "initializing" && (
        <main className="workspace-main ai-review-main">
          <p className="status-line" role="status">
            <span className="spinner" aria-hidden="true" />
            Đang kiểm tra phiên đăng nhập…
          </p>
        </main>
      )}
      {status === "authenticated" && user && (
        <AuthenticatedAiReview
          key={`${user.id}:${submissionId}`}
          userId={user.id}
          submissionId={submissionId}
        />
      )}
    </>
  );
}
