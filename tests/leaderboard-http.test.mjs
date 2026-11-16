import { spawn } from "node:child_process";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createTransport } from "../lib/api/client";
import { createApiClient } from "../lib/api";
import { createLeaderboardDemo } from "../scripts/leaderboard-demo.mjs";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
let child;
let base;
let api;
const auth = { Authorization: "Bearer mock-access-token" };
beforeAll(async () => {
  child = spawn(process.execPath, ["scripts/mock.mjs"], {
    env: { ...process.env, MOCK_PORT: "0", MOCK_LEADERBOARD_DEMO: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  base = await new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(Error("Mock startup timed out")),
      10000,
    );
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(Error(`Mock exited ${code}`));
    });
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const port = /http:\/\/localhost:(\d+)/.exec(output)?.[1];
      if (port) {
        clearTimeout(timer);
        resolve(`http://127.0.0.1:${port}`);
      }
    });
  });
  const send = createTransport(base);
  api = createApiClient({
    publicRequest: send,
    authRequest: (path, init) => send(path, init, "mock-access-token"),
    isAuthenticated: () => true,
  });
}, 15000);
afterAll(async () => {
  if (child && child.exitCode === null)
    await new Promise((resolve) => {
      child.once("exit", resolve);
      child.kill();
    });
});

describe("leaderboard over real mock HTTP", () => {
  it("returns server ranks with ties and gaps and authenticated personal rank outside first page", async () => {
    const board = await api.community.getLeaderboard({ page: 1, size: 50 });
    const me = await api.community.getMyRank({ scope: "all" });
    expect(board.items.slice(0, 4).map((row) => row.rank)).toEqual([
      1, 1, 3, 3,
    ]);
    expect(board.items).toHaveLength(50);
    expect(me.entry.rank).toBe(63);
    expect(board.items.some((row) => row.userId === me.entry.userId)).toBe(
      false,
    );
    expect(board.periodStart).toBeNull();
  });
  it("paginates and filters both operations consistently", async () => {
    const board = await api.community.getLeaderboard({
      scope: "month",
      package: "arrays",
      page: 2,
      size: 50,
    });
    const me = await api.community.getMyRank({
      scope: "month",
      package: "arrays",
    });
    expect(board.items).toHaveLength(13);
    expect(board.scope).toBe("month");
    expect(board.packageSlug).toBe("arrays");
    expect(board.periodStart).toBe(me.periodStart);
    expect(new Date(board.periodStart).getUTCDate()).toBe(1);
    const empty = await api.community.getLeaderboard({
      package: "no-such-package",
    });
    expect(empty.total).toBe(0);
    expect(
      (await api.community.getMyRank({ package: "no-such-package" })).entry,
    ).toBeNull();
  });
  it.each(["?scope=week", "?scope=month", "?page=2", "?size=51"])(
    "rejects restricted guest requests %s",
    async (query) => {
      expect((await fetch(`${base}/api/v1/leaderboard${query}`)).status).toBe(
        401,
      );
    },
  );
  it("supports allowed guest read, but rejects invalid supplied token and private rank", async () => {
    expect((await fetch(`${base}/api/v1/leaderboard`)).status).toBe(200);
    expect((await fetch(`${base}/api/v1/leaderboard/me`)).status).toBe(401);
    expect(
      (
        await fetch(`${base}/api/v1/leaderboard`, {
          headers: { Authorization: "Bearer invalid" },
        })
      ).status,
    ).toBe(401);
  });
  it.each(["size=101", "page=0", "page=1.5", "scope=year"])(
    "rejects malformed queries %s",
    async (query) => {
      expect(
        (await fetch(`${base}/api/v1/leaderboard?${query}`, { headers: auth }))
          .status,
      ).toBe(400);
    },
  );
  it("keeps Prefer contract error examples and CORS preflight intact", async () => {
    expect(
      (
        await fetch(`${base}/api/v1/leaderboard`, {
          headers: { Prefer: "code=500" },
        })
      ).status,
    ).toBe(500);
    const response = await fetch(`${base}/api/v1/leaderboard`, {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:3000" },
    });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000",
    );
  });
  it("uses Monday UTC week boundaries across month/year and leap month boundaries", () => {
    const spec = parse(readFileSync("contracts/openapi_fe.yaml", "utf8"));
    const call = (date, scope) =>
      createLeaderboardDemo(spec, () => new Date(date))(
        {
          method: "GET",
          headers: { authorization: "Bearer mock-access-token" },
        },
        new URL(`http://localhost/api/v1/leaderboard?scope=${scope}`),
      ).body.data;
    const week = call("2027-01-03T23:59:59Z", "week");
    expect(week.periodStart).toBe("2026-12-28T00:00:00.000Z");
    expect(week.periodEnd).toBe("2027-01-04T00:00:00.000Z");
    expect(call("2028-02-29T01:00:00Z", "month").periodEnd).toBe(
      "2028-03-01T00:00:00.000Z",
    );
  });
});
