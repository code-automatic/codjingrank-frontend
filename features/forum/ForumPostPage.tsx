"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { useSession } from "@/features/auth/session";
import { ApiError, errorText } from "@/lib/api/client";
import type { ForumCommentModel } from "@/lib/api/adapters/community";
import { useApiClient } from "@/lib/api/useApiClient";
import { ForumMarkdown } from "./ForumMarkdown";
import { ForumShell } from "./ForumShell";
import {
  POST_TYPE_LABEL,
  authorName,
  canManage,
  forumDate,
  groupComments,
} from "./model";
import { createForumPostController } from "./postController";
import styles from "./forum.module.css";

function Avatar({ name }: { name: string }) {
  return (
    <span className={styles.avatar} aria-hidden="true">
      {name.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}

function CommentItem({
  comment,
  userId,
  busy,
  onReply,
  onEdit,
  onDelete,
  orphan,
}: {
  comment: ForumCommentModel;
  userId?: string;
  busy: boolean;
  onReply: (comment: ForumCommentModel) => void;
  onEdit: (comment: ForumCommentModel) => void;
  onDelete: (comment: ForumCommentModel) => void;
  orphan?: boolean;
}) {
  return (
    <li className={`${styles.comment} ${orphan ? styles.orphan : ""}`}>
      <div className={styles.commentHead}>
        <Avatar name={authorName(comment)} />
        <div>
          <strong>{authorName(comment)}</strong>
          <span className={styles.commentMeta}>
            {forumDate(comment.createdAt)}
            {orphan ? " · trả lời bình luận khác trang" : ""}
          </span>
        </div>
      </div>
      {comment.isDeleted ? (
        <p className={styles.tombstone}>{comment.displayContent}</p>
      ) : (
        <p className={styles.commentBody}>{comment.displayContent}</p>
      )}
      {!comment.isDeleted && (
        <div className={styles.commentActions}>
          {userId && comment.parentId === null && (
            <button
              type="button"
              className={styles.linkButton}
              disabled={busy}
              onClick={() => onReply(comment)}
            >
              Trả lời
            </button>
          )}
          {canManage(comment.author.id, userId) && (
            <>
              <button
                type="button"
                className={styles.linkButton}
                disabled={busy}
                onClick={() => onEdit(comment)}
              >
                Sửa
              </button>
              <button
                type="button"
                className={styles.linkButton}
                disabled={busy}
                onClick={() => onDelete(comment)}
              >
                Xóa
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

export function ForumPostPage({ id }: { id: string }) {
  const { status, user } = useSession();
  if (status === "initializing") {
    return (
      <ForumShell current="post">
        <p role="status">Đang kiểm tra phiên đăng nhập…</p>
      </ForumShell>
    );
  }
  return <ForumPostContent key={`${id}:${user?.id ?? "guest"}`} id={id} />;
}

function ForumPostContent({ id }: { id: string }) {
  const api = useApiClient();
  const router = useRouter();
  const { status, user } = useSession();
  const [controller] = useState(() => createForumPostController(api, id));
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<ForumCommentModel | null>(null);
  const [editing, setEditing] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    void controller.load();
    return () => controller.dispose();
  }, [controller]);

  const post = state.post.data;
  const comments = state.comments.data;
  const isOwner = post ? canManage(post.author.id, user?.id) : false;
  const authenticated = status === "authenticated";

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!commentText.trim()) {
      setFormError("Bình luận không được để trống.");
      return;
    }
    const result = await controller.addComment(
      commentText.trim(),
      replyTo?.id ?? null,
    );
    if (result) {
      setCommentText("");
      setReplyTo(null);
    } else {
      setFormError(errorText(controller.getSnapshot().actionError));
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setFormError("");
    if (!editing.content.trim()) {
      setFormError("Bình luận không được để trống.");
      return;
    }
    const result = await controller.editComment(
      editing.id,
      editing.content.trim(),
    );
    if (result) setEditing(null);
    else setFormError(errorText(controller.getSnapshot().actionError));
  }

  async function removePost() {
    if (!post) return;
    if (!window.confirm("Xóa bài viết này? Bạn không thể hoàn tác.")) return;
    const done = await controller.deletePost();
    if (done) router.replace("/forum");
  }

  async function removeComment(comment: ForumCommentModel) {
    if (!window.confirm("Xóa bình luận này?")) return;
    const done = await controller.removeComment(comment.id);
    if (!done) setFormError(errorText(controller.getSnapshot().actionError));
  }

  return (
    <ForumShell current="post">
      <p className={styles.backLink}>
        <Link href="/forum">← Về cộng đồng</Link>
      </p>

      {state.post.phase === "loading" && (
        <p className={styles.message} role="status">
          Đang tải bài viết…
        </p>
      )}

      {state.post.phase === "error" && (
        <div className={styles.message} role="alert">
          <h1>
            {state.post.error instanceof ApiError &&
            state.post.error.status === 404
              ? "Không tìm thấy bài viết"
              : "Chưa thể tải bài viết"}
          </h1>
          <p>{errorText(state.post.error)}</p>
          <div className={styles.inlineActions}>
            <button type="button" onClick={() => void controller.retryPost()}>
              Thử lại
            </button>
            <Link href="/forum">Về danh sách</Link>
          </div>
        </div>
      )}

      {post && (
        <article className={styles.article}>
          <header>
            <div className={styles.postCardTop}>
              <span className={`${styles.typeBadge} ${styles[post.postType]}`}>
                {POST_TYPE_LABEL[post.postType]}
              </span>
              <time dateTime={post.createdAt}>{forumDate(post.createdAt)}</time>
            </div>
            <h1>{post.title}</h1>
            <div className={styles.postByline}>
              <Avatar name={authorName(post)} />
              <span>
                <strong>{authorName(post)}</strong>
                <span className={styles.commentMeta}>
                  {post.viewCount} lượt xem · {post.commentCount} bình luận
                </span>
              </span>
            </div>
          </header>

          <ForumMarkdown>{post.contentMd}</ForumMarkdown>

          {post.codeSnippet && (
            <section className={styles.codeBlock} aria-label="Đoạn mã đính kèm">
              <h2>Đoạn mã</h2>
              <pre tabIndex={0}>
                <code>{post.codeSnippet}</code>
              </pre>
            </section>
          )}

          {Boolean(state.actionError) && (
            <p className="error" role="alert">
              {errorText(state.actionError)}
            </p>
          )}

          <div className={styles.articleActions}>
            {authenticated ? (
              <button
                type="button"
                className={styles.likeButton}
                disabled={state.busy}
                aria-pressed={post.likedByMe}
                onClick={() => void controller.toggleLike()}
              >
                {post.likedByMe ? "♥ Đã thích" : "♡ Thích"} ({post.likeCount})
              </button>
            ) : (
              <Link className={styles.likeButton} href="/login">
                ♡ Thích ({post.likeCount})
              </Link>
            )}
            {isOwner && (
              <div className={styles.inlineActions}>
                <Link href={`/forum/${post.id}/edit`}>Sửa bài</Link>
                <button
                  type="button"
                  className={styles.danger}
                  disabled={state.busy}
                  onClick={() => void removePost()}
                >
                  Xóa bài
                </button>
              </div>
            )}
          </div>
        </article>
      )}

      {post && (
        <section className={styles.comments} aria-labelledby="comments-heading">
          <h2 id="comments-heading">
            Bình luận {comments ? `(${comments.total})` : ""}
          </h2>

          {state.comments.phase === "loading" && (
            <p role="status">Đang tải bình luận…</p>
          )}

          {state.comments.phase === "error" && (
            <div role="alert">
              <p>{errorText(state.comments.error)}</p>
              <button
                type="button"
                onClick={() => void controller.retryComments()}
              >
                Thử lại
              </button>
            </div>
          )}

          {authenticated ? (
            <form className={styles.commentForm} onSubmit={submitComment}>
              {replyTo && (
                <p className={styles.replyHint}>
                  Đang trả lời <strong>{authorName(replyTo)}</strong>.{" "}
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => setReplyTo(null)}
                  >
                    Hủy
                  </button>
                </p>
              )}
              <label htmlFor="forum-comment">
                {replyTo ? "Trả lời bình luận" : "Viết bình luận"}
              </label>
              <textarea
                id="forum-comment"
                value={commentText}
                maxLength={5000}
                rows={4}
                placeholder="Chia sẻ cách bạn giải hoặc đặt câu hỏi…"
                onChange={(event) => setCommentText(event.target.value)}
              />
              {formError && (
                <p className="error" role="alert">
                  {formError}
                </p>
              )}
              <button
                type="submit"
                disabled={state.busy || state.commentsLoading}
              >
                {state.busy ? "Đang gửi…" : "Gửi bình luận"}
              </button>
            </form>
          ) : (
            <p className={styles.message}>
              <Link href="/login">Đăng nhập</Link> để bình luận.
            </p>
          )}

          {comments && comments.items.length > 0 && (
            <ul className={styles.commentList}>
              {groupComments(comments.items).map((thread) => (
                <li key={thread.root.id} className={styles.thread}>
                  <ul className={styles.threadList}>
                    <CommentItem
                      comment={thread.root}
                      userId={user?.id}
                      busy={state.busy}
                      orphan={thread.orphan}
                      onReply={setReplyTo}
                      onEdit={(comment) =>
                        setEditing({
                          id: comment.id,
                          content: comment.content ?? "",
                        })
                      }
                      onDelete={(comment) => void removeComment(comment)}
                    />
                    {thread.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        userId={user?.id}
                        busy={state.busy}
                        onReply={setReplyTo}
                        onEdit={(comment) =>
                          setEditing({
                            id: comment.id,
                            content: comment.content ?? "",
                          })
                        }
                        onDelete={(comment) => void removeComment(comment)}
                      />
                    ))}
                  </ul>
                  {editing &&
                    thread.replies
                      .concat(thread.root)
                      .some((c) => c.id === editing.id) && (
                      <form className={styles.editForm} onSubmit={saveEdit}>
                        <label htmlFor={`edit-${editing.id}`}>
                          Sửa bình luận
                        </label>
                        <textarea
                          id={`edit-${editing.id}`}
                          value={editing.content}
                          maxLength={5000}
                          rows={3}
                          onChange={(event) =>
                            setEditing({
                              ...editing,
                              content: event.target.value,
                            })
                          }
                        />
                        <div className={styles.inlineActions}>
                          <button
                            type="submit"
                            disabled={state.busy || state.commentsLoading}
                          >
                            Lưu
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    )}
                </li>
              ))}
            </ul>
          )}

          {comments && comments.items.length === 0 && (
            <p className={styles.muted}>Chưa có bình luận nào.</p>
          )}

          {comments && comments.items.length < comments.total && (
            <button
              type="button"
              className={styles.loadMore}
              disabled={state.busy || state.commentsLoading}
              onClick={() => void controller.loadMoreComments()}
            >
              {state.commentsLoading
                ? "Đang tải bình luận…"
                : "Tải thêm bình luận"}
            </button>
          )}
        </section>
      )}
    </ForumShell>
  );
}
