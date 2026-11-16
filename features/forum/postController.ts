import type { ApiClient } from "@/lib/api";
import type {
  ForumCommentModel,
  ForumPostModel,
} from "@/lib/api/adapters/community";
import type { PaginatedData } from "@/lib/api/types";
import { withDeadline } from "@/lib/api/deadline";

type Loadable<T> = {
  phase: "loading" | "ready" | "error";
  data: T | null;
  error: unknown;
};

export type ForumPostState = {
  post: Loadable<ForumPostModel>;
  comments: Loadable<PaginatedData<ForumCommentModel>>;
  busy: boolean;
  actionError: unknown;
};

const loading = <T>(): Loadable<T> => ({
  phase: "loading",
  data: null,
  error: null,
});

const initial: ForumPostState = {
  post: loading(),
  comments: loading(),
  busy: false,
  actionError: null,
};

export function createForumPostController(
  api: Pick<ApiClient, "community">,
  postId: string,
  timeoutMs = 15000,
) {
  let state = initial;
  const listeners = new Set<() => void>();
  const controllers = new Set<AbortController>();
  let generation = 0;
  let loadedCommentsPage = 0;

  function publish(patch: Partial<ForumPostState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }

  async function request<T>(fn: (signal: AbortSignal) => Promise<T>) {
    const controller = new AbortController();
    controllers.add(controller);
    try {
      return await withDeadline(
        controller,
        () => fn(controller.signal),
        timeoutMs,
      );
    } finally {
      controllers.delete(controller);
    }
  }

  async function loadPost() {
    const gen = ++generation;
    publish({ post: loading() });
    try {
      const post = await request((signal) =>
        api.community.getPost(postId, { signal }),
      );
      if (gen !== generation) return;
      publish({ post: { phase: "ready", data: post, error: null } });
    } catch (error) {
      if (gen !== generation) return;
      publish({ post: { phase: "error", data: null, error } });
    }
  }

  async function loadComments(page = 1, append = false) {
    const gen = generation;
    if (!append) publish({ comments: loading() });
    try {
      const result = await request((signal) =>
        api.community.listComments(postId, { page, size: 20 }, { signal }),
      );
      if (gen !== generation) return;
      const previous = append ? (state.comments.data?.items ?? []) : [];
      const seen = new Set(previous.map((item) => item.id));
      const items = [
        ...previous,
        ...result.items.filter((item) => !seen.has(item.id)),
      ];
      loadedCommentsPage = page;
      publish({
        comments: {
          phase: "ready",
          data: { ...result, items },
          error: null,
        },
      });
    } catch (error) {
      if (gen !== generation) return;
      const previous = append ? state.comments : null;
      publish({
        comments: {
          phase: "error",
          data: previous?.data ?? null,
          error,
        },
      });
    }
  }

  function patchPost(patch: Partial<ForumPostModel>) {
    if (!state.post.data) return;
    publish({
      post: { ...state.post, data: { ...state.post.data, ...patch } },
    });
  }

  function patchComments(items: ForumCommentModel[], total?: number) {
    if (!state.comments.data) return;
    publish({
      comments: {
        ...state.comments,
        data: {
          ...state.comments.data,
          items,
          total: total ?? state.comments.data.total,
        },
      },
    });
  }

  async function mutate<T>(fn: () => Promise<T>): Promise<T | null> {
    if (state.busy) return null;
    publish({ busy: true, actionError: null });
    try {
      return await fn();
    } catch (error) {
      publish({ actionError: error });
      return null;
    } finally {
      publish({ busy: false });
    }
  }

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => initial,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    load: () => Promise.all([loadPost(), loadComments(1)]),
    retryPost: loadPost,
    retryComments: () => loadComments(1),
    loadMoreComments() {
      return loadComments(loadedCommentsPage + 1, true);
    },
    toggleLike() {
      const current = state.post.data;
      if (!current) return Promise.resolve();
      return mutate(async () => {
        const result = current.likedByMe
          ? await request((signal) =>
              api.community.unlikePost(postId, { signal }),
            )
          : await request((signal) =>
              api.community.likePost(postId, { signal }),
            );
        patchPost({ likedByMe: result.liked, likeCount: result.likeCount });
        return result;
      });
    },
    deletePost() {
      return mutate(async () => {
        await request((signal) => api.community.deletePost(postId, { signal }));
        return true;
      });
    },
    addComment(content: string, parentId: string | null) {
      return mutate(async () => {
        const comment = await request((signal) =>
          api.community.createComment(
            postId,
            { content, parentId },
            { signal },
          ),
        );
        const items = [...(state.comments.data?.items ?? []), comment];
        patchComments(items, (state.comments.data?.total ?? 0) + 1);
        patchPost({ commentCount: (state.post.data?.commentCount ?? 0) + 1 });
        return comment;
      });
    },
    editComment(id: string, content: string) {
      return mutate(async () => {
        const comment = await request((signal) =>
          api.community.updateComment(id, { content }, { signal }),
        );
        patchComments(
          (state.comments.data?.items ?? []).map((item) =>
            item.id === id ? comment : item,
          ),
        );
        return comment;
      });
    },
    removeComment(id: string) {
      return mutate(async () => {
        await request((signal) => api.community.deleteComment(id, { signal }));
        const items = state.comments.data?.items ?? [];
        const hasReplies = items.some((item) => item.parentId === id);
        patchComments(
          hasReplies
            ? items.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      isDeleted: true,
                      content: null,
                      displayContent: "Bình luận đã bị xóa.",
                    }
                  : item,
              )
            : items.filter((item) => item.id !== id),
          hasReplies
            ? undefined
            : Math.max(0, (state.comments.data?.total ?? 1) - 1),
        );
        if (!hasReplies) {
          patchPost({
            commentCount: Math.max(0, (state.post.data?.commentCount ?? 1) - 1),
          });
        }
        return true;
      });
    },
    clearActionError() {
      publish({ actionError: null });
    },
    dispose() {
      generation++;
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    },
  };
}
