"use client";

import Link from "next/link";
import { Icon } from "@/lib/ui/Icon";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useSession } from "@/features/auth/session";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { ApiError, errorText } from "@/lib/api/client";
import { useApiClient } from "@/lib/api/useApiClient";
import { withDeadline } from "@/lib/api/deadline";
import type {
  ForumPostSummaryModel,
  LikeStateModel,
} from "@/lib/api/adapters/community";
import type {
  LanguageModel,
  ProblemSummaryModel,
} from "@/lib/api/adapters/catalog";
import { ForumSelect } from "./ForumSelect";
import {
  avatarTone,
  initials,
  plainExcerpt,
  relativeTime,
} from "./presentation";
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

function PostCard({
  post,
  problem,
  language,
  now,
  onLike,
}: {
  post: ForumPostSummaryModel;
  problem?: ProblemSummaryModel;
  language?: LanguageModel;
  now: number;
  onLike: (state: LikeStateModel) => void;
}) {
  const api = useApiClient();
  const { status } = useSession();
  const excerpt =
    post.excerpt === undefined ? null : plainExcerpt(post.excerpt);
  const [like, setLike] = useState({
    liked: post.likedByMe,
    likeCount: post.likeCount,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mutation = useRef<AbortController | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      mutation.current?.abort();
    };
  }, []);
  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    setError("");
    const controller = new AbortController();
    mutation.current = controller;
    try {
      const result = await withDeadline(
        controller,
        () =>
          like.liked
            ? api.community.unlikePost(post.id, { signal: controller.signal })
            : api.community.likePost(post.id, { signal: controller.signal }),
        15000,
      );
      if (!controller.signal.aborted) {
        setLike(result);
        onLike(result);
      }
    } catch (error) {
      if (alive.current) setError(errorText(error));
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <li>
      <article className={styles.postCard}>
        <span
          className={styles.feedAvatar}
          data-tone={avatarTone(authorName(post))}
          aria-hidden="true"
        >
          {initials(authorName(post))}
        </span>
        <div className={styles.feedBody}>
          <div className={styles.postCardTop}>
            <span className={styles.authorName}>{authorName(post)}</span>
            <span className={`${styles.typeBadge} ${styles[post.postType]}`}>
              {POST_TYPE_LABEL[post.postType]}
            </span>
            <time dateTime={post.createdAt} title={forumDate(post.createdAt)}>
              {now
                ? relativeTime(post.createdAt, now)
                : forumDate(post.createdAt)}
            </time>
          </div>
          <h2>
            <Link href={`/forum/${post.id}`}>{post.title}</Link>
          </h2>
          {excerpt !== null ? (
            <p className={styles.excerpt}>
              {excerpt || "Bài viết đính kèm mã nguồn. Mở bài để xem chi tiết."}
            </p>
          ) : (
            <Link className={styles.previewFallback} href={`/forum/${post.id}`}>
              Đọc nội dung bài viết
            </Link>
          )}
          <div className={styles.postChips}>
            {language && <span>{language.name}</span>}
            {problem?.tags.map((tag) => (
              <span key={tag.id}>{tag.name}</span>
            ))}
            {problem && (
              <>
                <span data-difficulty={problem.difficulty}>
                  {
                    { easy: "Easy", medium: "Medium", hard: "Hard" }[
                      problem.difficulty
                    ]
                  }
                </span>
                <Link
                  href={`/problems/${problem.slug}`}
                  title={`Làm bài ${problem.title}`}
                >
                  <Icon name="code" size={13} />
                  {problem.slug}
                </Link>
              </>
            )}
            {post.postType === "question" && post.commentCount === 0 && (
              <span className={styles.unanswered}>Chưa có trả lời</span>
            )}
          </div>
          <p className={styles.byline}>
            <Link
              href={`/forum/${post.id}#comments`}
              title="Đọc và viết bình luận"
            >
              <Icon name="message" size={14} />
              {post.commentCount} bình luận
            </Link>
            <span aria-hidden="true">·</span>
            {status === "authenticated" ? (
              <button
                type="button"
                className={styles.feedLike}
                aria-label={like.liked ? "Bỏ thích bài viết" : "Thích bài viết"}
                aria-pressed={like.liked}
                disabled={busy}
                onClick={toggleLike}
              >
                <Icon name="heart" size={14} />
                {like.likeCount} lượt thích
              </button>
            ) : (
              <Link href="/login" title="Đăng nhập để thích">
                <Icon name="heart" size={14} />
                {post.likeCount} lượt thích
              </Link>
            )}
            <span aria-hidden="true">·</span>
            <span>
              <Icon name="eye" size={14} />
              {post.viewCount} lượt xem
            </span>
          </p>
          {error && (
            <p role="alert" className={styles.likeError}>
              {error}
            </p>
          )}
        </div>
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
  const [metadata, setMetadata] = useState<{
    problems: ProblemSummaryModel[];
    languages: LanguageModel[];
  }>({ problems: [], languages: [] });
  const [now, setNow] = useState(0);
  const [unanswered, setUnanswered] = useState(false);
  const [likeOverrides, setLikeOverrides] = useState<
    Record<string, LikeStateModel>
  >({});
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 60000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    void Promise.allSettled([
      api.catalog.listProblems({ size: 100 }, { signal: controller.signal }),
      api.catalog.listLanguages({ signal: controller.signal }),
    ]).then(([problems, languages]) => {
      if (!controller.signal.aborted)
        setMetadata({
          problems: problems.status === "fulfilled" ? problems.value.items : [],
          languages: languages.status === "fulfilled" ? languages.value : [],
        });
    });
    return () => controller.abort();
  }, [api, status, user?.id]);
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
  const posts = (state.data?.items ?? []).map((post) => {
    const like = likeOverrides[`${user?.id ?? "guest"}:${post.id}`];
    return like
      ? { ...post, likedByMe: like.liked, likeCount: like.likeCount }
      : post;
  });
  const visiblePosts = posts.filter(
    (post) =>
      !unanswered || (post.postType === "question" && post.commentCount === 0),
  );
  const members = Array.from(
    new Map(
      (state.data?.items ?? []).map((post) => [post.author.id, post]),
    ).values(),
  ).slice(0, 3);
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
      <div className={styles.featureLinks} aria-label="Khám phá Codjingrank">
        <Link href="/problems" className={styles.exploreProblems}>
          <span className={styles.featureKicker}>Luyện tập</span>
          <strong>Một bài toán. Một góc nhìn mới.</strong>
          <span>
            Khám phá kho bài <Icon name="arrowUpRight" size={14} />
          </span>
          <span className={styles.codeArt} aria-hidden="true">
            <Icon name="code" size={52} />
          </span>
        </Link>
        <Link href="/packages" className={styles.explorePackages}>
          <span className={styles.featureKicker}>Gói bài</span>
          <strong>Học có lộ trình. Tiến bộ từng bước.</strong>
          <span>
            Tìm gói bài phù hợp <Icon name="arrowUpRight" size={14} />
          </span>
          <span className={styles.stepArt} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </Link>
      </div>
      <div className={styles.forumLayout}>
        <section className={styles.feedColumn} aria-label="Danh sách thảo luận">
          <header className={styles.heading}>
            <div>
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
              <span aria-hidden="true">+</span>
              {status === "authenticated"
                ? "Viết bài mới"
                : "Đăng nhập để viết bài"}
            </Link>
          </header>

          <nav className={styles.categoryTabs} aria-label="Chủ đề cộng đồng">
            {[
              { value: "", label: "Tất cả" },
              ...FORUM_TYPES.map((type) => ({
                value: type,
                label: POST_TYPE_LABEL[type],
              })),
            ].map((tab) => (
              <Link
                key={tab.value}
                href={forumHref({
                  ...query,
                  postType: tab.value as ForumQuery["postType"],
                  page: 1,
                })}
                aria-current={query.postType === tab.value ? "page" : undefined}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
          <SessionNotice />
          <div className={styles.quickFilters}>
            <button
              type="button"
              aria-pressed={unanswered}
              onClick={() => setUnanswered(!unanswered)}
            >
              <Icon name="message" size={14} />
              Chưa có trả lời
            </button>
            <span>Lọc trên trang đang xem</span>
          </div>

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
              <span className={styles.filterLabel}>Loại bài</span>
              <ForumSelect
                label="Loại bài"
                value={query.postType}
                options={[
                  { value: "", label: "Tất cả" },
                  ...FORUM_TYPES.map((type) => ({
                    value: type,
                    label: POST_TYPE_LABEL[type],
                  })),
                ]}
                onChange={(value) =>
                  update({ postType: value as ForumQuery["postType"] })
                }
              />
            </div>
            <div>
              <span className={styles.filterLabel}>Sắp xếp</span>
              <ForumSelect
                label="Sắp xếp"
                value={query.sort}
                options={FORUM_SORTS.map((sort) => ({
                  value: sort,
                  label: SORT_LABEL[sort],
                }))}
                onChange={(value) =>
                  update({ sort: value as ForumQuery["sort"] })
                }
              />
            </div>
            <button
              type="submit"
              className="icon-button"
              aria-label="Tìm bài viết"
              title="Tìm bài viết"
            >
              <Icon name="search" size={18} />
            </button>
          </form>
          {unanswered && state.phase === "ready" && state.data && (
            <p className={styles.filterCount} role="status">
              {visiblePosts.length} / {state.data.items.length} bài trên trang
              chưa có trả lời.
            </p>
          )}

          {state.phase === "loading" && (
            <div className={styles.feedSkeleton} role="status">
              <span className="sr-only">Đang tải bài viết…</span>
              {[0, 1, 2].map((item) => (
                <div key={item} aria-hidden="true">
                  <i />
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
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
              {visiblePosts.length ? (
                <ul className={styles.postList}>
                  {visiblePosts.map((post) => (
                    <PostCard
                      post={post}
                      key={`${post.id}:${user?.id ?? "guest"}`}
                      now={now}
                      onLike={(like) =>
                        setLikeOverrides((previous) => ({
                          ...previous,
                          [`${user?.id ?? "guest"}:${post.id}`]: like,
                        }))
                      }
                      problem={metadata.problems.find(
                        (problem) => problem.id === post.problemId,
                      )}
                      language={metadata.languages.find(
                        (language) => language.id === post.languageId,
                      )}
                    />
                  ))}
                </ul>
              ) : (
                <div className={styles.message}>
                  <Icon name="message" size={38} />
                  <h2>Chưa có bài viết phù hợp</h2>
                  <p>
                    {query.q || query.postType || unanswered
                      ? "Thử bỏ bộ lọc hoặc dùng từ khóa khác."
                      : "Hãy là người đầu tiên mở một chủ đề."}
                  </p>
                  <Link href="/forum" onClick={() => setUnanswered(false)}>
                    Xem tất cả bài viết
                  </Link>
                  {query.page > 1 && <Link href="/forum">Về trang đầu</Link>}
                </div>
              )}

              <nav
                className={styles.pagination}
                aria-label="Phân trang bài viết"
              >
                <span>
                  Trang {query.page} / {pages} · {state.data.total} bài viết
                </span>
                <div>
                  <button
                    type="button"
                    aria-label="Trang trước"
                    title="Trang trước"
                    disabled={query.page <= 1}
                    onClick={() =>
                      router.push(
                        forumHref({ ...query, page: query.page - 1 }),
                        {
                          scroll: false,
                        },
                      )
                    }
                  >
                    <Icon name="chevronLeft" />
                    <span className="sr-only">Trang trước</span>
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
                    aria-label="Trang sau"
                    title="Trang sau"
                    disabled={query.page >= pages}
                    onClick={() =>
                      router.push(
                        forumHref({ ...query, page: query.page + 1 }),
                        {
                          scroll: false,
                        },
                      )
                    }
                  >
                    <Icon name="chevronRight" />
                    <span className="sr-only">Trang sau</span>
                  </button>
                </div>
              </nav>
            </>
          )}
        </section>
        <aside className={styles.trendingRail} aria-label="Khám phá cộng đồng">
          <div className={styles.trendingCard}>
            <h2>Đáng chú ý</h2>
            <p className={styles.trendingIntro}>
              Theo lượt thích trong danh sách đang xem.
            </p>
            {state.phase === "ready" &&
              state.data &&
              state.data.items.length > 0 && (
                <ol className={styles.popularList}>
                  {[...posts]
                    .sort((a, b) => b.likeCount - a.likeCount)
                    .slice(0, 5)
                    .map((post) => (
                      <li key={post.id}>
                        <Link href={`/forum/${post.id}`}>{post.title}</Link>
                        <span>
                          {post.likeCount} lượt thích · {post.commentCount} bình
                          luận
                        </span>
                      </li>
                    ))}
                </ol>
              )}
            <Link className={styles.railLink} href="/forum?sort=likes">
              <span>Nhiều lượt thích</span>
              <Icon name="arrowUpRight" size={14} />
            </Link>
            <Link className={styles.railLink} href="/forum?sort=views">
              <span>Nhiều lượt xem</span>
              <Icon name="arrowUpRight" size={14} />
            </Link>
            <Link className={styles.railLink} href="/forum?postType=solution">
              <span>Lời giải từ cộng đồng</span>
              <Icon name="arrowUpRight" size={14} />
            </Link>
          </div>
          <div className={styles.railNote}>
            <h2>Gương mặt cộng đồng</h2>
            <p>Tác giả có bài trên trang này.</p>
            <ul className={styles.memberList}>
              {members.map((post) => (
                <li key={post.author.id}>
                  <span
                    className={styles.feedAvatar}
                    data-tone={avatarTone(authorName(post))}
                    aria-hidden="true"
                  >
                    {initials(authorName(post))}
                  </span>
                  <strong>{authorName(post)}</strong>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </ForumShell>
  );
}
