"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useSession } from "@/features/auth/session";
import { ApiError, errorText } from "@/lib/api/client";
import { withDeadline } from "@/lib/api/deadline";
import type { LanguageModel } from "@/lib/api/adapters/catalog";
import type { ProblemSummaryModel } from "@/lib/api/adapters/catalog";
import { useApiClient } from "@/lib/api/useApiClient";
import {
  MAX_POST_CONTENT_CHARS,
  MAX_POST_TITLE_CHARS,
} from "@/lib/api/domains/preflight";
import { ForumMarkdown } from "./ForumMarkdown";
import { ForumShell } from "./ForumShell";
import { FORUM_TYPES, POST_TYPE_LABEL, type ForumPostType } from "./model";
import styles from "./forum.module.css";

type FormState = {
  title: string;
  contentMd: string;
  postType: ForumPostType;
  problemId: string;
  languageId: string;
  codeSnippet: string;
};

const empty: FormState = {
  title: "",
  contentMd: "",
  postType: "discussion",
  problemId: "",
  languageId: "",
  codeSnippet: "",
};

export function PostEditorPage(props: {
  mode: "create" | "edit";
  postId?: string;
}) {
  const { status, user } = useSession();
  if (status !== "authenticated" || !user) {
    return (
      <ForumShell current={props.mode === "create" ? "new" : "post"}>
        {status === "initializing" ? (
          <p role="status">Đang kiểm tra phiên đăng nhập…</p>
        ) : (
          <div>
            <h1>Cần đăng nhập</h1>
            <p>Bạn cần đăng nhập để viết hoặc sửa bài viết.</p>
            <Link href="/login">Đăng nhập</Link>
          </div>
        )}
      </ForumShell>
    );
  }
  return (
    <PostEditorForm
      key={`${user.id}:${props.mode}:${props.postId ?? "new"}`}
      {...props}
    />
  );
}

function PostEditorForm({
  mode,
  postId,
}: {
  mode: "create" | "edit";
  postId?: string;
}) {
  const api = useApiClient();
  const router = useRouter();
  const { status, user } = useSession();
  const [form, setForm] = useState<FormState>(empty);
  const [problems, setProblems] = useState<ProblemSummaryModel[]>([]);
  const [languages, setLanguages] = useState<LanguageModel[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [catalogError, setCatalogError] = useState("");
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const submissionRef = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      submissionRef.current?.abort();
      submissionRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    void withDeadline(
      controller,
      () =>
        api.catalog.listProblems(
          { page: catalogPage, size: 100 },
          { signal: controller.signal },
        ),
      15000,
    )
      .then((page) => {
        if (!controller.signal.aborted) {
          setProblems((previous) =>
            page.page === 1
              ? page.items
              : [
                  ...new Map(
                    [...previous, ...page.items].map((problem) => [
                      problem.id,
                      problem,
                    ]),
                  ).values(),
                ],
          );
          setCatalogTotal(page.total);
          setCatalogLoading(false);
          setCatalogError("");
        }
      })
      .catch((reason) => {
        if (
          (reason instanceof ApiError && reason.code === "REQUEST_TIMEOUT") ||
          !controller.signal.aborted
        ) {
          setCatalogError(errorText(reason));
          setCatalogLoading(false);
        }
      });
    return () => controller.abort();
  }, [api, status, catalogAttempt, catalogPage]);

  useEffect(() => {
    if (mode !== "edit" || !postId || status !== "authenticated") return;
    const controller = new AbortController();
    void withDeadline(
      controller,
      () => api.community.getPost(postId, { signal: controller.signal }),
      15000,
    )
      .then((post) => {
        if (controller.signal.aborted) return;
        if (post.id !== postId || post.author.id !== user?.id) {
          setNotFound(true);
          return;
        }
        setForm({
          title: post.title,
          contentMd: post.contentMd,
          postType: post.postType,
          problemId: post.problemId ?? "",
          languageId: post.languageId ?? "",
          codeSnippet: post.codeSnippet ?? "",
        });
      })
      .catch((reason) => {
        if (
          controller.signal.aborted &&
          !(reason instanceof ApiError && reason.code === "REQUEST_TIMEOUT")
        )
          return;
        if (
          reason instanceof ApiError &&
          (reason.status === 404 || reason.status === 403)
        )
          setNotFound(true);
        else setLoadError(errorText(reason));
        setLoading(false);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api, mode, postId, status, user?.id, loadAttempt]);

  useEffect(() => {
    if (!form.problemId) return;
    const problem = problems.find((item) => item.id === form.problemId);
    if (!problem) return;
    const controller = new AbortController();
    void api.catalog
      .getProblemLanguages(problem.slug, { signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        setLanguages(items);
        setForm((current) =>
          items.some((item) => item.id === current.languageId)
            ? current
            : { ...current, languageId: "" },
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setLanguages([]);
      });
    return () => controller.abort();
  }, [api, form.problemId, problems]);

  function patch(patchValue: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patchValue }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionRef.current) return;
    setError("");
    if (!form.title.trim()) {
      setError("Tiêu đề không được để trống.");
      return;
    }
    if (!form.contentMd.trim()) {
      setError("Nội dung không được để trống.");
      return;
    }
    if (form.postType === "solution" && !form.problemId) {
      setError("Bài viết lời giải phải chọn bài tập liên quan.");
      return;
    }
    const controller = new AbortController();
    submissionRef.current = controller;
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        contentMd: form.contentMd,
        postType: form.postType,
        problemId: form.problemId || null,
        languageId: form.languageId || null,
        codeSnippet: form.codeSnippet.trim() ? form.codeSnippet : null,
      };
      if (mode === "create") {
        const post = await withDeadline(
          controller,
          () =>
            api.community.createPost(payload, { signal: controller.signal }),
          15000,
        );
        if (controller.signal.aborted) return;
        router.push(`/forum/${post.id}`);
      } else if (postId) {
        const post = await withDeadline(
          controller,
          () =>
            api.community.updatePost(postId, payload, {
              signal: controller.signal,
            }),
          15000,
        );
        if (controller.signal.aborted) return;
        router.push(`/forum/${post.id}`);
      }
    } catch (reason) {
      if (submissionRef.current !== controller) return;
      if (
        controller.signal.aborted &&
        !(reason instanceof ApiError && reason.code === "REQUEST_TIMEOUT")
      )
        return;
      setError(
        reason instanceof ApiError && reason.code === "SOLUTION_NOT_ALLOWED"
          ? "Bạn cần giải đạt (Accepted) bài này trước khi chia sẻ lời giải."
          : reason instanceof ApiError &&
              (reason.status === 404 || reason.status === 403)
            ? "Bài viết không tồn tại hoặc bạn không có quyền sửa."
            : errorText(reason),
      );
    } finally {
      if (submissionRef.current === controller) {
        submissionRef.current = null;
        setBusy(false);
      }
    }
  }

  if (status === "initializing" || loading) {
    return (
      <ForumShell current={mode === "create" ? "new" : "post"}>
        <p className={styles.message} role="status">
          Đang chuẩn bị biểu mẫu…
        </p>
      </ForumShell>
    );
  }

  if (loadError) {
    return (
      <ForumShell current="post">
        <div role="alert">
          <h1>Chưa thể tải bài viết để sửa</h1>
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setLoadError("");
              setNotFound(false);
              setLoadAttempt((attempt) => attempt + 1);
            }}
          >
            Thử lại
          </button>
        </div>
      </ForumShell>
    );
  }

  if (notFound) {
    return (
      <ForumShell current="post">
        <div className={styles.message} role="alert">
          <h1>Không thể sửa bài viết</h1>
          <p>Bài viết không tồn tại hoặc bạn không phải chủ bài.</p>
          <Link href="/forum">Về cộng đồng</Link>
        </div>
      </ForumShell>
    );
  }

  if (status === "anonymous") {
    return (
      <ForumShell current={mode === "create" ? "new" : "post"}>
        <div className={styles.message}>
          <h1>Cần đăng nhập</h1>
          <p>Bạn cần đăng nhập để viết hoặc sửa bài viết.</p>
          <Link href="/login">Đăng nhập</Link>
        </div>
      </ForumShell>
    );
  }

  return (
    <ForumShell current={mode === "create" ? "new" : "post"}>
      <p className={styles.backLink}>
        <Link href={postId ? `/forum/${postId}` : "/forum"}>← Quay lại</Link>
      </p>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>
            {mode === "create" ? "Chủ đề mới" : "Chỉnh sửa bài viết"}
          </p>
          <h1>{mode === "create" ? "Viết bài mới" : "Sửa bài viết"}</h1>
          <p>
            Nội dung được hiển thị dạng Markdown. Không dán mã độc hoặc thông
            tin cá nhân nhạy cảm.
          </p>
        </div>
      </header>

      {catalogError && (
        <div role="alert">
          <p>Chưa tải được danh sách bài tập: {catalogError}</p>
          <button
            type="button"
            onClick={() => setCatalogAttempt((attempt) => attempt + 1)}
          >
            Tải lại danh sách bài tập
          </button>
        </div>
      )}
      <form className={styles.editor} onSubmit={submit}>
        <div>
          <label htmlFor="post-title">Tiêu đề</label>
          <input
            id="post-title"
            value={form.title}
            maxLength={MAX_POST_TITLE_CHARS}
            required
            onChange={(event) => patch({ title: event.target.value })}
          />
          <p className={styles.counter}>
            {form.title.length}/{MAX_POST_TITLE_CHARS}
          </p>
        </div>

        <div className={styles.editorRow}>
          <div>
            <label htmlFor="post-type">Loại bài</label>
            <select
              id="post-type"
              value={form.postType}
              onChange={(event) =>
                patch({ postType: event.target.value as ForumPostType })
              }
            >
              {FORUM_TYPES.map((type) => (
                <option value={type} key={type}>
                  {POST_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="post-problem">Bài tập liên quan (tùy chọn)</label>
            <select
              id="post-problem"
              value={form.problemId}
              onChange={(event) => {
                setLanguages([]);
                patch({ problemId: event.target.value, languageId: "" });
              }}
            >
              <option value="">Không gắn bài tập</option>
              {form.problemId &&
                !problems.some((problem) => problem.id === form.problemId) && (
                  <option value={form.problemId}>
                    Bài tập đang gắn: {form.problemId}
                  </option>
                )}
              {problems.map((problem) => (
                <option value={problem.id} key={problem.id}>
                  {problem.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="post-language">Ngôn ngữ (tùy chọn)</label>
            <select
              id="post-language"
              value={form.languageId}
              disabled={!form.problemId || languages.length === 0}
              onChange={(event) => patch({ languageId: event.target.value })}
            >
              <option value="">Không chọn</option>
              {form.languageId &&
                !languages.some(
                  (language) => language.id === form.languageId,
                ) && (
                  <option value={form.languageId}>
                    Ngôn ngữ đang gắn: {form.languageId}
                  </option>
                )}
              {languages.map((language) => (
                <option value={language.id} key={language.id}>
                  {language.displayLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!catalogError && problems.length < catalogTotal && (
          <button
            type="button"
            disabled={catalogLoading}
            onClick={() => {
              setCatalogLoading(true);
              setCatalogPage((page) => page + 1);
            }}
          >
            {catalogLoading ? "Đang tải bài tập…" : "Tải thêm bài tập"}
          </button>
        )}
        {form.postType === "solution" && (
          <p className={styles.hint}>
            Chỉ được đăng lời giải cho bài bạn đã giải Accepted. Hệ thống kiểm
            tra lại khi gửi.
          </p>
        )}

        <div>
          <label htmlFor="post-content">Nội dung (Markdown)</label>
          <textarea
            id="post-content"
            value={form.contentMd}
            maxLength={MAX_POST_CONTENT_CHARS}
            rows={12}
            required
            placeholder="Mô tả vấn đề, cách bạn tiếp cận hoặc câu hỏi cụ thể…"
            onChange={(event) => patch({ contentMd: event.target.value })}
          />
          <p className={styles.counter}>
            {form.contentMd.length}/{MAX_POST_CONTENT_CHARS}
          </p>
        </div>

        <div>
          <label htmlFor="post-code">Đoạn mã đính kèm (tùy chọn)</label>
          <textarea
            id="post-code"
            className={styles.codeInput}
            value={form.codeSnippet}
            rows={8}
            spellCheck={false}
            placeholder="Dán mã nguồn nếu cần minh họa"
            onChange={(event) => patch({ codeSnippet: event.target.value })}
          />
        </div>

        {form.contentMd.trim() && (
          <details className={styles.preview}>
            <summary>Xem trước nội dung</summary>
            <ForumMarkdown>{form.contentMd}</ForumMarkdown>
          </details>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className={styles.inlineActions}>
          <button type="submit" disabled={busy}>
            {busy
              ? "Đang lưu…"
              : mode === "create"
                ? "Đăng bài"
                : "Lưu thay đổi"}
          </button>
          <Link href={postId ? `/forum/${postId}` : "/forum"}>Hủy</Link>
        </div>
      </form>
    </ForumShell>
  );
}
