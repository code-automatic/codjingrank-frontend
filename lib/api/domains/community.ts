import {
  adaptCommentData,
  adaptCommentsPage,
  adaptLeaderboardData,
  adaptLikeState,
  adaptMyRankData,
  adaptPostData,
  adaptPostsPage,
  type ForumCommentModel,
  type ForumPostModel,
  type ForumPostSummaryModel,
  type LeaderboardDataModel,
  type LikeStateModel,
  type MyRankDataModel,
} from "@/lib/api/adapters/community";
import {
  buildApiPath,
  type RequestOptions,
  type Requester,
} from "@/lib/api/client";
import {
  assertCommentCreatePayload,
  assertCommentPatchPayload,
  assertPostCreatePayload,
  assertPostPatchPayload,
  assertUuidParam,
} from "@/lib/api/domains/preflight";
import type {
  CommentCreateRequest,
  CommentPatchRequest,
  LeaderboardQuery,
  ListPostsQuery,
  MyRankQuery,
  PaginatedData,
  PaginationQuery,
  PostCreateRequest,
  PostPatchRequest,
} from "@/lib/api/types";

function toRequestInit(
  options?: RequestOptions,
  extra?: RequestInit,
): RequestInit {
  return {
    ...extra,
    ...(options?.signal ? { signal: options.signal } : {}),
    ...(options?.headers ? { headers: options.headers } : {}),
  };
}

export function createCommunityClient(deps: {
  authRequest: Requester;
  publicRequest: Requester;
  optionalRequest: Requester;
}) {
  return {
    async getLeaderboard(
      query?: LeaderboardQuery,
      options?: RequestOptions,
    ): Promise<LeaderboardDataModel> {
      const path = buildApiPath("/api/v1/leaderboard", query);
      const raw = await deps.optionalRequest<unknown>(
        path,
        toRequestInit(options),
      );
      return adaptLeaderboardData(raw);
    },

    async getMyRank(
      query?: MyRankQuery,
      options?: RequestOptions,
    ): Promise<MyRankDataModel> {
      const path = buildApiPath("/api/v1/leaderboard/me", query);
      const raw = await deps.authRequest<unknown>(path, toRequestInit(options));
      return adaptMyRankData(raw);
    },

    async listPosts(
      query?: ListPostsQuery,
      options?: RequestOptions,
    ): Promise<PaginatedData<ForumPostSummaryModel>> {
      if (query?.problemId) assertUuidParam(query.problemId, "problemId");
      if (query?.languageId) assertUuidParam(query.languageId, "languageId");
      const path = buildApiPath("/api/v1/forum/posts", query);
      const raw = await deps.optionalRequest<unknown>(
        path,
        toRequestInit(options),
      );
      return adaptPostsPage(raw);
    },

    async createPost(
      payload: PostCreateRequest,
      options?: RequestOptions,
    ): Promise<ForumPostModel> {
      const valid = assertPostCreatePayload(payload);
      const raw = await deps.authRequest<unknown>(
        "/api/v1/forum/posts",
        toRequestInit(options, {
          method: "POST",
          body: JSON.stringify(valid),
        }),
      );
      return adaptPostData(raw);
    },

    async getPost(
      id: string,
      options?: RequestOptions,
    ): Promise<ForumPostModel> {
      const cleanId = assertUuidParam(id, "id");
      const raw = await deps.optionalRequest<unknown>(
        `/api/v1/forum/posts/${encodeURIComponent(cleanId)}`,
        toRequestInit(options),
      );
      return adaptPostData(raw);
    },

    async updatePost(
      id: string,
      payload: PostPatchRequest,
      options?: RequestOptions,
    ): Promise<ForumPostModel> {
      const cleanId = assertUuidParam(id, "id");
      const valid = assertPostPatchPayload(payload);
      const raw = await deps.authRequest<unknown>(
        `/api/v1/forum/posts/${encodeURIComponent(cleanId)}`,
        toRequestInit(options, {
          method: "PATCH",
          body: JSON.stringify(valid),
        }),
      );
      return adaptPostData(raw);
    },

    async deletePost(id: string, options?: RequestOptions): Promise<void> {
      const cleanId = assertUuidParam(id, "id");
      await deps.authRequest<void>(
        `/api/v1/forum/posts/${encodeURIComponent(cleanId)}`,
        toRequestInit(options, { method: "DELETE" }),
      );
    },

    async listComments(
      postId: string,
      query?: PaginationQuery,
      options?: RequestOptions,
    ): Promise<PaginatedData<ForumCommentModel>> {
      const cleanPostId = assertUuidParam(postId, "postId");
      const path = buildApiPath(
        `/api/v1/forum/posts/${encodeURIComponent(cleanPostId)}/comments`,
        query,
      );
      const raw = await deps.publicRequest<unknown>(
        path,
        toRequestInit(options),
      );
      return adaptCommentsPage(raw);
    },

    async createComment(
      postId: string,
      payload: CommentCreateRequest,
      options?: RequestOptions,
    ): Promise<ForumCommentModel> {
      const cleanPostId = assertUuidParam(postId, "postId");
      const valid = assertCommentCreatePayload(payload);
      const raw = await deps.authRequest<unknown>(
        `/api/v1/forum/posts/${encodeURIComponent(cleanPostId)}/comments`,
        toRequestInit(options, {
          method: "POST",
          body: JSON.stringify(valid),
        }),
      );
      return adaptCommentData(raw);
    },

    async updateComment(
      id: string,
      payload: CommentPatchRequest,
      options?: RequestOptions,
    ): Promise<ForumCommentModel> {
      const cleanId = assertUuidParam(id, "id");
      const valid = assertCommentPatchPayload(payload);
      const raw = await deps.authRequest<unknown>(
        `/api/v1/forum/comments/${encodeURIComponent(cleanId)}`,
        toRequestInit(options, {
          method: "PATCH",
          body: JSON.stringify(valid),
        }),
      );
      return adaptCommentData(raw);
    },

    async deleteComment(id: string, options?: RequestOptions): Promise<void> {
      const cleanId = assertUuidParam(id, "id");
      await deps.authRequest<void>(
        `/api/v1/forum/comments/${encodeURIComponent(cleanId)}`,
        toRequestInit(options, { method: "DELETE" }),
      );
    },

    async likePost(
      id: string,
      options?: RequestOptions,
    ): Promise<LikeStateModel> {
      const cleanId = assertUuidParam(id, "id");
      const raw = await deps.authRequest<unknown>(
        `/api/v1/forum/posts/${encodeURIComponent(cleanId)}/like`,
        toRequestInit(options, { method: "PUT" }),
      );
      return adaptLikeState(raw);
    },

    async unlikePost(
      id: string,
      options?: RequestOptions,
    ): Promise<LikeStateModel> {
      const cleanId = assertUuidParam(id, "id");
      const raw = await deps.authRequest<unknown>(
        `/api/v1/forum/posts/${encodeURIComponent(cleanId)}/like`,
        toRequestInit(options, { method: "DELETE" }),
      );
      return adaptLikeState(raw);
    },
  };
}
