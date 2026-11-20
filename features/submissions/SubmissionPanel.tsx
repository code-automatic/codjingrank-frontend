"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { Icon } from "@/lib/ui/Icon";
import { CopyButton } from "@/lib/ui/CopyButton";
import { IconButton } from "@/lib/ui/IconButton";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useSession } from "@/features/auth/session";
import type { WorkspaceSnapshot } from "@/features/editor/workspace";
import { useApiClient } from "@/lib/api/useApiClient";
import { errorText } from "@/lib/api/client";
import { MAX_EXECUTE_CODE_BYTES } from "@/lib/api/domains/preflight";
import { utf8ByteLength } from "@/lib/api/guards";
import { createSubmissionController, type SubmissionState } from "./controller";

export function SubmissionResult({ state }: { state: SubmissionState }) {
  const row = state.submission;
  return (
    <div className="submission-result" aria-live="polite" aria-atomic="true">
      {row ? (
        <>
          <div className="submission-verdict-heading">
            <span
              className={
                row.isAccepted
                  ? "verdict-symbol verdict-symbol--accepted"
                  : "verdict-symbol"
              }
            >
              <Icon name={row.isAccepted ? "check" : "code"} size={22} />
            </span>
            <div>
              <span className="submission-result-label">Kết quả chấm bài</span>
              <h3>{row.status}</h3>
            </div>
            {row.isAccepted && (
              <Link
                href={`/submissions/${encodeURIComponent(row.id)}/ai-review`}
                className="btn-primary-link submission-ai-link"
              >
                <Icon name="sparkles" size={18} /> Xem đánh giá AI{" "}
                <Icon name="chevronRight" />
              </Link>
            )}
          </div>
          <dl className="submission-metrics">
            <div>
              <dt>Test đạt</dt>
              <dd
                aria-label={`${row.passCount}/${row.totalTestcases} test đạt`}
              >
                {row.passCount}
                <span> / {row.totalTestcases}</span>
              </dd>
            </div>
            <div>
              <dt>Ngôn ngữ</dt>
              <dd>{row.languageSlug}</dd>
            </div>
            <div>
              <dt>Thời gian</dt>
              <dd>{row.runtimeMs === null ? "—" : `${row.runtimeMs} ms`}</dd>
            </div>
            <div>
              <dt>Bộ nhớ</dt>
              <dd>{row.memoryKb === null ? "—" : `${row.memoryKb} KB`}</dd>
            </div>
          </dl>
          <details className="submission-reference">
            <summary>Thông tin lượt nộp</summary>
            <div>
              <code>{row.id}</code>
              <CopyButton value={row.id} />
            </div>
          </details>
          {row.errorMessage && (
            <pre className="submission-message">{row.errorMessage}</pre>
          )}
          {row.isAccepted && (
            <div className="submission-ai-cta">
              <p>Kết quả chấm độc lập với nhận xét và điểm đánh giá AI.</p>
            </div>
          )}
        </>
      ) : (
        <p className="muted">
          {state.phase === "submitting"
            ? "Đang gửi bài…"
            : "Chưa có kết quả bài nộp được chọn."}
        </p>
      )}
      {state.phase === "polling" && (
        <p role="status">Đang theo dõi kết quả chấm…</p>
      )}
      {state.phase === "paused" && (
        <p>Đã dừng tự động theo dõi. Bạn có thể kiểm tra lại kết quả.</p>
      )}
    </div>
  );
}

export function SubmissionPanel({
  workspace,
  actionHost,
  onSubmitStart,
}: {
  workspace: WorkspaceSnapshot;
  actionHost?: HTMLElement | null;
  onSubmitStart?: () => void;
}) {
  const api = useApiClient();
  const { user, store } = useSession();
  const problem = workspace.problem!;
  const userId = user!.id;
  const [controller] = useState(() =>
    createSubmissionController(api, {
      userId,
      problemId: problem.problem.id,
      packageSlug: problem.problem.packageSlug,
    }),
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const session = store.getSnapshot();
      if (session.status !== "authenticated" || session.user?.id !== userId)
        controller.dispose();
    });
    let pausedByVisibility = false;
    function visibility() {
      if (document.hidden && controller.getSnapshot().phase === "polling") {
        pausedByVisibility = true;
        controller.pause();
      } else if (!document.hidden && pausedByVisibility) {
        pausedByVisibility = false;
        controller.resume();
      }
    }
    document.addEventListener("visibilitychange", visibility);
    void controller.start();
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", visibility);
      controller.dispose();
    };
  }, [controller, store, userId]);
  useEffect(() => {
    if (!state.cooldownUntil || state.cooldownUntil <= Date.now()) return;
    const timer = setInterval(() => {
      const timestamp = Date.now();
      setClock(timestamp);
      if (timestamp >= state.cooldownUntil) clearInterval(timer);
    }, 500);
    return () => clearInterval(timer);
  }, [state.cooldownUntil]);
  const remaining = Math.max(
    0,
    Math.ceil((state.cooldownUntil - clock) / 1000),
  );
  const busy = state.phase === "submitting" || state.phase === "polling";
  const blocked =
    !state.initialized ||
    busy ||
    state.uncertain ||
    (state.phase === "paused" && !!state.submission?.shouldPoll) ||
    remaining > 0 ||
    workspace.templatePhase !== "ready" ||
    !workspace.selectedLanguageId ||
    !workspace.code.trim() ||
    utf8ByteLength(workspace.code) > MAX_EXECUTE_CODE_BYTES;
  const history = state.history;
  const action = (
    <button
      type="button"
      className="workspace-submit"
      aria-label="Nộp bài chấm điểm"
      disabled={blocked}
      onClick={() => {
        onSubmitStart?.();
        void controller.submit({
          problemId: problem.problem.id,
          languageId: workspace.selectedLanguageId!,
          code: workspace.code,
        });
      }}
    >
      <Icon name="submit" />
      {state.phase === "submitting" ? "Đang gửi…" : "Nộp bài"}
    </button>
  );

  return (
    <section
      className="panel submission-panel"
      aria-labelledby="submission-heading"
    >
      <div className="editor-heading-row">
        <h2 id="submission-heading">Nộp bài</h2>
        {actionHost ? createPortal(action, actionHost) : action}
      </div>
      {!state.initialized && (
        <p role="status">Đang kiểm tra lượt nộp gần nhất…</p>
      )}
      {state.cooldownUntil > clock && (
        <p className="muted" role="status">
          Vui lòng đợi hết thời gian giãn cách trước khi nộp tiếp.
        </p>
      )}
      {!!state.error && (
        <p className="error" role="alert">
          {errorText(state.error)}
        </p>
      )}
      {state.uncertain && (
        <p className="notice" role="alert">
          Chưa xác định được bài đã gửi thành công hay chưa. Kiểm tra lịch sử và
          lượt gần nhất trước khi nộp lại để tránh tạo bài trùng.
        </p>
      )}
      <SubmissionResult state={state} />
      <div className="actions">
        <IconButton
          icon="reset"
          label="Kiểm tra lượt nộp gần nhất"
          disabled={state.phase === "submitting"}
          onClick={() => void controller.reconcile()}
        />
        {state.phase === "paused" && (
          <button type="button" onClick={() => controller.resume()}>
            <Icon name="reset" /> Kiểm tra lại
          </button>
        )}
        {state.phase === "polling" && (
          <IconButton
            icon="pause"
            label="Dừng theo dõi"
            onClick={() => controller.pause()}
          />
        )}
      </div>
      <section
        aria-labelledby="submission-progress-heading"
        className="submission-section"
      >
        <h3 id="submission-progress-heading">Tiến độ gói bài</h3>
        {state.progressLoading && (
          <p role="status">Đang cập nhật tiến độ từ máy chủ…</p>
        )}
        {!!state.progressError && (
          <div role="alert">
            <p className="error">{errorText(state.progressError)}</p>
            <button
              type="button"
              onClick={() => void controller.loadProgress()}
            >
              Thử lại tiến độ
            </button>
          </div>
        )}
        {state.unlockedLevels.length > 0 && (
          <p className="notice" role="status">
            Máy chủ xác nhận vừa mở cấp {state.unlockedLevels.join(", ")}.
          </p>
        )}
        {state.progress && (
          <ul className="submission-levels">
            {state.progress.levels.map((level) => (
              <li key={level.levelNo}>
                <strong>
                  Cấp {level.levelNo}: {level.name}
                </strong>
                <span>
                  {level.solved}/{level.total} bài đã giải ·{" "}
                  {level.unlocked ? "Đang mở" : "Đang khóa"}
                  {level.completed ? " · Hoàn thành" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href={`/packages/${problem.problem.packageSlug}`}>
          Xem gói bài và cấp độ
        </Link>
      </section>
      <section
        aria-labelledby="submission-history-heading"
        className="submission-section"
      >
        <div className="editor-heading-row">
          <h3 id="submission-history-heading">Lịch sử cá nhân của bài này</h3>
          <IconButton
            icon="history"
            label="Làm mới lịch sử"
            disabled={state.historyLoading}
            onClick={() => void controller.loadHistory(history?.page ?? 1)}
          />
        </div>
        {state.historyLoading && <p role="status">Đang tải lịch sử…</p>}
        {!!state.historyError && (
          <p className="error" role="alert">
            {errorText(state.historyError)}
          </p>
        )}
        {history && (
          <>
            {history.items.length === 0 ? (
              <p>Chưa có bài nộp ở trang này.</p>
            ) : (
              <ul className="submission-history">
                {history.items.map((row) => (
                  <li key={row.id}>
                    <div>
                      <strong>{row.status}</strong>
                      <p>
                        {row.passCount}/{row.totalTestcases} test ·{" "}
                        {row.languageSlug}
                      </p>
                      <time dateTime={row.createdAt}>
                        {new Date(row.createdAt).toLocaleString("vi-VN")}
                      </time>
                    </div>
                    <div className="submission-history-actions">
                      <button
                        type="button"
                        className="button-secondary"
                        disabled={
                          !state.initialized || state.phase === "submitting"
                        }
                        aria-label={`Xem bài nộp ${row.id}`}
                        onClick={() => void controller.select(row.id)}
                      >
                        <Icon name="eye" /> Kết quả
                      </button>
                      {row.isAccepted && (
                        <Link
                          href={`/submissions/${encodeURIComponent(row.id)}/ai-review`}
                          className="button-secondary"
                        >
                          <Icon name="sparkles" /> Đánh giá AI
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <nav className="actions" aria-label="Phân trang lịch sử">
              <button
                type="button"
                aria-label="Trang trước"
                title="Trang trước"
                disabled={history.page <= 1}
                onClick={() => void controller.loadHistory(history.page - 1)}
              >
                <Icon name="chevronLeft" />
                <span className="sr-only">Trang trước</span>
              </button>
              <span>
                Trang {history.page} /{" "}
                {Math.max(1, Math.ceil(history.total / history.size))} ·{" "}
                {history.total} lượt nộp
              </span>
              <button
                type="button"
                aria-label="Trang sau"
                title="Trang sau"
                disabled={history.page * history.size >= history.total}
                onClick={() => void controller.loadHistory(history.page + 1)}
              >
                <Icon name="chevronRight" />
                <span className="sr-only">Trang sau</span>
              </button>
            </nav>
          </>
        )}
      </section>
    </section>
  );
}
