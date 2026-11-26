"use client";

import { RoundedSelect } from "@/lib/ui/RoundedSelect";
import Link from "next/link";
import { BrandLogo } from "@/lib/ui/BrandLogo";
import { ThemeToggle } from "@/lib/ui/ThemeToggle";
import { WorkspaceSeparator } from "./WorkspaceSeparator";
import { WorkspaceTools } from "./WorkspaceTools";
import { useEffect, useState, type CSSProperties } from "react";
import { Icon } from "@/lib/ui/Icon";
import { SegmentedControl } from "@/lib/ui/SegmentedControl";
import "./workspace-prototype.css";
import { RunPanel } from "@/features/problem-run/RunPanel";
import { SubmissionPanel } from "@/features/submissions/SubmissionPanel";
import { Statement } from "@/features/problems/Statement";
import type { SampleModel } from "@/lib/api/adapters/catalog";
import { errorText } from "@/lib/api/client";
import { MAX_EXECUTE_CODE_BYTES } from "@/lib/api/domains/preflight";
import { utf8ByteLength } from "@/lib/api/guards";
import type { LevelDifficulty } from "@/lib/api/types";
import { MemoCodeEditor as CodeEditor } from "./CodeEditor";
import { resolveEditorLanguage } from "./highlight";
import { useProblemWorkspace } from "./useProblemWorkspace";
import type {
  DraftSaveState,
  WorkspaceErrorKind,
  WorkspaceSnapshot,
} from "./workspace";

const DIFFICULTY_LABEL: Record<LevelDifficulty, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

function formatSavedAt(timestamp: number | null): string {
  if (timestamp === null) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function saveMessage(
  saveState: DraftSaveState,
  savedAt: number | null,
): string {
  switch (saveState) {
    case "saving":
      return "Đang lưu nháp…";
    case "saved":
      return savedAt === null
        ? "Đã lưu nháp."
        : `Đã lưu nháp lúc ${formatSavedAt(savedAt)}.`;
    case "starter":
      return "Đang dùng mã khởi tạo; nháp cho ngôn ngữ này đã được xoá.";
    case "error":
      return "Không lưu được nháp trên trình duyệt này. Mã vẫn còn trong phiên hiện tại.";
    case "unavailable":
      return "Trình duyệt không cho phép lưu nháp; tải lại trang sẽ mất mã.";
    default:
      return "Nháp được tự lưu riêng theo bài và ngôn ngữ.";
  }
}

function Samples({
  samples,
  headingId = "samples-heading",
}: {
  samples: SampleModel[];
  headingId?: string;
}) {
  if (samples.length === 0) return null;
  return (
    <section className="samples" aria-labelledby={headingId}>
      <h2 id={headingId}>Ví dụ mẫu</h2>
      {samples.map((sample) => (
        <details className="sample" key={sample.id} open>
          <summary>Ví dụ {sample.displayOrder}</summary>
          <div className="sample-grid">
            <div>
              <p className="sample-label">Input</p>
              <pre>{sample.inputData ?? "(không có dữ liệu vào)"}</pre>
            </div>
            <div>
              <p className="sample-label">Output mong đợi</p>
              <pre>{sample.expectedOutput}</pre>
            </div>
          </div>
        </details>
      ))}
    </section>
  );
}

function WorkspaceLoading() {
  return (
    <main className="workspace-main workspace-prototype">
      <p className="status-line" role="status">
        <span className="spinner" aria-hidden="true" />
        Đang tải bài tập…
      </p>
    </main>
  );
}

function WorkspaceError({
  kind,
  error,
  onRetry,
}: {
  kind: WorkspaceErrorKind | null;
  error: unknown;
  onRetry: () => void;
}) {
  const title =
    kind === "locked"
      ? "Bài tập đang bị khóa"
      : kind === "not_found"
        ? "Không tìm thấy bài tập"
        : kind === "invalid"
          ? "Đường dẫn bài tập không hợp lệ"
          : "Không tải được bài tập";
  const message =
    kind === "locked"
      ? "Cần hoàn thành hết các cấp độ trước để mở khóa bài này."
      : kind === "not_found"
        ? "Bài tập chưa được xuất bản hoặc không còn tồn tại."
        : kind === "invalid"
          ? "Slug bài tập chỉ gồm chữ thường, số và dấu gạch nối."
          : errorText(error);

  return (
    <main className="workspace-main workspace-prototype">
      <div className="panel error-panel" role="alert">
        <p className="muted">
          <Link href="/protected">← Tài khoản</Link>
        </p>
        <h1>{title}</h1>
        <p>{message}</p>
        <div className="actions">
          <button type="button" onClick={onRetry}>
            Thử lại
          </button>
          <Link className="text-link" href="/protected">
            Về trang tài khoản
          </Link>
        </div>
      </div>
    </main>
  );
}

function WorkspaceReady({
  snapshot,
  onSelectLanguage,
  onChangeCode,
  onResetStarter,
  onRetryTemplate,
}: {
  snapshot: WorkspaceSnapshot;
  onSelectLanguage: (languageId: string) => void;
  onChangeCode: (code: string) => void;
  onResetStarter: () => void;
  onRetryTemplate: () => void;
}) {
  const [resultTab, setResultTab] = useState<"samples" | "run" | "submission">(
    "samples",
  );
  const [focusedEditor, setFocusedEditor] = useState(false);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [copyStatus, setCopyStatus] = useState("");
  useEffect(() => {
    if (!copyStatus) return;
    const timeout = window.setTimeout(() => setCopyStatus(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);
  const [runActionHost, setRunActionHost] = useState<HTMLDivElement | null>(
    null,
  );
  const [submitActionHost, setSubmitActionHost] =
    useState<HTMLDivElement | null>(null);
  const [statementWidth, setStatementWidth] = useState(50);
  const [editorHeight, setEditorHeight] = useState(65);
  const problem = snapshot.problem;
  if (!problem) return null;

  const language =
    snapshot.languages.find(
      (item) => item.id === snapshot.selectedLanguageId,
    ) ?? snapshot.languages[0];
  if (!language) return null;

  const editorLanguage = resolveEditorLanguage(language.slug);
  const bytes = utf8ByteLength(snapshot.code);
  const tooLarge = bytes > MAX_EXECUTE_CODE_BYTES;
  const loadingTemplate =
    snapshot.templatePhase === "loading" || snapshot.templatePhase === "idle";
  const canEdit = snapshot.templatePhase === "ready";
  const saveError =
    snapshot.saveState === "error" || snapshot.saveState === "unavailable";

  return (
    <main
      className="workspace-main workspace-prototype"
      data-focused-editor={focusedEditor}
      data-console-collapsed={consoleCollapsed}
      style={{ "--ws-font-size": `${fontSize}px` } as CSSProperties}
    >
      <nav className="workspace-topbar" aria-label="Điều hướng luyện tập">
        <div className="workspace-navigation">
          <Link
            className="workspace-brand"
            href="/problems"
            aria-label="Codjingrank · Kho bài tập"
          >
            <BrandLogo compact />
          </Link>
          <Link className="workspace-catalog-link" href="/problems">
            <Icon name="file" />
            Kho bài tập
          </Link>
          <span className="workspace-current-problem">
            {problem.problem.title}
          </span>
        </div>
        <div className="workspace-primary-actions">
          <div ref={setRunActionHost} />
          <div ref={setSubmitActionHost} />
        </div>
        <div className="workspace-account-links">
          <WorkspaceTools fontSize={fontSize} onFontSize={setFontSize} />
          <ThemeToggle />
          <Link href="/packages">Gói bài tập</Link>
          <Link href="/protected">Tài khoản</Link>
        </div>
      </nav>
      <div
        className="workspace-grid workspace-shell"
        style={{ "--statement-width": `${statementWidth}%` } as CSSProperties}
      >
        <section
          className="panel workspace-statement-panel"
          id="statement-pane"
          aria-labelledby="statement-heading"
        >
          <div className="workspace-pane-bar">
            <h2 id="statement-heading">
              <Icon name="file" />
              Đề bài
            </h2>
            <button
              type="button"
              className="workspace-description-submissions"
              onClick={() => {
                setResultTab("submission");
                setConsoleCollapsed(false);
                requestAnimationFrame(() =>
                  document.getElementById("result-tab-submission")?.focus(),
                );
              }}
            >
              <Icon name="history" />
              Bài nộp
            </button>
            <Link href={`/packages/${problem.problem.packageSlug}`}>
              {problem.problem.packageSlug}
            </Link>
          </div>
          <div className="workspace-statement-scroll">
            <header className="workspace-header">
              <h1>{problem.problem.title}</h1>
              <div className="workspace-problem-meta">
                <span
                  className={`workspace-difficulty workspace-difficulty--${problem.problem.difficulty}`}
                >
                  {DIFFICULTY_LABEL[problem.problem.difficulty]}
                </span>
                <span>Accepted: {problem.problem.formattedAcceptanceRate}</span>
                {problem.problem.solved && (
                  <span className="workspace-solved">
                    <Icon name="check" />
                    Đã giải
                  </span>
                )}
              </div>
              {problem.problem.tags.length > 0 && (
                <ul className="tags" aria-label="Thẻ">
                  {problem.problem.tags.map((tag) => (
                    <li key={tag.id}>{tag.name}</li>
                  ))}
                </ul>
              )}
            </header>
            <Statement>
              {problem.statementMd || "Đề bài chưa có nội dung."}
            </Statement>
            <Samples samples={problem.sampleTestCases} />
            <div className="workspace-constraints">
              <h2>Giới hạn thực thi</h2>
              <dl>
                <div>
                  <dt>Thời gian</dt>
                  <dd>{problem.timeLimitMs} ms</dd>
                </div>
                <div>
                  <dt>Bộ nhớ</dt>
                  <dd>{problem.memoryLimitMb} MB</dd>
                </div>
                <div>
                  <dt>Đầu ra tối đa</dt>
                  <dd>{problem.outputLimitBytes} byte</dd>
                </div>
                <div>
                  <dt>Chế độ</dt>
                  <dd>
                    {problem.executionMode === "function"
                      ? `Hàm ${problem.functionName ?? "—"}`
                      : "stdin → stdout"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
        <WorkspaceSeparator
          orientation="vertical"
          value={statementWidth}
          label="Độ rộng đề bài"
          controls="statement-pane"
          onChange={setStatementWidth}
        />
        <div
          className="workspace-coding-column"
          style={{ "--editor-height": `${editorHeight}%` } as CSSProperties}
        >
          <section
            className="panel editor-panel"
            id="editor-pane"
            aria-labelledby="editor-heading"
          >
            <div className="workspace-pane-bar">
              <h2 id="editor-heading">
                <Icon name="code" />
                Code
              </h2>
              <span className="file-name" title="Tên tệp nộp bài">
                {snapshot.fileName || "Chưa có tệp"}
              </span>
            </div>
            <div className="editor-toolbar">
              <div className="field">
                <label htmlFor="language-select" className="sr-only">
                  Ngôn ngữ
                </label>
                <RoundedSelect
                  label="Ngôn ngữ"
                  id="language-select"
                  value={snapshot.selectedLanguageId ?? ""}
                  onChange={(event) => onSelectLanguage(event.target.value)}
                >
                  {snapshot.languages.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.displayLabel}
                    </option>
                  ))}
                </RoundedSelect>
              </div>
              <div className="workspace-editor-tools">
                <span className="workspace-copy-status" role="status">
                  {copyStatus}
                </span>
                <button
                  type="button"
                  className="workspace-icon-button"
                  aria-label="Sao chép mã nguồn"
                  title="Sao chép mã nguồn"
                  disabled={!canEdit}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(snapshot.code);
                      setCopyStatus("Đã sao chép");
                    } catch {
                      setCopyStatus(
                        "Không thể sao chép. Chọn mã và nhấn Ctrl+C.",
                      );
                    }
                  }}
                >
                  <Icon name="copy" />
                </button>
                <button
                  type="button"
                  className="workspace-icon-button workspace-reset"
                  onClick={onResetStarter}
                  disabled={!canEdit || snapshot.code === snapshot.starterCode}
                  title="Đặt lại mã khởi tạo"
                  aria-label="Đặt lại mã khởi tạo"
                >
                  <Icon name="reset" />
                </button>
                <button
                  type="button"
                  className="workspace-icon-button"
                  aria-label={
                    consoleCollapsed ? "Hiện kết quả" : "Thu gọn kết quả"
                  }
                  title={consoleCollapsed ? "Hiện kết quả" : "Thu gọn kết quả"}
                  aria-expanded={!consoleCollapsed}
                  aria-controls="workspace-results"
                  onClick={() => {
                    setFocusedEditor(false);
                    setConsoleCollapsed(!consoleCollapsed);
                  }}
                >
                  <Icon name="collapse" />
                </button>
                <button
                  type="button"
                  className="workspace-icon-button"
                  aria-label={
                    focusedEditor
                      ? "Thoát chế độ tập trung"
                      : "Phóng to trình soạn thảo"
                  }
                  title={
                    focusedEditor
                      ? "Thoát chế độ tập trung"
                      : "Phóng to trình soạn thảo"
                  }
                  aria-pressed={focusedEditor}
                  onClick={() => setFocusedEditor(!focusedEditor)}
                >
                  <Icon name={focusedEditor ? "close" : "expand"} />
                </button>
              </div>
            </div>
            {snapshot.draftRestored && (
              <p className="notice" role="status">
                Đã khôi phục bản nháp đã lưu cho {language.displayLabel}.
              </p>
            )}
            <div className="editor-stage">
              <CodeEditor
                value={snapshot.code}
                onChange={onChangeCode}
                language={editorLanguage}
                label={`Mã nguồn ${language.name} cho bài ${problem.problem.title}`}
                describedBy="editor-hint editor-save"
                disabled={!canEdit}
              />
              {loadingTemplate && (
                <div className="editor-overlay" role="status">
                  <span className="spinner" aria-hidden="true" />
                  Đang tải mã khởi tạo…
                </div>
              )}
              {snapshot.templatePhase === "error" && (
                <div
                  className="editor-overlay editor-overlay--error"
                  role="alert"
                >
                  <p>Không tải được mã khởi tạo.</p>
                  <p className="muted">{errorText(snapshot.templateError)}</p>
                  <button type="button" onClick={onRetryTemplate}>
                    Thử lại
                  </button>
                </div>
              )}
            </div>
            <div className="workspace-editor-footer">
              <p
                id="editor-save"
                className={
                  saveError ? "error editor-save" : "muted editor-save"
                }
                aria-live="polite"
              >
                {saveMessage(snapshot.saveState, snapshot.savedAt)}
              </p>
              <span className={tooLarge ? "error" : "muted"}>
                {bytes.toLocaleString("vi-VN")} byte
                {tooLarge ? " · Vượt giới hạn" : ""}
              </span>
            </div>
            <p id="editor-hint" className="workspace-editor-hint">
              Tab: 4 dấu cách · Esc rồi Tab: rời editor · Nháp theo tài khoản,
              bài và ngôn ngữ; đăng xuất sẽ xóa nháp.
            </p>
          </section>
          <WorkspaceSeparator
            orientation="horizontal"
            value={editorHeight}
            min={35}
            max={78}
            label="Chiều cao trình soạn thảo"
            controls="editor-pane"
            onChange={setEditorHeight}
          />
          <section
            className="workspace-console"
            id="workspace-results"
            aria-label="Kết quả thực thi"
          >
            <SegmentedControl
              className="workspace-result-tabs"
              label="Kết quả"
              value={resultTab}
              onChange={(value) =>
                setResultTab(value as "samples" | "run" | "submission")
              }
              options={[
                {
                  value: "samples",
                  label: "Test mẫu",
                  icon: "code",
                  id: "result-tab-samples",
                  controls: "result-panel-samples",
                },
                {
                  value: "run",
                  label: "Kết quả chạy",
                  icon: "check",
                  id: "result-tab-run",
                  controls: "result-panel-run",
                },
                {
                  value: "submission",
                  label: "Bài nộp",
                  icon: "history",
                  id: "result-tab-submission",
                  controls: "result-panel-submission",
                },
              ]}
            />
            <div
              className="workspace-console-panel workspace-testcases"
              id="result-panel-samples"
              role="tabpanel"
              aria-labelledby="result-tab-samples"
              hidden={resultTab !== "samples"}
              tabIndex={0}
            >
              <Samples
                samples={problem.sampleTestCases}
                headingId="testcases-heading"
              />
              {problem.sampleTestCases.length === 0 && (
                <p>Đề bài chưa có test mẫu công khai.</p>
              )}
              <p className="muted">
                Test công khai của đề bài. Chạy thử mẫu để xem output thực tế.
              </p>
            </div>
            <div
              className="workspace-console-panel"
              id="result-panel-run"
              role="tabpanel"
              aria-labelledby="result-tab-run"
              hidden={resultTab !== "run"}
              tabIndex={0}
            >
              <RunPanel
                key={`run:${problem.problem.id}`}
                workspace={snapshot}
                actionHost={runActionHost}
                onRunStart={() => {
                  setFocusedEditor(false);
                  setConsoleCollapsed(false);
                  setResultTab("run");
                }}
              />
            </div>
            <div
              className="workspace-console-panel"
              id="result-panel-submission"
              role="tabpanel"
              aria-labelledby="result-tab-submission"
              hidden={resultTab !== "submission"}
              tabIndex={0}
            >
              <SubmissionPanel
                key={problem.problem.id}
                workspace={snapshot}
                actionHost={submitActionHost}
                onSubmitStart={() => {
                  setFocusedEditor(false);
                  setConsoleCollapsed(false);
                  setResultTab("submission");
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export function ProblemWorkspace({ slug }: { slug: string }) {
  const { snapshot, controller } = useProblemWorkspace(slug);

  if (snapshot.phase === "loading") return <WorkspaceLoading />;

  if (snapshot.phase === "error") {
    return (
      <WorkspaceError
        kind={snapshot.errorKind}
        error={snapshot.problemError}
        onRetry={() => void controller.open(slug)}
      />
    );
  }

  return (
    <WorkspaceReady
      snapshot={snapshot}
      onSelectLanguage={(languageId) =>
        void controller.selectLanguage(languageId)
      }
      onChangeCode={controller.changeCode}
      onResetStarter={controller.resetStarter}
      onRetryTemplate={() => void controller.retryTemplate()}
    />
  );
}
