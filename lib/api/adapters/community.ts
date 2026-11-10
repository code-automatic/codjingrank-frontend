import {
  adaptLeaderboardEntry,
  adaptPublicUser,
  adaptUser,
  type LeaderboardEntryModel,
  type PublicUserModel,
  type UserModel,
} from "@/lib/api/adapters/shared";
import {
  adaptPaginated,
  assertBoolean,
  assertEnum,
  assertInt,
  assertIsoDateTime,
  assertNonEmptyString,
  assertNullableIsoDateTime,
  assertNullableString,
  assertNullableUuid,
  assertRecord,
  assertString,
  assertUuid,
} from "@/lib/api/guards";
import type {
  ForumCommentDto,
  ForumPostDto,
  ForumPostSummaryDto,
  LeaderboardDataDto,
  LeaderboardQuery,
  LeaderboardScope,
  LikeStateDto,
  MyRankDataDto,
  PaginatedData,
} from "@/lib/api/types";

export const LEADERBOARD_SCOPES = ["all", "week", "month"] as const;
export const FORUM_POST_TYPES = ["discussion", "question", "solution"] as const;
export const FORUM_POST_STATUSES = ["published"] as const;

export type LeaderboardDataModel = Omit<LeaderboardDataDto, "items"> & {
  items: LeaderboardEntryModel[];
  hasPeriodBounds: boolean;
};

export type MyRankDataModel = Omit<MyRankDataDto, "entry"> & {
  entry: LeaderboardEntryModel | null;
  isRanked: boolean;
};

export type ForumPostSummaryModel = Omit<ForumPostSummaryDto, "author"> & {
  author: PublicUserModel;
  isSolution: boolean;
};

export type ForumPostModel = Omit<ForumPostDto, "author"> & {
  author: PublicUserModel;
  isSolution: boolean;
  hasCodeSnippet: boolean;
};

export type ForumCommentModel = Omit<ForumCommentDto, "author"> & {
  author: PublicUserModel;
  isReply: boolean;
  displayContent: string;
};

export type LikeStateModel = LikeStateDto;

export type { LeaderboardScope, PublicUserModel, UserModel };
export { adaptLeaderboardEntry, adaptPublicUser, adaptUser };

export function canGuestReadLeaderboard(query?: LeaderboardQuery): boolean {
  const scope = query?.scope ?? "all";
  const page = query?.page ?? 1;
  const size = query?.size ?? 50;
  return scope === "all" && page === 1 && size <= 50;
}

export function adaptLeaderboardData(
  raw: unknown,
  field = "leaderboardData",
): LeaderboardDataModel {
  const base = adaptPaginated(raw, field, (item, i) =>
    adaptLeaderboardEntry(item, `${field}.items[${i}]`),
  );
  const r = assertRecord(raw, field);
  const periodStart = assertNullableIsoDateTime(
    r.periodStart,
    `${field}.periodStart`,
  );
  const periodEnd = assertNullableIsoDateTime(
    r.periodEnd,
    `${field}.periodEnd`,
  );
  return {
    scope: assertEnum(r.scope, LEADERBOARD_SCOPES, `${field}.scope`),
    packageSlug: assertNullableString(r.packageSlug, `${field}.packageSlug`),
    periodStart,
    periodEnd,
    items: base.items,
    page: base.page,
    size: base.size,
    total: base.total,
    hasPeriodBounds: periodStart !== null && periodEnd !== null,
  };
}

export function adaptMyRankData(
  raw: unknown,
  field = "myRankData",
): MyRankDataModel {
  const r = assertRecord(raw, field);
  const entry =
    r.entry === null ? null : adaptLeaderboardEntry(r.entry, `${field}.entry`);
  return {
    scope: assertEnum(r.scope, LEADERBOARD_SCOPES, `${field}.scope`),
    packageSlug: assertNullableString(r.packageSlug, `${field}.packageSlug`),
    periodStart: assertNullableIsoDateTime(
      r.periodStart,
      `${field}.periodStart`,
    ),
    periodEnd: assertNullableIsoDateTime(r.periodEnd, `${field}.periodEnd`),
    entry,
    isRanked: entry !== null,
  };
}

export function adaptForumPostSummary(
  raw: unknown,
  field = "forumPostSummary",
): ForumPostSummaryModel {
  const r = assertRecord(raw, field);
  const postType = assertEnum(
    r.postType,
    FORUM_POST_TYPES,
    `${field}.postType`,
  );
  return {
    id: assertUuid(r.id, `${field}.id`),
    author: adaptPublicUser(r.author, `${field}.author`),
    problemId: assertNullableUuid(r.problemId, `${field}.problemId`),
    languageId: assertNullableUuid(r.languageId, `${field}.languageId`),
    postType,
    status: assertEnum(r.status, FORUM_POST_STATUSES, `${field}.status`),
    title: assertNonEmptyString(r.title, `${field}.title`),
    likeCount: assertInt(r.likeCount, `${field}.likeCount`, 0),
    viewCount: assertInt(r.viewCount, `${field}.viewCount`, 0),
    commentCount: assertInt(r.commentCount, `${field}.commentCount`, 0),
    likedByMe: assertBoolean(r.likedByMe, `${field}.likedByMe`),
    createdAt: assertIsoDateTime(r.createdAt, `${field}.createdAt`),
    updatedAt: assertIsoDateTime(r.updatedAt, `${field}.updatedAt`),
    isSolution: postType === "solution",
  };
}

export function adaptPostsPage(
  raw: unknown,
): PaginatedData<ForumPostSummaryModel> {
  return adaptPaginated(raw, "postsPage", (item, i) =>
    adaptForumPostSummary(item, `postsPage.items[${i}]`),
  );
}

export function adaptForumPost(
  raw: unknown,
  field = "forumPost",
): ForumPostModel {
  const r = assertRecord(raw, field);
  const summary = adaptForumPostSummary(r, field);
  const codeSnippet = assertNullableString(
    r.codeSnippet,
    `${field}.codeSnippet`,
  );
  return {
    ...summary,
    contentMd: assertString(r.contentMd, `${field}.contentMd`),
    codeSnippet,
    hasCodeSnippet: codeSnippet !== null && codeSnippet.length > 0,
  };
}

export function adaptPostData(raw: unknown): ForumPostModel {
  const r = assertRecord(raw, "postData");
  return adaptForumPost(r.post, "postData.post");
}

export function adaptForumComment(
  raw: unknown,
  field = "forumComment",
): ForumCommentModel {
  const r = assertRecord(raw, field);
  const parentId = assertNullableUuid(r.parentId, `${field}.parentId`);
  const content = assertNullableString(r.content, `${field}.content`);
  const isDeleted = assertBoolean(r.isDeleted, `${field}.isDeleted`);
  return {
    id: assertUuid(r.id, `${field}.id`),
    postId: assertUuid(r.postId, `${field}.postId`),
    parentId,
    author: adaptPublicUser(r.author, `${field}.author`),
    content,
    isDeleted,
    createdAt: assertIsoDateTime(r.createdAt, `${field}.createdAt`),
    updatedAt: assertIsoDateTime(r.updatedAt, `${field}.updatedAt`),
    isReply: parentId !== null,
    displayContent: isDeleted ? "Bình luận đã bị xóa." : (content ?? ""),
  };
}

export function adaptCommentData(raw: unknown): ForumCommentModel {
  const r = assertRecord(raw, "commentData");
  return adaptForumComment(r.comment, "commentData.comment");
}

export function adaptCommentsPage(
  raw: unknown,
): PaginatedData<ForumCommentModel> {
  return adaptPaginated(raw, "commentsPage", (item, i) =>
    adaptForumComment(item, `commentsPage.items[${i}]`),
  );
}

export function adaptLikeState(
  raw: unknown,
  field = "likeState",
): LikeStateModel {
  const r = assertRecord(raw, field);
  return {
    liked: assertBoolean(r.liked, `${field}.liked`),
    likeCount: assertInt(r.likeCount, `${field}.likeCount`, 0),
  };
}

export function adaptUserData(raw: unknown): UserModel {
  const r = assertRecord(raw, "userData");
  return adaptUser(r.user, "userData.user");
}
