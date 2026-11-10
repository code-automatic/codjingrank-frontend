"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { useSession } from "@/features/auth/session";
import {
  buildDraftStorageKey,
  pickInitialLanguage,
  PREFERRED_LANGUAGE_KEY,
  safeRemoveStorage,
  safeReadStorage,
  safeWriteStorage,
} from "@/features/problem-run/draftStorage";
import {
  DIFFICULTY_LABELS,
  executeSampleRun,
  isAbortError,
  resolveCodeForLanguage,
  validateCodeBeforeRun,
  VERDICT_META,
} from "@/features/problem-run/runModel";
import {
  errorText,
  MAX_EXECUTE_CODE_BYTES,
  utf8ByteLength,
  type CodeTemplateModel,
  type LanguageModel,
  type ProblemDetailModel,
  type RunDataModel,
} from "@/lib/api";
import { useApiClient } from "@/lib/api/useApiClient";

function formatOutputText(value: string | null): string {
  if (value === null || value === "") return "(trống)";
  return value;
}

export function ProblemRunWorkspace({ slug }: { slug: string }) {
  const router = useRouter();
  const { status, user } = useSession();
  const api = useApiClient();

  const [reloadTick, setReloadTick] = useState(0);
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);
  const [loadedTick, setLoadedTick] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [problem, setProblem] = useState<ProblemDetailModel | null>(null);
  const [languages, setLanguages] = useState<LanguageModel[]>([]);
  const [selectedLangId, setSelectedLangId] = useState("");
  const [template, setTemplate] = useState<CodeTemplateModel | null>(null);
  const [code, setCode] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const [confirmReset, setConfirmReset] = useState(false);
  const [editorNotice, setEditorNotice] = useState("");
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");
  const [runNotice, setRunNotice] = useState("");
  const [runResult, setRunResult] = useState<RunDataModel | null>(null);

  const gutterRef = useRef<HTMLDivElement>(null);
  const runAlertRef = useRef<HTMLParagraphElement>(null);
  const langAbortRef = useRef<AbortController | null>(null);
  const runAbortRef = useRef<AbortController | null>(null);

  const loadingProblem =
    status === "authenticated" &&
    Boolean(user) &&
    (loadedSlug !== slug || loadedTick !== reloadTick) &&
    !loadError;

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    return () => {
      langAbortRef.current?.abort();
      runAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    const controller = new AbortController();

    void (async () => {
      try {
        const detail = await api.catalog.getProblem(slug, {
          signal: controller.signal,
        });
        const availableLanguages =
          detail.languages.length > 0
            ? detail.languages
            : await api.catalog.getProblemLanguages(slug, {
                signal: controller.signal,
              });
        const preferredSlug = safeReadStorage(PREFERRED_LANGUAGE_KEY);
        const initialLang = pickInitialLanguage(
          availableLanguages,
          preferredSlug,
        );
        let initialTemplate: CodeTemplateModel | null = null;
        let initialCode = "";
        let restoredDraft = false;

        if (initialLang) {
          initialTemplate = await api.catalog.getTemplate(
            detail.problem.slug,
            initialLang.id,
            { signal: controller.signal },
          );
          const resolved = resolveCodeForLanguage({
            userId: user.id,
            problemSlug: detail.problem.slug,
            languageSlug: initialLang.slug,
            starterCode: initialTemplate.starterCode,
          });
          initialCode = resolved.code;
          restoredDraft = resolved.isFromDraft;
        }

        if (controller.signal.aborted) return;
        setProblem(detail);
        setLanguages(availableLanguages);
        setSelectedLangId(initialLang?.id ?? "");
        setTemplate(initialTemplate);
        setCode(initialCode);
        setLoadError("");
        setRunError("");
        setRunNotice("");
        setRunResult(null);
        setConfirmReset(false);
        setEditorNotice(
          restoredDraft ? "Đã khôi phục bản nháp đã lưu trên trình duyệt." : "",
        );
        setLoadedSlug(slug);
        setLoadedTick(reloadTick);
      } catch (err) {
        if (isAbortError(err, controller.signal.aborted)) return;
        setProblem(null);
        setLoadError(errorText(err));
        setLoadedSlug(slug);
        setLoadedTick(reloadTick);
      }
    })();

    return () => {
      controller.abort();
      langAbortRef.current?.abort();
      runAbortRef.current?.abort();
    };
  }, [api, reloadTick, slug, status, user]);

  useEffect(() => {
    if (runError) {
      runAlertRef.current?.focus();
    }
  }, [runError]);

  const activeLanguage = useMemo(
    () => languages.find((lang) => lang.id === selectedLangId) ?? null,
    [languages, selectedLangId],
  );

  const codeBytes = useMemo(() => utf8ByteLength(code), [code]);
  const lineCount = useMemo(() => Math.max(1, code.split("\n").length), [code]);
  const isDirty = Boolean(template && code !== template.starterCode);
  const isOversize = codeBytes > MAX_EXECUTE_CODE_BYTES;

  async function handleLanguageChange(nextLangId: string) {
    if (!problem || !user || nextLangId === selectedLangId) return;
    const nextLang = languages.find((lang) => lang.id === nextLangId);
    if (!nextLang) return;

    langAbortRef.current?.abort();
    const controller = new AbortController();
    langAbortRef.current = controller;

    setLoadingTemplate(true);
    setConfirmReset(false);
    setRunError("");
    setRunNotice("");

    try {
      const nextTemplate = await api.catalog.getTemplate(
        problem.problem.slug,
        nextLang.id,
        { signal: controller.signal },
      );
      if (langAbortRef.current !== controller || controller.signal.aborted) {
        return;
      }
      safeWriteStorage(PREFERRED_LANGUAGE_KEY, nextLang.slug);
      const resolved = resolveCodeForLanguage({
        userId: user.id,
        problemSlug: problem.problem.slug,
        languageSlug: nextLang.slug,
        starterCode: nextTemplate.starterCode,
      });
      setSelectedLangId(nextLangId);
      setTemplate(nextTemplate);
      setCode(resolved.code);
      setRunResult(null);
      setEditorNotice(
        resolved.isFromDraft
          ? `Đã chuyển sang ${nextLang.displayLabel} và khôi phục bản nháp.`
          : `Đã chuyển sang ${nextLang.displayLabel} với code mẫu.`,
      );
    } catch (err) {
      if (isAbortError(err, controller.signal.aborted)) return;
      setRunError(errorText(err));
    } finally {
      if (langAbortRef.current === controller) {
        langAbortRef.current = null;
        setLoadingTemplate(false);
      }
    }
  }

  function handleCodeChange(nextCode: string) {
    setCode(nextCode);
    setConfirmReset(false);
    setEditorNotice("");
    setRunError("");
    if (!problem || !user || !activeLanguage) return;
    const key = buildDraftStorageKey(
      user.id,
      problem.problem.slug,
      activeLanguage.slug,
    );
    if (template && nextCode === template.starterCode) {
      safeRemoveStorage(key);
    } else {
      safeWriteStorage(key, nextCode);
    }
  }

  function handleConfirmReset() {
    if (!template || !problem || !user || !activeLanguage) return;
    setCode(template.starterCode);
    safeRemoveStorage(
      buildDraftStorageKey(user.id, problem.problem.slug, activeLanguage.slug),
    );
    setConfirmReset(false);
    setRunError("");
    setEditorNotice("Đã đặt lại về code mẫu ban đầu.");
  }

  async function handleRunSamples() {
    if (!problem || !activeLanguage || running) return;
    setRunError("");
    setRunNotice("");
    setConfirmReset(false);

    const precheck = validateCodeBeforeRun(code);
    if (!precheck.ok) {
      setRunError(precheck.message);
      return;
    }

    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;
    setRunResult(null);
    setRunning(true);

    try {
      const outcome = await executeSampleRun(
        api,
        {
          problemId: problem.problem.id,
          languageId: activeLanguage.id,
          code,
        },
        controller.signal,
      );
      if (runAbortRef.current !== controller) return;
      if (outcome.kind === "result") {
        setRunResult(outcome.data);
      } else if (outcome.kind === "cancelled") {
        setRunNotice("Đã hủy lượt chạy thử mẫu.");
      } else {
        setRunError(outcome.message);
      }
    } finally {
      if (runAbortRef.current === controller) {
        runAbortRef.current = null;
        setRunning(false);
      }
    }
  }

  function handleCancelRun() {
    runAbortRef.current?.abort();
  }

  function handleRetryLoad() {
    setLoadError("");
    setReloadTick((n) => n + 1);
  }

  if (status !== "authenticated" || !user) {
    return (
      <main className="workspace-main">
        <section className="card">
          <SessionNotice />
        </section>
      </main>
    );
  }

  if (loadingProblem) {
    return (
      <main className="workspace-main">
        <section className="card" aria-busy="true">
          <p className="muted">CODJINGRANK / LUYỆN TẬP</p>
          <h1>Đang tải nội dung bài tập…</h1>
          <p className="muted" role="status">
            Đang lấy đề bài, ví dụ mẫu và code khởi tạo cho bạn.
          </p>
          <div className="actions">
            <Link href="/protected" className="btn-link btn-secondary">
              ← Về tài khoản
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (loadError || !problem) {
    return (
      <main className="workspace-main">
        <section className="card">
          <p className="muted">CODJINGRANK / LUYỆN TẬP</p>
          <h1>Không thể mở bài tập</h1>
          <p className="error" role="alert">
            {loadError || "Không tìm thấy dữ liệu bài tập."}
          </p>
          <div className="actions">
            <button type="button" onClick={handleRetryLoad}>
              Thử tải lại
            </button>
            <Link href="/protected" className="btn-link btn-secondary">
              ← Về tài khoản
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const summaryMeta = runResult ? VERDICT_META[runResult.status] : null;

  return (
    <main className="workspace-main">
      <SessionNotice />

      <header className="card workspace-header">
        <div className="workspace-header-top">
          <Link href="/protected" className="back-link">
            ← Về tài khoản
          </Link>
          <span className="badge badge-neutral">
            {DIFFICULTY_LABELS[problem.problem.difficulty]}
          </span>
          <span
            className={`badge ${
              problem.problem.solved ? "badge-pass" : "badge-neutral"
            }`}
          >
            {problem.problem.solved ? "Đã giải" : "Chưa giải"}
          </span>
          <span className="muted">
            Tỷ lệ đạt: {problem.problem.formattedAcceptanceRate}
          </span>
        </div>

        <h1>{problem.problem.title}</h1>

        {problem.problem.tags.length > 0 && (
          <div className="tag-list" aria-label="Thẻ chủ đề">
            {problem.problem.tags.map((tag) => (
              <span key={tag.id} className="tag-chip">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="workspace-grid">
        <section
          className="card workspace-pane"
          aria-labelledby="statement-heading"
        >
          <div className="pane-header">
            <h2 id="statement-heading">Đề bài &amp; Ví dụ mẫu</h2>
            <p className="muted pane-meta">
              Giới hạn: {problem.timeLimitMs} ms · {problem.memoryLimitMb} MB ·{" "}
              {problem.isFunctionMode
                ? `Hàm ${problem.functionName ?? ""}`
                : "Chuẩn vào/ra (stdin/stdout)"}
            </p>
          </div>

          <div className="statement-body">{problem.statementMd}</div>

          <div className="samples-preview">
            <h3>Bộ test mẫu công khai ({problem.sampleTestCases.length})</h3>
            {problem.sampleTestCases.length === 0 ? (
              <p className="muted">Bài này chưa có ví dụ mẫu.</p>
            ) : (
              problem.sampleTestCases.map((sample) => (
                <article key={sample.id} className="sample-box">
                  <div className="sample-box-title">
                    <strong>Mẫu #{sample.displayOrder}</strong>
                  </div>
                  <div className="io-grid">
                    <div className="io-col">
                      <span className="io-label">Đầu vào (stdin)</span>
                      <pre className="io-pre">
                        {formatOutputText(sample.inputData)}
                      </pre>
                    </div>
                    <div className="io-col">
                      <span className="io-label">Kết quả kỳ vọng</span>
                      <pre className="io-pre">
                        {formatOutputText(sample.expectedOutput)}
                      </pre>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section
          className="card workspace-pane"
          aria-labelledby="editor-heading"
        >
          <div className="pane-header">
            <div>
              <h2 id="editor-heading">Trình soạn code</h2>
              <p className="muted pane-meta">
                {template
                  ? `Tệp: ${template.fileName}`
                  : "Chưa có ngôn ngữ khả dụng"}{" "}
                · Dung lượng:{" "}
                <strong className={isOversize ? "error-inline" : undefined}>
                  {codeBytes.toLocaleString("vi-VN")} /{" "}
                  {MAX_EXECUTE_CODE_BYTES.toLocaleString("vi-VN")} byte
                </strong>
                {isDirty && (
                  <span className="draft-indicator"> · Đã lưu nháp</span>
                )}
              </p>
            </div>

            <div className="editor-controls">
              <div className="lang-picker">
                <label htmlFor="language-select">Ngôn ngữ</label>
                <select
                  id="language-select"
                  value={selectedLangId}
                  disabled={
                    running || loadingTemplate || languages.length === 0
                  }
                  onChange={(e) => void handleLanguageChange(e.target.value)}
                >
                  {languages.length === 0 ? (
                    <option value="">Không có ngôn ngữ</option>
                  ) : (
                    languages.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.displayLabel}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="button"
                className="btn-secondary"
                disabled={!template || !isDirty || running || loadingTemplate}
                onClick={() => setConfirmReset((v) => !v)}
              >
                ↺ Đặt lại code mẫu
              </button>
            </div>
          </div>

          {confirmReset && (
            <div
              className="confirm-bar"
              role="region"
              aria-label="Xác nhận đặt lại"
            >
              <span>
                Đặt lại code về mẫu ban đầu? Chỉnh sửa hiện tại cho ngôn ngữ này
                sẽ bị thay thế.
              </span>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleConfirmReset}
                >
                  Xác nhận đặt lại
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setConfirmReset(false)}
                >
                  Giữ nguyên
                </button>
              </div>
            </div>
          )}

          {editorNotice && (
            <p className="muted editor-status" role="status">
              {editorNotice}
            </p>
          )}

          <label htmlFor="code-editor" className="sr-only">
            Mã nguồn bài làm
          </label>
          <div className="code-editor-shell">
            <div ref={gutterRef} className="code-gutter" aria-hidden="true">
              {Array.from({ length: lineCount }, (_, index) => (
                <div key={index + 1}>{index + 1}</div>
              ))}
            </div>
            <textarea
              id="code-editor"
              className="code-textarea"
              value={code}
              disabled={running || loadingTemplate || !activeLanguage}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              onScroll={(e) => {
                if (gutterRef.current) {
                  gutterRef.current.scrollTop = e.currentTarget.scrollTop;
                }
              }}
              onChange={(e) => handleCodeChange(e.target.value)}
            />
          </div>

          <div className="run-toolbar">
            <p className="muted run-scope-note">
              Chỉ chạy với test mẫu công khai —{" "}
              <strong>không tạo submission</strong>.
            </p>
            <div className="actions">
              <button
                type="button"
                disabled={
                  running || loadingTemplate || !activeLanguage || isOversize
                }
                onClick={() => void handleRunSamples()}
              >
                {running ? "Đang chạy thử mẫu…" : "▶ Chạy thử mẫu"}
              </button>
              {running && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelRun}
                >
                  ⏹ Hủy chạy
                </button>
              )}
            </div>
          </div>

          {runNotice && (
            <p className="muted" role="status">
              {runNotice}
            </p>
          )}

          {runError && (
            <p ref={runAlertRef} tabIndex={-1} className="error" role="alert">
              {runError}
            </p>
          )}
        </section>
      </div>

      <section
        className="card results-section"
        aria-labelledby="results-heading"
        aria-live="polite"
      >
        <div className="results-header">
          <div>
            <h2 id="results-heading">Kết quả chạy thử mẫu</h2>
            <p className="muted pane-meta">
              Hiển thị trạng thái, thời gian chạy, output kỳ vọng/thực tế và lỗi
              từng test mẫu.
            </p>
          </div>

          {runResult && summaryMeta && (
            <div className="results-badges">
              <span className={`badge badge-${summaryMeta.tone}`}>
                {summaryMeta.label}
              </span>
              <span className="badge badge-neutral">
                Đạt {runResult.passed}/{runResult.total} test mẫu
              </span>
              <span className="badge badge-neutral">Chưa tạo submission</span>
            </div>
          )}
        </div>

        {!runResult ? (
          <p className="muted results-empty">
            {running
              ? "Đang gửi code tới dịch vụ chạy thử mẫu…"
              : "Chưa có kết quả chạy thử. Bấm «▶ Chạy thử mẫu» ở trên để xem chi tiết từng test."}
          </p>
        ) : runResult.results.length === 0 ? (
          <p className="muted results-empty">
            Phiên chạy thử không trả về chi tiết test mẫu nào.
          </p>
        ) : (
          <div className="sample-results-list">
            {runResult.results.map((item, idx) => {
              const itemMeta = VERDICT_META[item.status];
              const hasDiagnostic = Boolean(
                item.errorType || item.errorMessage || item.stderr,
              );
              return (
                <article
                  key={`${item.testCaseId}-${idx}`}
                  className="sample-box"
                >
                  <div className="sample-result-head">
                    <div className="sample-result-title">
                      <strong>Mẫu #{idx + 1}</strong>
                      <span className={`badge badge-${itemMeta.tone}`}>
                        {itemMeta.label}
                      </span>
                    </div>
                    <span className="runtime-pill">
                      Thời gian:{" "}
                      {item.runtimeMs !== null ? `${item.runtimeMs} ms` : "—"}
                    </span>
                  </div>

                  <div className="io-grid io-grid-3">
                    <div className="io-col">
                      <span className="io-label">Đầu vào (stdin)</span>
                      <pre className="io-pre">
                        {formatOutputText(item.inputData)}
                      </pre>
                    </div>
                    <div className="io-col">
                      <span className="io-label">Kết quả kỳ vọng</span>
                      <pre className="io-pre">
                        {formatOutputText(item.expectedOutput)}
                      </pre>
                    </div>
                    <div className="io-col">
                      <span className="io-label">Kết quả thực tế</span>
                      <pre
                        className={`io-pre ${
                          !item.isPassed &&
                          item.actualOutput !== item.expectedOutput
                            ? "io-pre-mismatch"
                            : ""
                        }`}
                      >
                        {formatOutputText(item.actualOutput)}
                      </pre>
                    </div>
                  </div>

                  {hasDiagnostic && (
                    <div
                      className="diagnostic-box"
                      role="region"
                      aria-label={`Chi tiết lỗi mẫu ${idx + 1}`}
                    >
                      <div className="diagnostic-head">
                        <strong>Chi tiết lỗi</strong>
                        {item.errorType && (
                          <span className="badge badge-fail">
                            {item.errorType}
                          </span>
                        )}
                      </div>
                      {item.errorMessage && (
                        <p className="error diagnostic-message">
                          {item.errorMessage}
                        </p>
                      )}
                      {item.stderr && (
                        <pre className="io-pre io-pre-error">{item.stderr}</pre>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
