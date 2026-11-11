import { ApiError, errorText } from "@/lib/api/client";
import type { ProblemState } from "./resource";
import { Statement } from "./Statement";

export function ProblemContent({
  state,
  reload,
  selectLanguage,
}: {
  state: ProblemState;
  reload: () => void;
  selectLanguage: (id: string) => void;
}) {
  if (state.status === "loading") return <p role="status">Đang tải đề bài…</p>;
  if (state.status === "error" || !state.detail) {
    const error = state.error;
    const title =
      error instanceof ApiError && error.code === "LEVEL_LOCKED"
        ? "Bài tập chưa mở khóa"
        : error instanceof ApiError && error.status === 404
          ? "Không tìm thấy bài tập"
          : "Chưa thể tải đề bài";
    return (
      <section className="card" role="alert">
        <h1>{title}</h1>
        <p>{errorText(error)}</p>
        <button type="button" onClick={reload}>
          Thử tải lại
        </button>
      </section>
    );
  }
  const { detail, languageId, template, templateStatus, templateError } = state;
  const { problem } = detail;
  const difficulty = { easy: "Dễ", medium: "Trung bình", hard: "Khó" }[
    problem.difficulty
  ];
  return (
    <>
      <header className="problem-heading">
        <p className="muted">{problem.packageSlug} / Bài tập</p>
        <h1>{problem.title}</h1>
        <div className="problem-meta">
          <span className="problem-badge">{difficulty}</span>
          <span>{problem.solved ? "Đã giải" : "Chưa giải"}</span>
          <span>Tỷ lệ Accepted: {problem.formattedAcceptanceRate}</span>
        </div>
        {problem.tags.length > 0 && (
          <ul className="problem-tags" aria-label="Chủ đề">
            {problem.tags.map((tag) => (
              <li key={tag.id}>{tag.name}</li>
            ))}
          </ul>
        )}
      </header>
      <div className="problem-columns">
        <article
          className="card problem-statement"
          aria-labelledby="statement-heading"
        >
          <h2 id="statement-heading">Đề bài</h2>
          <dl className="problem-limits">
            <div>
              <dt>Thời gian</dt>
              <dd>{detail.timeLimitMs} ms</dd>
            </div>
            <div>
              <dt>Bộ nhớ</dt>
              <dd>{detail.memoryLimitMb} MB</dd>
            </div>
            <div>
              <dt>Đầu ra tối đa</dt>
              <dd>{detail.outputLimitBytes} byte</dd>
            </div>
          </dl>
          <Statement>{detail.statementMd}</Statement>
          <section aria-labelledby="samples-heading">
            <h2 id="samples-heading">Ví dụ mẫu</h2>
            {!detail.sampleTestCases.length && (
              <p className="muted">Bài này chưa có ví dụ mẫu.</p>
            )}
            {detail.sampleTestCases.map((sample, index) => (
              <section className="problem-sample" key={sample.id}>
                <h3>Ví dụ {index + 1}</h3>
                <h4>Đầu vào</h4>
                {sample.inputData === null ? (
                  <p className="muted">Không có đầu vào.</p>
                ) : (
                  <pre tabIndex={0} aria-label={`Đầu vào ví dụ ${index + 1}`}>
                    <code>{sample.inputData}</code>
                  </pre>
                )}
                <h4>Đầu ra mong đợi</h4>
                <pre tabIndex={0} aria-label={`Đầu ra ví dụ ${index + 1}`}>
                  <code>{sample.expectedOutput}</code>
                </pre>
              </section>
            ))}
          </section>
        </article>
        <aside
          className="card problem-template"
          aria-labelledby="template-heading"
        >
          <h2 id="template-heading">Mã khởi đầu</h2>
          <p className="muted">
            {detail.isFunctionMode
              ? `Hoàn thành hàm ${detail.functionName || "theo đề bài"}.`
              : "Đọc từ đầu vào chuẩn, ghi ra đầu ra chuẩn."}
          </p>
          {detail.languages.length === 0 ? (
            <p role="status">Chưa có ngôn ngữ khả dụng cho bài này.</p>
          ) : (
            <>
              <label htmlFor="problem-language">Ngôn ngữ lập trình</label>
              <select
                id="problem-language"
                value={languageId}
                onChange={(event) => selectLanguage(event.target.value)}
              >
                {detail.languages.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.displayLabel}
                  </option>
                ))}
              </select>
              <div aria-busy={templateStatus === "loading"}>
                {templateStatus === "loading" && (
                  <p role="status">Đang tải mã khởi đầu…</p>
                )}
                {templateStatus === "error" && (
                  <div role="alert">
                    <p className="error">{errorText(templateError)}</p>
                    <button
                      type="button"
                      onClick={() => selectLanguage(languageId)}
                    >
                      Thử tải mã lại
                    </button>
                  </div>
                )}
                {templateStatus === "ready" && template && (
                  <>
                    <p className="problem-filename">{template.fileName}</p>
                    <pre tabIndex={0} aria-label="Mã khởi đầu">
                      <code>{template.starterCode}</code>
                    </pre>
                    {template.starterCode === "" && (
                      <p className="muted">
                        Template rỗng. Hãy viết mã theo đề bài.
                      </p>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
