"use client";

import Link from "next/link";
import { BrandLogo } from "@/lib/ui/BrandLogo";
import { ThemeToggle } from "@/lib/ui/ThemeToggle";
import { WorkspaceSeparator } from "./WorkspaceSeparator";
import { useState, type CSSProperties } from "react";
import { Icon } from "@/lib/ui/Icon";
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

function Samples({ samples }: { samples: SampleModel[] }) {
  if (samples.length === 0) return null;
  return (
    <section className="samples" aria-labelledby="samples-heading">
      <h2 id="samples-heading">Ví dụ mẫu</h2>
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
  const [resultTab, setResultTab] = useState<"run" | "submission">("run");
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
    <main className="workspace-main workspace-prototype">
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
                <select
                  id="language-select"
                  value={snapshot.selectedLanguageId ?? ""}
                  onChange={(event) => onSelectLanguage(event.target.value)}
                >
                  {snapshot.languages.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.displayLabel}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="button-secondary workspace-reset"
                onClick={onResetStarter}
                disabled={!canEdit || snapshot.code === snapshot.starterCode}
                title="Xoá nháp và trả về đúng mã khởi tạo của bài"
              >
                <Icon name="reset" />
                Đặt lại mã khởi tạo
              </button>
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
          <section className="workspace-console" aria-label="Kết quả thực thi">
            <div
              className="workspace-result-tabs"
              role="tablist"
              aria-label="Kết quả"
            >
              {(["run", "submission"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={`result-tab-${tab}`}
                  aria-controls={`result-panel-${tab}`}
                  aria-selected={resultTab === tab}
                  tabIndex={resultTab === tab ? 0 : -1}
                  onClick={() => setResultTab(tab)}
                  onKeyDown={(event) => {
                    if (
                      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                        event.key,
                      )
                    ) {
                      event.preventDefault();
                      const next =
                        event.key === "Home"
                          ? "run"
                          : event.key === "End"
                            ? "submission"
                            : tab === "run"
                              ? "submission"
                              : "run";
                      setResultTab(next);
                      document.getElementById(`result-tab-${next}`)?.focus();
                    }
                  }}
                >
                  <Icon name={tab === "run" ? "check" : "history"} />
                  {tab === "run" ? "Kết quả chạy" : "Bài nộp"}
                </button>
              ))}
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
                onRunStart={() => setResultTab("run")}
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
                onSubmitStart={() => setResultTab("submission")}
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
