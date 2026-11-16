import { describe, expect, it, vi } from "vitest";
import {
  boardApiQuery,
  boardHref,
  myRankQuery,
  parseBoardQuery,
} from "@/features/leaderboard/query";
import { createBoardResource } from "@/features/leaderboard/resource";
import { ApiError } from "@/lib/api/client";
import type { ApiClient } from "@/lib/api";
import type {
  LeaderboardDataModel,
  MyRankDataModel,
} from "@/lib/api/adapters/community";
const query = parseBoardQuery(new URLSearchParams());
const board: LeaderboardDataModel = {
  scope: "all",
  packageSlug: null,
  periodStart: null,
  periodEnd: null,
  items: [],
  page: 1,
  size: 50,
  total: 0,
  hasPeriodBounds: false,
};
const me: MyRankDataModel = {
  scope: "all",
  packageSlug: null,
  periodStart: null,
  periodEnd: null,
  entry: null,
  isRanked: false,
};
function setup() {
  const getLeaderboard = vi.fn().mockResolvedValue(board);
  const getMyRank = vi.fn().mockResolvedValue(me);
  const api = { community: { getLeaderboard, getMyRank } } as unknown as Pick<
    ApiClient,
    "community"
  >;
  return { getLeaderboard, getMyRank, api };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("leaderboard query", () => {
  it("normalizes invalid numbers and scope without allowing negative, float, infinity or oversized values", () => {
    for (const value of ["0", "-1", "1.5", "NaN", "1e2", "9007199254740992"]) {
      expect(parseBoardQuery(new URLSearchParams({ page: value })).page).toBe(
        1,
      );
    }
    expect(parseBoardQuery(new URLSearchParams("scope=oops&size=101"))).toEqual(
      query,
    );
    expect(parseBoardQuery(new URLSearchParams("size=100&page=2")).size).toBe(
      100,
    );
  });
  it("roundtrips encoded filters and omits pagination from my rank", () => {
    const q = {
      ...query,
      scope: "week" as const,
      package: "gói & bài",
      page: 3,
      size: 20,
    };
    const href = boardHref(q);
    expect(
      parseBoardQuery(new URL(href, "http://localhost").searchParams),
    ).toEqual(q);
    expect(myRankQuery(q)).toEqual({ scope: "week", package: "gói & bài" });
    expect(boardApiQuery(q)).toEqual(q);
    expect(boardHref(query)).toBe("/leaderboard");
  });
});

describe("leaderboard resource", () => {
  it("loads the guest first page without requesting private rank", async () => {
    const { api, getMyRank, getLeaderboard } = setup();
    const resource = createBoardResource(api);
    await resource.load(query, false);
    expect(getMyRank).not.toHaveBeenCalled();
    expect(getLeaderboard).toHaveBeenCalledTimes(1);
    expect(resource.getSnapshot().board.phase).toBe("ready");
    expect(resource.getSnapshot().me.phase).toBe("guest");
  });
  it.each([
    { ...query, scope: "week" as const },
    { ...query, scope: "month" as const },
    { ...query, page: 2 },
    { ...query, size: 100 },
  ])("does not send restricted guest query %j", async (q) => {
    const { api, getLeaderboard, getMyRank } = setup();
    const resource = createBoardResource(api);
    await resource.load(q, false);
    expect(getLeaderboard).not.toHaveBeenCalled();
    expect(getMyRank).not.toHaveBeenCalled();
    expect(resource.getSnapshot().board.phase).toBe("guest");
  });
  it("keeps board ready on my-rank failure and retries only the failed request", async () => {
    const { api, getLeaderboard, getMyRank } = setup();
    getMyRank.mockRejectedValueOnce(new ApiError(503, "UNAVAILABLE"));
    const resource = createBoardResource(api);
    await resource.load(query, true);
    expect(resource.getSnapshot().board.phase).toBe("ready");
    expect(resource.getSnapshot().me.phase).toBe("error");
    await resource.retry("me", query, true);
    expect(getLeaderboard).toHaveBeenCalledTimes(1);
    expect(resource.getSnapshot().me.data?.entry).toBeNull();
  });
  it("discards late results after changing filters even if transport ignores abort", async () => {
    const { api, getLeaderboard } = setup();
    const old = deferred<LeaderboardDataModel>();
    getLeaderboard.mockReturnValueOnce(old.promise);
    const resource = createBoardResource(api);
    const first = resource.load(query, true);
    await resource.load({ ...query, scope: "week" }, true);
    old.resolve({ ...board, total: 99 });
    await first;
    expect(resource.getSnapshot().board.data?.total).toBe(0);
    resource.dispose();
  });
  it("clears private data on logout and cannot restore it with a late response", async () => {
    const { api, getMyRank } = setup();
    const old = deferred<MyRankDataModel>();
    getMyRank.mockReturnValueOnce(old.promise);
    const resource = createBoardResource(api);
    const first = resource.load(query, true);
    await resource.load(query, false);
    old.resolve(me);
    await first;
    expect(resource.getSnapshot().me).toMatchObject({
      phase: "guest",
      data: null,
    });
  });
  it("bounds a hung request and allows retry", async () => {
    vi.useFakeTimers();
    try {
      const { api, getLeaderboard } = setup();
      getLeaderboard.mockReturnValueOnce(new Promise(() => {}));
      const resource = createBoardResource(api, 10);
      const loading = resource.load(query, false);
      await vi.advanceTimersByTimeAsync(11);
      await loading;
      expect(resource.getSnapshot().board.error).toMatchObject({
        code: "REQUEST_TIMEOUT",
      });
      await resource.retry("board", query, false);
      expect(resource.getSnapshot().board.phase).toBe("ready");
      resource.dispose();
    } finally {
      vi.useRealTimers();
    }
  });
  it("disposal aborts both requests and prevents all later publications", async () => {
    const { api, getLeaderboard, getMyRank } = setup();
    const old = deferred<LeaderboardDataModel>();
    getLeaderboard.mockReturnValueOnce(old.promise);
    getMyRank.mockReturnValueOnce(new Promise(() => {}));
    const resource = createBoardResource(api);
    const notify = vi.fn();
    resource.subscribe(notify);
    const loading = resource.load(query, true);
    resource.dispose();
    notify.mockClear();
    old.resolve(board);
    await loading;
    expect(notify).not.toHaveBeenCalled();
    expect(getLeaderboard.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it("does not silently fall back to guest after a rejected authenticated request", async () => {
    const { api, getLeaderboard } = setup();
    getLeaderboard.mockRejectedValue(new ApiError(401, "UNAUTHORIZED"));
    const resource = createBoardResource(api);
    await resource.load(query, true);
    expect(resource.getSnapshot().board.phase).toBe("error");
    expect(getLeaderboard).toHaveBeenCalledTimes(1);
  });
});
