import type { ApiClient } from "@/lib/api";
import type { ForumPostSummaryModel } from "@/lib/api/adapters/community";
import type { PaginatedData } from "@/lib/api/types";
import { withDeadline } from "@/lib/api/deadline";
import { forumApiQuery, type ForumQuery } from "./model";

export type ForumListState = {
  phase: "loading" | "ready" | "error";
  data: PaginatedData<ForumPostSummaryModel> | null;
  error: unknown;
};

const initial: ForumListState = {
  phase: "loading",
  data: null,
  error: null,
};

export function createForumListResource(
  api: Pick<ApiClient, "community">,
  timeoutMs = 15000,
) {
  let state = initial;
  const listeners = new Set<() => void>();
  let controller: AbortController | undefined;
  let generation = 0;

  function publish(patch: ForumListState) {
    state = patch;
    listeners.forEach((listener) => listener());
  }

  async function load(query: ForumQuery) {
    const gen = ++generation;
    controller?.abort();
    controller = new AbortController();
    publish(initial);
    try {
      const data = await withDeadline(
        controller,
        () =>
          api.community.listPosts(forumApiQuery(query), {
            signal: controller!.signal,
          }),
        timeoutMs,
      );
      if (gen !== generation) return;
      publish({ phase: "ready", data, error: null });
    } catch (error) {
      if (gen !== generation) return;
      if (error instanceof DOMException && error.name === "AbortError") return;
      publish({ phase: "error", data: null, error });
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
    load,
    dispose() {
      generation++;
      controller?.abort();
    },
  };
}
