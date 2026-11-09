import { readFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import { parse } from "yaml";
import { createSession, type AuthData } from "@/features/auth/store";
import {
  ApiError,
  buildApiPath,
  createApiClient,
  createTransport,
  errorText,
} from "@/lib/api";

const UUID1 = "11111111-1111-4111-8111-111111111111";

type OpenApiSpec = {
  paths: Record<
    string,
    Record<
      string,
      {
        responses: Record<
          string,
          {
            content?: {
              "application/json"?: {
                example?: unknown;
                examples?: Record<string, { value: unknown }>;
              };
            };
          }
        >;
      }
    >
  >;
};

const openApiSpec = parse(
  readFileSync(
    new URL("../contracts/openapi_fe.yaml", import.meta.url),
    "utf8",
  ),
) as OpenApiSpec;

const authData: AuthData = {
  accessToken: "valid-token",
  user: {
    id: UUID1,
    email: "learner@example.com",
    username: "bradar",
    fullName: "Trung Hieu",
    avatarUrl: null,
    bio: null,
    role: "student",
    isActive: true,
    createdAt: "2026-11-07T00:00:00Z",
    updatedAt: "2026-11-07T00:00:00Z",
  },
};

function envelopeResponse(data: unknown, status = 200) {
  return new Response(
    JSON.stringify({
      status: "success",
      code: status,
      message: "ok",
      data,
    }),
    { status },
  );
}

function openapiResponse(
  path: string,
  method = "get",
  status = "200",
  exampleName?: string,
) {
  if (status === "204") return new Response(null, { status: 204 });
  const content =
    openApiSpec.paths[path]?.[method]?.responses[status]?.content?.[
      "application/json"
    ];
  const body = exampleName
    ? content?.examples?.[exampleName]?.value
    : (content?.example ?? Object.values(content?.examples || {})[0]?.value);
  return new Response(JSON.stringify(body), { status: Number(status) });
}

describe("API client transport, routing, and domain endpoints", () => {
  it("buildApiPath skips undefined/null/empty values and retains false and zero", () => {
    expect(
      buildApiPath("/api/v1/problems", {
        page: 1,
        size: 20,
        package: "arrays",
        solved: false,
        tag: "",
        q: undefined,
      }),
    ).toBe("/api/v1/problems?page=1&size=20&package=arrays&solved=false");
  });

  it("allows double-dots in search query strings while blocking pathname traversal", async () => {
    const fetcher = vi.fn(async () =>
      openapiResponse("/api/v1/problems", "get", "200", "populated"),
    );
    const send = createTransport("http://gateway", fetcher);

    await send("/api/v1/problems?q=sum..two");
    expect(fetcher).toHaveBeenCalledTimes(1);

    await expect(send("/api/v1/packages/../admin")).rejects.toThrow(
      "Invalid API path",
    );
    await expect(send("/api/v1//problems")).rejects.toThrow("Invalid API path");
  });

  it("parses Retry-After into ApiError and maps OpenAPI machine codes cleanly", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "error",
            code: 429,
            message: "Too fast",
            error: "SUBMISSION_COOLDOWN",
            details: null,
          }),
          {
            status: 429,
            headers: { "Retry-After": "10" },
          },
        ),
    );
    const send = createTransport("http://gateway", fetcher);
    const client = createApiClient({
      authRequest: (path, init) => send(path, init, "token"),
      publicRequest: (path, init) => send(path, init),
    });

    let caught: unknown;
    try {
      await client.judge.submitCode({
        problemId: UUID1,
        languageId: UUID1,
        code: "print(1)",
      });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).retryAfterSec).toBe(10);
    expect(errorText(caught)).toContain("10 giây");
    expect(errorText(new ApiError(403, "LEVEL_LOCKED"))).toContain("cấp độ");
    expect(errorText(new ApiError(422, "LANGUAGE_NOT_SUPPORTED"))).toContain(
      "Ngôn ngữ",
    );
    expect(errorText(new ApiError(409, "AI_REVIEW_NOT_ELIGIBLE"))).toContain(
      "Accepted",
    );
    expect(errorText(new ApiError(403, "SOLUTION_NOT_ALLOWED"))).toContain(
      "Accepted",
    );
    expect(errorText(new ApiError(422, "INVALID_COMMENT_PARENT"))).toContain(
      "bình luận gốc",
    );
    expect(errorText(new ApiError(502, "UPSTREAM_ERROR"))).toContain("thử lại");
    expect(errorText(new ApiError(504, "TIMEOUT"))).toContain("thử lại");
  });

  it("integrates protected catalog/judge calls with single-flight 401 refresh", async () => {
    let refreshCount = 0;
    const fetcher = vi.fn(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        const target = String(url);
        if (target.endsWith("/api/v1/auth/refresh")) {
          refreshCount++;
          return envelopeResponse(authData, 200);
        }
        const hasBearer = new Headers(init?.headers).has("Authorization");
        if (!hasBearer) {
          return new Response(
            JSON.stringify({
              status: "error",
              code: 401,
              message: "expired",
              error: "UNAUTHORIZED",
              details: null,
            }),
            { status: 401 },
          );
        }
        if (target.includes("/api/v1/packages/arrays/levels")) {
          return openapiResponse("/api/v1/packages/{slug}/levels");
        }
        if (target.includes("/api/v1/packages")) {
          return openapiResponse("/api/v1/packages", "get", "200", "populated");
        }
        throw new Error(`Unexpected URL: ${target}`);
      },
    );

    const send = createTransport("http://gateway", fetcher);
    const store = createSession(send);
    const client = createApiClient({
      authRequest: store.request,
      publicRequest: (path, init) => send(path, init),
      isAuthenticated: () => store.getSnapshot().status === "authenticated",
    });

    const [pkgPage, pkgLevels] = await Promise.all([
      client.catalog.listPackages({ page: 1, size: 20, q: "array" }),
      client.catalog.getPackageLevels("arrays"),
    ]);

    expect(refreshCount).toBe(1);
    expect(pkgPage.items[0].slug).toBe("arrays");
    expect(pkgLevels.levels).toHaveLength(3);
  });

  it("routes Optional Bearer endpoints cleanly for anonymous guests vs authenticated learners", async () => {
    const authCalls: string[] = [];
    const publicCalls: string[] = [];

    const clientAsGuest = createApiClient({
      authRequest: async (path) => {
        authCalls.push(path);
        throw new Error("Should not hit authRequest for guest");
      },
      publicRequest: async (path) => {
        publicCalls.push(path);
        const res = openapiResponse(
          "/api/v1/leaderboard",
          "get",
          "200",
          "empty",
        );
        const json = (await res.json()) as { data: unknown };
        return json.data as never;
      },
      isAuthenticated: () => false,
    });

    const guestLb = await clientAsGuest.community.getLeaderboard({
      scope: "all",
      page: 1,
      size: 50,
    });
    expect(guestLb.items).toEqual([]);
    expect(authCalls).toEqual([]);
    expect(publicCalls).toEqual([
      "/api/v1/leaderboard?scope=all&page=1&size=50",
    ]);

    const clientAsUser = createApiClient({
      authRequest: async (path) => {
        authCalls.push(path);
        const res = openapiResponse(
          "/api/v1/forum/posts",
          "get",
          "200",
          "populated",
        );
        const json = (await res.json()) as { data: unknown };
        return json.data as never;
      },
      publicRequest: async (path) => {
        publicCalls.push(path);
        throw new Error("Should not hit publicRequest when authenticated");
      },
      isAuthenticated: () => true,
    });

    const posts = await clientAsUser.community.listPosts({ sort: "newest" });
    expect(posts.items).toHaveLength(1);
    expect(authCalls).toEqual(["/api/v1/forum/posts?sort=newest"]);
  });

  it("enforces preflight slug/UUID validation and 102400-byte code limit before fetch", async () => {
    const fetcher = vi.fn();
    const send = createTransport("http://gateway", fetcher);
    const client = createApiClient({
      authRequest: (path, init) => send(path, init, "tok"),
      publicRequest: (path, init) => send(path, init),
    });

    await expect(
      client.catalog.getPackage("Invalid Slug!"),
    ).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });

    await expect(client.judge.getSubmission("12345")).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    });

    await expect(
      client.judge.runSamples({
        problemId: UUID1,
        languageId: UUID1,
        code: "   \n  ",
      }),
    ).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });

    // 'ế' is 3 UTF-8 bytes; 35000 chars = 105000 bytes > 102400
    await expect(
      client.judge.submitCode({
        problemId: UUID1,
        languageId: UUID1,
        code: "ế".repeat(35000),
      }),
    ).rejects.toMatchObject({ status: 413, code: "REQUEST_TOO_LARGE" });

    await expect(
      client.community.createPost({
        title: "My Solution",
        contentMd: "Explanation",
        postType: "solution",
        problemId: null,
      }),
    ).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });

    await expect(
      client.account.changePassword({
        currentPassword: "Coding2026",
        newPassword: "short",
      }),
    ).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("forwards AbortSignal and supports 204 bodyless responses across domain operations", async () => {
    const signals: Array<AbortSignal | null | undefined> = [];
    const fetcher = vi.fn(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        signals.push(init?.signal);
        const target = String(url);
        if (target.endsWith("/api/v1/forum/posts/" + UUID1)) {
          if (init?.method === "DELETE")
            return new Response(null, { status: 204 });
        }
        if (target.endsWith("/api/v1/public/landing")) {
          return openapiResponse("/api/v1/public/landing");
        }
        if (target.endsWith("/api/v1/daily-challenge")) {
          return openapiResponse("/api/v1/daily-challenge");
        }
        if (target.endsWith("/api/v1/submit")) {
          return openapiResponse("/api/v1/submit", "post", "201", "pending");
        }
        if (target.endsWith("/api/v1/forum/posts/" + UUID1 + "/like")) {
          return openapiResponse("/api/v1/forum/posts/{id}/like", "put");
        }
        throw new Error(`Unhandled test request: ${init?.method} ${target}`);
      },
    );

    const controller = new AbortController();
    const send = createTransport("http://gateway", fetcher);
    const client = createApiClient({
      authRequest: (path, init) => send(path, init, "tok"),
      publicRequest: (path, init) => send(path, init),
    });

    const landing = await client.catalog.getLanding({
      signal: controller.signal,
    });
    expect(landing.languages[0].slug).toBe("python3");

    const daily = await client.catalog.getDailyChallenge();
    expect(daily.problem.slug).toBe("sum-two");

    const created = await client.judge.submitCode({
      problemId: UUID1,
      languageId: UUID1,
      code: "print(3)\n",
    });
    expect(created.status).toBe("Pending");

    const like = await client.community.likePost(UUID1);
    expect(like.liked).toBe(true);

    await expect(client.community.deletePost(UUID1)).resolves.toBeUndefined();
    expect(signals[0]).toBe(controller.signal);
  });
});
