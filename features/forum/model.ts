import type {
  ForumCommentModel,
  ForumPostSummaryModel,
} from "@/lib/api/adapters/community";
import type { ListPostsQuery } from "@/lib/api/types";

export const FORUM_PAGE_SIZE = 20;
export const FORUM_SORTS = ["newest", "likes", "views"] as const;
export const FORUM_TYPES = ["discussion", "question", "solution"] as const;

export type ForumSort = (typeof FORUM_SORTS)[number];
export type ForumPostType = (typeof FORUM_TYPES)[number];

export type ForumQuery = {
  page: number;
  size: number;
  sort: ForumSort;
  postType: ForumPostType | "";
  q: string;
};

export const POST_TYPE_LABEL: Record<ForumPostType, string> = {
  discussion: "Thảo luận",
  question: "Hỏi đáp",
  solution: "Lời giải",
};

export const SORT_LABEL: Record<ForumSort, string> = {
  newest: "Mới nhất",
  likes: "Nhiều lượt thích",
  views: "Nhiều lượt xem",
};

export function isForumPostType(value: string): value is ForumPostType {
  return (FORUM_TYPES as readonly string[]).includes(value);
}

export function isForumSort(value: string): value is ForumSort {
  return (FORUM_SORTS as readonly string[]).includes(value);
}

export function parseForumQuery(params: URLSearchParams): ForumQuery {
  const integer = (key: string, fallback: number, max: number) => {
    const raw = params.get(key) ?? "";
    const value = Number(raw);
    return /^\d+$/.test(raw) &&
      Number.isSafeInteger(value) &&
      value >= 1 &&
      value <= max
      ? value
      : fallback;
  };
  const type = params.get("postType") ?? "";
  const sort = params.get("sort") ?? "";
  return {
    page: integer("page", 1, Number.MAX_SAFE_INTEGER),
    size: integer("size", FORUM_PAGE_SIZE, 100),
    sort: isForumSort(sort) ? sort : "newest",
    postType: isForumPostType(type) ? type : "",
    q: (params.get("q") ?? "").slice(0, 200),
  };
}

export function forumHref(query: ForumQuery): string {
  const params = new URLSearchParams();
  if (query.sort !== "newest") params.set("sort", query.sort);
  if (query.postType) params.set("postType", query.postType);
  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.page !== 1) params.set("page", String(query.page));
  if (query.size !== FORUM_PAGE_SIZE) params.set("size", String(query.size));
  const qs = params.toString();
  return `/forum${qs ? `?${qs}` : ""}`;
}

export function forumApiQuery(query: ForumQuery): ListPostsQuery {
  return {
    page: query.page,
    size: query.size,
    sort: query.sort,
    ...(query.postType ? { postType: query.postType } : {}),
    ...(query.q.trim() ? { q: query.q.trim() } : {}),
  };
}

export function canManage(authorId: string, userId: string | undefined) {
  return Boolean(userId) && authorId === userId;
}

export type CommentThread = {
  root: ForumCommentModel;
  replies: ForumCommentModel[];
  orphan: boolean;
};

export function groupComments(items: ForumCommentModel[]): CommentThread[] {
  const roots = new Map<string, CommentThread>();
  const orphans: CommentThread[] = [];
  for (const item of items) {
    if (item.parentId === null) {
      roots.set(item.id, { root: item, replies: [], orphan: false });
    }
  }
  for (const item of items) {
    if (item.parentId === null) continue;
    const parent = roots.get(item.parentId);
    if (parent) parent.replies.push(item);
    else orphans.push({ root: item, replies: [], orphan: true });
  }
  const sort = (a: ForumCommentModel, b: ForumCommentModel) =>
    a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
  const threads = [...roots.values(), ...orphans];
  threads.forEach((thread) => thread.replies.sort(sort));
  return threads.sort((a, b) => sort(a.root, b.root));
}

export function authorName(post: Pick<ForumPostSummaryModel, "author">) {
  return post.author.fullName?.trim() || post.author.username;
}

export function forumDate(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function forumExcerpt(value: string, max = 180) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > max ? `${compact.slice(0, max - 1)}…` : compact;
}
