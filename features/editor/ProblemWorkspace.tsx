"use client";

import Link from "next/link";
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
        <details className="sample" key={sample.id}>
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
        <Link className="workspace-brand" href="/problems">
          <span aria-hidden="true">c.</span>codjingrank
        </Link>
        <div>
          <Link href="/packages">Gói bài tập</Link>
          <Link href="/problems">Kho bài</Link>
          <Link href="/protected">Tài khoản</Link>
        </div>
      </nav>
      <p className="breadcrumb muted">
        <Link href="/problems">Kho bài tập</Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/packages/${problem.problem.packageSlug}`}>
          {problem.problem.packageSlug}
        </Link>
      </p>

      <header className="workspace-header">
        <div>
          <span
            className={`workspace-difficulty workspace-difficulty--${problem.problem.difficulty}`}
          >
            {DIFFICULTY_LABEL[problem.problem.difficulty]}
          </span>
          <h1>{problem.problem.title}</h1>
        </div>
        <ul className="badges" aria-label="Thông tin bài tập">
          <li>{problem.timeLimitMs} ms</li>
          <li>{problem.memoryLimitMb} MB</li>
          <li>Đầu ra tối đa: {problem.outputLimitBytes} byte</li>
          <li>Accepted: {problem.problem.formattedAcceptanceRate}</li>
          <li>
            {problem.executionMode === "function"
              ? `Hàm ${problem.functionName ?? "—"}`
              : "stdin → stdout"}
          </li>
          {problem.problem.solved && <li className="badge-solved">Đã giải</li>}
        </ul>
      </header>

      <div className="workspace-grid">
        <section className="panel" aria-labelledby="statement-heading">
          <h2 id="statement-heading">Đề bài</h2>
          {problem.problem.tags.length > 0 && (
            <ul className="tags" aria-label="Thẻ">
              {problem.problem.tags.map((tag) => (
                <li key={tag.id}>{tag.name}</li>
              ))}
            </ul>
          )}
          <Statement>
            {problem.statementMd || "Đề bài chưa có nội dung."}
          </Statement>
          <Samples samples={problem.sampleTestCases} />
        </section>

        <div className="workspace-coding-column">
          <section
            className="panel editor-panel"
            aria-labelledby="editor-heading"
          >
            <div className="editor-heading-row">
              <h2 id="editor-heading">Code</h2>
              <span className="file-name" title="Tên tệp nộp bài">
                {snapshot.fileName || "Chưa có tệp"}
              </span>
            </div>

            <div className="editor-toolbar">
              <div className="field">
                <label htmlFor="language-select">Ngôn ngữ</label>
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
                className="button-secondary"
                onClick={onResetStarter}
                disabled={!canEdit || snapshot.code === snapshot.starterCode}
                title="Xoá nháp và trả về đúng mã khởi tạo của bài"
              >
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

            <p
              id="editor-save"
              className={saveError ? "error editor-save" : "muted editor-save"}
              aria-live="polite"
            >
              {saveMessage(snapshot.saveState, snapshot.savedAt)}
            </p>

            <div className="editor-meta">
              <p id="editor-hint" className="muted">
                Tab chèn 4 dấu cách; Esc rồi Tab để rời editor. Nháp lưu riêng
                theo tài khoản, bài và ngôn ngữ; đăng xuất sẽ xóa nháp.
              </p>
              <p className={tooLarge ? "error" : "muted"}>
                {bytes.toLocaleString("vi-VN")} byte
                {tooLarge
                  ? ` — vượt giới hạn ${MAX_EXECUTE_CODE_BYTES.toLocaleString("vi-VN")} byte; Run/Submit sẽ từ chối.`
                  : ""}
              </p>
            </div>
          </section>
          <RunPanel key={`run:${problem.problem.id}`} workspace={snapshot} />
          <SubmissionPanel key={problem.problem.id} workspace={snapshot} />
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
