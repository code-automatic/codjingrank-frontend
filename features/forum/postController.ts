import type { ApiClient } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
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
  commentsLoading: boolean;
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
  commentsLoading: false,
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
  let postVersion = 0;
  let commentsVersion = 0;
  let loadedCommentsPage = 0;
  let commentsFlight: Promise<void> | null = null;
  let active = true;

  function publish(patch: Partial<ForumPostState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }
  async function request<T>(fn: (signal: AbortSignal) => Promise<T>) {
    const gen = generation;
    const controller = new AbortController();
    controllers.add(controller);
    try {
      const result = await withDeadline(
        controller,
        () => fn(controller.signal),
        timeoutMs,
      );
      if (!active || gen !== generation || controller.signal.aborted)
        throw new DOMException("Aborted", "AbortError");
      return result;
    } finally {
      controllers.delete(controller);
    }
  }
  function clearComments() {
    commentsVersion++;
    commentsFlight = null;
    loadedCommentsPage = 0;
    publish({
      comments: { phase: "ready", data: null, error: null },
      commentsLoading: false,
    });
  }
  async function loadPost() {
    const gen = generation;
    const version = ++postVersion;
    publish({ post: loading() });
    try {
      const post = await request((signal) =>
        api.community.getPost(postId, { signal }),
      );
      if (!active || gen !== generation || version !== postVersion) return;
      if (post.id !== postId) throw new ApiError(200, "INVALID_API_RESPONSE");
      publish({ post: { phase: "ready", data: post, error: null } });
    } catch (error) {
      if (!active || gen !== generation || version !== postVersion) return;
      if (error instanceof ApiError && [401, 403, 404].includes(error.status))
        clearComments();
      publish({ post: { phase: "error", data: null, error } });
    }
  }
  function loadComments(page = 1, append = false): Promise<void> {
    const gen = generation;
    const version = ++commentsVersion;
    if (!append) publish({ comments: loading() });
    publish({ commentsLoading: true });
    const promise = (async () => {
      try {
        const result = await request((signal) =>
          api.community.listComments(postId, { page, size: 20 }, { signal }),
        );
        if (!active || gen !== generation || version !== commentsVersion)
          return;
        const previous = append ? (state.comments.data?.items ?? []) : [];
        const seen = new Set(previous.map((item) => item.id));
        const items = [
          ...previous,
          ...result.items.filter((item) => !seen.has(item.id)),
        ];
        loadedCommentsPage = result.page;
        publish({
          comments: { phase: "ready", data: { ...result, items }, error: null },
        });
      } catch (error) {
        if (!active || gen !== generation || version !== commentsVersion)
          return;
        publish({
          comments: {
            phase: "error",
            data: append ? state.comments.data : null,
            error,
          },
        });
      } finally {
        if (active && gen === generation && version === commentsVersion) {
          commentsFlight = null;
          publish({ commentsLoading: false });
        }
      }
    })();
    commentsFlight = promise;
    return promise;
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
    if (!active || state.busy) return null;
    const gen = generation;
    publish({ busy: true, actionError: null });
    try {
      return await fn();
    } catch (error) {
      if (active && gen === generation) publish({ actionError: error });
      return null;
    } finally {
      if (active && gen === generation) publish({ busy: false });
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
    load() {
      active = true;
      return Promise.all([loadPost(), loadComments(1)]);
    },
    retryPost: loadPost,
    retryComments: () => loadComments(1),
    loadMoreComments() {
      return commentsFlight ?? loadComments(loadedCommentsPage + 1, true);
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
        patchComments(
          [...(state.comments.data?.items ?? []), comment],
          (state.comments.data?.total ?? 0) + 1,
        );
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
        await Promise.all([loadPost(), loadComments(1)]);
        return true;
      });
    },
    clearActionError() {
      publish({ actionError: null });
    },
    dispose() {
      active = false;
      generation++;
      postVersion++;
      commentsVersion++;
      commentsFlight = null;
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    },
  };
}
