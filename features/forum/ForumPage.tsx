"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSession } from "@/features/auth/session";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { ApiError, errorText } from "@/lib/api/client";
import { useApiClient } from "@/lib/api/useApiClient";
import type { ForumPostSummaryModel } from "@/lib/api/adapters/community";
import { ForumShell } from "./ForumShell";
import {
  FORUM_SORTS,
  FORUM_TYPES,
  POST_TYPE_LABEL,
  SORT_LABEL,
  authorName,
  forumDate,
  forumHref,
  parseForumQuery,
  type ForumQuery,
} from "./model";
import { createForumListResource } from "./listResource";
import styles from "./forum.module.css";

function PostCard({ post }: { post: ForumPostSummaryModel }) {
  return (
    <li>
      <article className={styles.postCard}>
        <div className={styles.postCardTop}>
          <span className={`${styles.typeBadge} ${styles[post.postType]}`}>
            {POST_TYPE_LABEL[post.postType]}
          </span>
          <time dateTime={post.createdAt}>{forumDate(post.createdAt)}</time>
        </div>
        <h2>
          <Link href={`/forum/${post.id}`}>{post.title}</Link>
        </h2>
        <p className={styles.byline}>
          <span>{authorName(post)}</span>
          <span aria-hidden="true">·</span>
          <span>{post.commentCount} bình luận</span>
          <span aria-hidden="true">·</span>
          <span>{post.likeCount} lượt thích</span>
          <span aria-hidden="true">·</span>
          <span>{post.viewCount} lượt xem</span>
        </p>
      </article>
    </li>
  );
}

export function ForumPage() {
  const api = useApiClient();
  const router = useRouter();
  const params = useSearchParams();
  const search = params.toString();
  const query = useMemo(
    () => parseForumQuery(new URLSearchParams(search)),
    [search],
  );
  const { status, user } = useSession();
  const [resource] = useState(() => createForumListResource(api));
  const state = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getServerSnapshot,
  );

  useEffect(() => {
    void resource.load(query);
    return () => resource.dispose();
  }, [resource, query, status, user?.id]);

  const pages = state.data
    ? Math.max(1, Math.ceil(state.data.total / state.data.size))
    : 1;
  const pageStart = Math.min(
    Math.max(1, query.page - 2),
    Math.max(1, pages - 4),
  );
  const pageNumbers = Array.from(
    { length: Math.min(5, pages) },
    (_, index) => pageStart + index,
  );

  function update(patch: Partial<ForumQuery>) {
    router.push(forumHref({ ...query, ...patch, page: 1 }), { scroll: false });
  }

  return (
    <ForumShell current="forum">
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Cộng đồng Codjingrank</p>
          <h1>Hỏi đáp &amp; chia sẻ</h1>
          <p>
            Trao đổi cách giải, đặt câu hỏi và chia sẻ lời giải đã được chấp
            nhận.
          </p>
        </div>
        <Link
          className={styles.primaryAction}
          href={status === "authenticated" ? "/forum/new" : "/login"}
        >
          {status === "authenticated"
            ? "Viết bài mới"
            : "Đăng nhập để viết bài"}
        </Link>
      </header>

      <SessionNotice />

      <form
        className={styles.toolbar}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("q");
          update({ q: typeof value === "string" ? value : "" });
        }}
      >
        <div>
          <label htmlFor="forum-search">Tìm bài viết</label>
          <input
            id="forum-search"
            name="q"
            key={query.q}
            defaultValue={query.q}
            maxLength={200}
            placeholder="Từ khóa trong tiêu đề hoặc nội dung"
          />
        </div>
        <div>
          <label htmlFor="forum-type">Loại bài</label>
          <select
            id="forum-type"
            value={query.postType}
            onChange={(event) =>
              update({ postType: event.target.value as ForumQuery["postType"] })
            }
          >
            <option value="">Tất cả</option>
            {FORUM_TYPES.map((type) => (
              <option value={type} key={type}>
                {POST_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="forum-sort">Sắp xếp</label>
          <select
            id="forum-sort"
            value={query.sort}
            onChange={(event) =>
              update({ sort: event.target.value as ForumQuery["sort"] })
            }
          >
            {FORUM_SORTS.map((sort) => (
              <option value={sort} key={sort}>
                {SORT_LABEL[sort]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Tìm</button>
      </form>

      {state.phase === "loading" && (
        <p className={styles.message} role="status">
          Đang tải bài viết…
        </p>
      )}

      {state.phase === "error" && (
        <div className={styles.message} role="alert">
          <p>{errorText(state.error)}</p>
          {state.error instanceof ApiError && state.error.status === 401 ? (
            <Link href="/login">Đăng nhập lại</Link>
          ) : (
            <button type="button" onClick={() => void resource.load(query)}>
              Thử lại
            </button>
          )}
        </div>
      )}

      {state.phase === "ready" && state.data && (
        <>
          {state.data.items.length ? (
            <ul className={styles.postList}>
              {state.data.items.map((post) => (
                <PostCard post={post} key={post.id} />
              ))}
            </ul>
          ) : (
            <div className={styles.message}>
              <h2>Chưa có bài viết phù hợp</h2>
              <p>
                {query.q || query.postType
                  ? "Thử bỏ bộ lọc hoặc dùng từ khóa khác."
                  : "Hãy là người đầu tiên mở một chủ đề."}
              </p>
              {query.page > 1 && <Link href="/forum">Về trang đầu</Link>}
            </div>
          )}

          <nav className={styles.pagination} aria-label="Phân trang bài viết">
            <span>
              Trang {query.page} / {pages} · {state.data.total} bài viết
            </span>
            <div>
              <button
                type="button"
                disabled={query.page <= 1}
                onClick={() =>
                  router.push(forumHref({ ...query, page: query.page - 1 }), {
                    scroll: false,
                  })
                }
              >
                Trước
              </button>
              {pageNumbers.map((page) => (
                <button
                  type="button"
                  key={page}
                  className={styles.pageNumber}
                  aria-label={`Trang ${page}`}
                  aria-current={page === query.page ? "page" : undefined}
                  onClick={() =>
                    router.push(forumHref({ ...query, page }), {
                      scroll: false,
                    })
                  }
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={query.page >= pages}
                onClick={() =>
                  router.push(forumHref({ ...query, page: query.page + 1 }), {
                    scroll: false,
                  })
                }
              >
                Sau
              </button>
            </div>
          </nav>
        </>
      )}
    </ForumShell>
  );
}
