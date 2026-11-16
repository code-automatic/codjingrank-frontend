import type { ApiClient } from "@/lib/api";
import {
  canGuestReadLeaderboard,
  type LeaderboardDataModel,
  type MyRankDataModel,
} from "@/lib/api/adapters/community";
import { withDeadline } from "@/lib/api/deadline";
import { boardApiQuery, myRankQuery, type BoardQuery } from "./query";

type Result<T> = {
  phase: "loading" | "ready" | "error" | "guest";
  data: T | null;
  error: unknown;
};
export type BoardState = {
  board: Result<LeaderboardDataModel>;
  me: Result<MyRankDataModel>;
};
const loading = <T>(): Result<T> => ({
  phase: "loading",
  data: null,
  error: null,
});

export function createBoardResource(
  api: Pick<ApiClient, "community">,
  timeoutMs = 15000,
) {
  let state: BoardState = { board: loading(), me: loading() };
  const initial = state;
  const listeners = new Set<() => void>();
  const controllers = new Map<"board" | "me", AbortController>();
  const generations = { board: 0, me: 0 };
  function publish(patch: Partial<BoardState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }
  async function loadPart(
    part: "board" | "me",
    query: BoardQuery,
    authenticated: boolean,
  ) {
    controllers.get(part)?.abort();
    const generation = ++generations[part];
    const controller = new AbortController();
    controllers.set(part, controller);
    if (!authenticated && (part === "me" || !canGuestReadLeaderboard(query))) {
      publish({ [part]: { phase: "guest", data: null, error: null } });
      return;
    }
    publish({ [part]: loading() });
    try {
      const data = await withDeadline<LeaderboardDataModel | MyRankDataModel>(
        controller,
        () =>
          part === "board"
            ? api.community.getLeaderboard(boardApiQuery(query), {
                signal: controller.signal,
              })
            : api.community.getMyRank(myRankQuery(query), {
                signal: controller.signal,
              }),
        timeoutMs,
      );
      if (generation !== generations[part] || controller.signal.aborted) return;
      publish({ [part]: { phase: "ready", data, error: null } });
    } catch (error) {
      if (generation !== generations[part]) return;
      if (error instanceof DOMException && error.name === "AbortError") return;
      publish({ [part]: { phase: "error", data: null, error } });
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
    load: (query: BoardQuery, authenticated: boolean) =>
      Promise.all([
        loadPart("board", query, authenticated),
        loadPart("me", query, authenticated),
      ]),
    retry: loadPart,
    dispose() {
      for (const part of ["board", "me"] as const) {
        generations[part]++;
        controllers.get(part)?.abort();
      }
    },
  };
}
