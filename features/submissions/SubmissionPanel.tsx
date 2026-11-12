"use client";

import Link from "next/link";
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
          <p className={row.isAccepted ? "badge-solved" : "submission-verdict"}>
            <strong>{row.status}</strong>
          </p>
          <p>
            {row.passCount}/{row.totalTestcases} test đạt · {row.languageSlug}
          </p>
          <p className="muted">
            Thời gian: {row.runtimeMs === null ? "—" : `${row.runtimeMs} ms`} ·
            Bộ nhớ: {row.memoryKb === null ? "—" : `${row.memoryKb} KB`}
          </p>
          <p className="muted submission-id">Mã lượt nộp: {row.id}</p>
          {row.errorMessage && (
            <pre className="submission-message">{row.errorMessage}</pre>
          )}
          {row.isAccepted && (
            <div className="submission-ai-cta">
              <p>Đã chấp nhận bài nộp. Kết quả chấm độc lập với đánh giá AI.</p>
              <Link
                className="btn-secondary-link"
                href={`/submissions/${encodeURIComponent(row.id)}/ai-review`}
              >
                Xem đánh giá AI
              </Link>
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
}: {
  workspace: WorkspaceSnapshot;
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
  return (
    <section
      className="panel submission-panel"
      aria-labelledby="submission-heading"
    >
      <div className="editor-heading-row">
        <h2 id="submission-heading">Nộp bài</h2>
        <button
          type="button"
          disabled={blocked}
          onClick={() =>
            void controller.submit({
              problemId: problem.problem.id,
              languageId: workspace.selectedLanguageId!,
              code: workspace.code,
            })
          }
        >
          {state.phase === "submitting" ? "Đang gửi…" : "Nộp bài chấm điểm"}
        </button>
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
        <button
          type="button"
          className="button-secondary"
          disabled={state.phase === "submitting"}
          onClick={() => void controller.reconcile()}
        >
          Kiểm tra lượt nộp gần nhất
        </button>
        {state.phase === "paused" && (
          <button type="button" onClick={() => controller.resume()}>
            Kiểm tra lại kết quả
          </button>
        )}
        {state.phase === "polling" && (
          <button
            type="button"
            className="button-secondary"
            onClick={() => controller.pause()}
          >
            Dừng theo dõi
          </button>
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
          <button
            type="button"
            className="button-secondary"
            disabled={state.historyLoading}
            onClick={() => void controller.loadHistory(history?.page ?? 1)}
          >
            Làm mới lịch sử
          </button>
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
                    <div className="actions">
                      <button
                        type="button"
                        className="button-secondary"
                        disabled={
                          !state.initialized || state.phase === "submitting"
                        }
                        aria-label={`Xem bài nộp ${row.id}`}
                        onClick={() => void controller.select(row.id)}
                      >
                        Xem kết quả
                      </button>
                      {row.isAccepted && (
                        <Link
                          className="btn-secondary-link"
                          href={`/submissions/${encodeURIComponent(row.id)}/ai-review`}
                        >
                          Xem đánh giá AI
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
                disabled={history.page <= 1}
                onClick={() => void controller.loadHistory(history.page - 1)}
              >
                Trang trước
              </button>
              <span>
                Trang {history.page} /{" "}
                {Math.max(1, Math.ceil(history.total / history.size))} ·{" "}
                {history.total} lượt nộp
              </span>
              <button
                type="button"
                disabled={history.page * history.size >= history.total}
                onClick={() => void controller.loadHistory(history.page + 1)}
              >
                Trang sau
              </button>
            </nav>
          </>
        )}
      </section>
    </section>
  );
}
