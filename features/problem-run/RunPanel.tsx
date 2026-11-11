"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useSession } from "@/features/auth/session";
import type { WorkspaceSnapshot } from "@/features/editor/workspace";
import { MAX_EXECUTE_CODE_BYTES } from "@/lib/api/domains/preflight";
import { utf8ByteLength } from "@/lib/api/guards";
import { useApiClient } from "@/lib/api/useApiClient";
import { createRunController, type RunState } from "./controller";
import {
  formatOutputText,
  formatRuntimeMs,
  isSampleMismatch,
  resolveRunErrorMessage,
  VERDICT_META,
} from "./runModel";

function phaseBadge(state: RunState): { label: string; tone: string } {
  if (state.phase === "running") {
    return { label: "Đang chạy…", tone: "neutral" };
  }
  if (state.phase === "cancelled") {
    return { label: "Đã hủy", tone: "warn" };
  }
  if (state.phase === "error") {
    return { label: "Lỗi chạy thử", tone: "fail" };
  }
  if (state.result) {
    const meta = VERDICT_META[state.result.status];
    return { label: meta.label, tone: meta.tone };
  }
  return { label: "Chưa chạy", tone: "neutral" };
}

export function RunResultView({
  state,
  languageLabel,
  isCodeEditedAfterRun = false,
}: {
  state: RunState;
  languageLabel?: string | null;
  isCodeEditedAfterRun?: boolean;
}) {
  const result = state.result;

  if (!result) {
    return (
      <div className="run-results-body" aria-live="polite">
        {state.phase === "running" ? (
          <p className="muted run-empty" role="status">
            <span className="spinner" aria-hidden="true" />
            Đang gửi mã nguồn tới dịch vụ chạy thử mẫu…
          </p>
        ) : (
          <p className="muted run-empty">
            Chưa có kết quả chạy thử. Bấm «▶ Chạy thử mẫu» để xem trạng thái,
            thời gian chạy, output và chi tiết lỗi của từng test mẫu.
          </p>
        )}
      </div>
    );
  }

  const summaryMeta = VERDICT_META[result.status];

  return (
    <div className="run-results-body" aria-live="polite">
      <div className="run-summary-bar">
        <span className={`run-badge run-badge--${summaryMeta.tone}`}>
          {summaryMeta.label}
        </span>
        <span className="run-badge run-badge--neutral">
          Đạt {result.passed}/{result.total} test mẫu
        </span>
        {languageLabel && (
          <span className="run-badge run-badge--neutral">
            Ngôn ngữ: {languageLabel}
          </span>
        )}
        <span className="run-badge run-badge--neutral">
          Không tạo submission
        </span>
        {isCodeEditedAfterRun && (
          <span className="run-badge run-badge--warn">
            Mã nguồn đã sửa sau lần chạy này
          </span>
        )}
      </div>

      {result.results.length === 0 ? (
        <p className="muted run-empty">
          Phiên chạy thử không trả về chi tiết test mẫu nào.
        </p>
      ) : (
        <div className="run-sample-list">
          {result.results.map((item, idx) => {
            const itemMeta = VERDICT_META[item.status];
            const mismatch = isSampleMismatch(item);
            const hasDiagnostic = Boolean(
              item.errorType || item.errorMessage || item.stderr,
            );
            return (
              <article
                key={`${item.testCaseId}-${idx}`}
                className="run-sample-card"
              >
                <div className="run-sample-head">
                  <div className="run-sample-title">
                    <strong>Mẫu #{idx + 1}</strong>
                    <span className={`run-badge run-badge--${itemMeta.tone}`}>
                      {itemMeta.label}
                    </span>
                  </div>
                  <span className="run-runtime">
                    Thời gian: {formatRuntimeMs(item.runtimeMs)}
                  </span>
                </div>

                <div className="run-io-grid">
                  <div className="run-io-col">
                    <p className="sample-label">Đầu vào (stdin)</p>
                    <pre className="run-pre">
                      {formatOutputText(item.inputData)}
                    </pre>
                  </div>
                  <div className="run-io-col">
                    <p className="sample-label">Output mong đợi</p>
                    <pre className="run-pre">
                      {formatOutputText(item.expectedOutput)}
                    </pre>
                  </div>
                  <div className="run-io-col">
                    <p className="sample-label">Output thực tế</p>
                    <pre
                      className={
                        mismatch ? "run-pre run-pre--mismatch" : "run-pre"
                      }
                    >
                      {formatOutputText(item.actualOutput)}
                    </pre>
                  </div>
                </div>

                {hasDiagnostic && (
                  <div
                    className="run-diagnostic"
                    role="region"
                    aria-label={`Chi tiết lỗi mẫu ${idx + 1}`}
                  >
                    <div className="run-diagnostic-head">
                      <strong>Chi tiết lỗi</strong>
                      {item.errorType && (
                        <span className="run-badge run-badge--fail">
                          {item.errorType}
                        </span>
                      )}
                    </div>
                    {item.errorMessage && (
                      <p className="error run-diagnostic-message">
                        {item.errorMessage}
                      </p>
                    )}
                    {item.stderr && (
                      <pre className="run-pre run-pre--error">
                        {item.stderr}
                      </pre>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RunPanel({ workspace }: { workspace: WorkspaceSnapshot }) {
  const api = useApiClient();
  const { user, store } = useSession();
  const problem = workspace.problem;
  const userId = user?.id ?? "";
  const problemId = problem?.problem.id ?? "";

  const [controller] = useState(() =>
    createRunController(api, {
      userId,
      problemId,
    }),
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
    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, [controller, store, userId]);

  useEffect(() => {
    controller.syncLanguage(workspace.selectedLanguageId);
  }, [controller, workspace.selectedLanguageId]);

  useEffect(() => {
    controller.syncCode(workspace.code);
  }, [controller, workspace.code]);

  if (!problem || !user) return null;

  const selectedLanguage =
    workspace.languages.find(
      (item) => item.id === workspace.selectedLanguageId,
    ) ?? null;
  const bytes = utf8ByteLength(workspace.code);
  const isOversize = bytes > MAX_EXECUTE_CODE_BYTES;
  const isRunning = state.phase === "running";
  const templateNotReady = workspace.templatePhase !== "ready";
  const disabledRun =
    isRunning || templateNotReady || !selectedLanguage || isOversize;
  const statusBadge = phaseBadge(state);
  const errorMessage = resolveRunErrorMessage(
    state.error,
    state.validationMessage,
  );
  const isCodeEditedAfterRun = Boolean(
    state.result &&
    state.resultCode !== null &&
    state.resultCode !== workspace.code,
  );

  return (
    <section className="panel run-panel" aria-labelledby="run-heading">
      <div className="run-header">
        <div className="run-title-block">
          <div className="run-title-line">
            <h2 id="run-heading">Chạy thử mẫu</h2>
            <span className={`run-badge run-badge--${statusBadge.tone}`}>
              {statusBadge.label}
            </span>
          </div>
          <p className="muted run-subtitle">
            Kiểm tra nhanh trên test mẫu công khai
            {selectedLanguage ? ` (${selectedLanguage.displayLabel})` : ""} ·
            Không tạo submission.
          </p>
        </div>

        <div className="run-actions">
          <button
            type="button"
            disabled={disabledRun}
            onClick={() => {
              if (!selectedLanguage) return;
              void controller.run({
                problemId: problem.problem.id,
                languageId: selectedLanguage.id,
                code: workspace.code,
              });
            }}
          >
            {isRunning && <span className="spinner" aria-hidden="true" />}
            {isRunning ? "Đang chạy thử mẫu…" : "▶ Chạy thử mẫu"}
          </button>

          {isRunning && (
            <button
              type="button"
              className="button-secondary"
              onClick={() => controller.cancel()}
            >
              ⏹ Hủy chạy
            </button>
          )}
        </div>
      </div>

      {templateNotReady && (
        <p className="muted run-helper" role="status">
          Đợi mã khởi tạo tải xong để chạy thử mẫu.
        </p>
      )}

      {isOversize && (
        <p className="error run-helper" role="status">
          Mã nguồn đang là {bytes.toLocaleString("vi-VN")} byte, vượt giới hạn{" "}
          {MAX_EXECUTE_CODE_BYTES.toLocaleString("vi-VN")} byte UTF-8; thu gọn
          code trước khi bấm Chạy thử mẫu.
        </p>
      )}

      {state.notice && (
        <p className="notice run-notice" role="status">
          {state.notice}
        </p>
      )}

      {errorMessage && (
        <p className="error run-error" role="alert">
          {errorMessage}
        </p>
      )}

      <RunResultView
        state={state}
        languageLabel={selectedLanguage?.displayLabel}
        isCodeEditedAfterRun={isCodeEditedAfterRun}
      />
    </section>
  );
}
