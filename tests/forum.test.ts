import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ApiClient } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type {
  ForumCommentModel,
  ForumPostModel,
  ForumPostSummaryModel,
} from "@/lib/api/adapters/community";
import {
  authorName,
  forumApiQuery,
  forumExcerpt,
  forumHref,
  groupComments,
  parseForumQuery,
} from "@/features/forum/model";
import { createForumListResource } from "@/features/forum/listResource";
import { createForumPostController } from "@/features/forum/postController";
import { ForumMarkdown } from "@/features/forum/ForumMarkdown";
import type { PaginatedData } from "@/lib/api/types";

const post: ForumPostSummaryModel = {
  id: "f1000000-0000-4000-8000-000000000001",
  author: {
    id: "11111111-1111-4111-8111-111111111111",
    username: "learner",
    fullName: "Learner Mock",
    displayName: "Learner Mock",
    avatarUrl: null,
  },
  problemId: null,
  languageId: null,
  postType: "discussion",
  status: "published",
  title: "Chia nhỏ bài toán",
  likeCount: 2,
  viewCount: 10,
  commentCount: 1,
  likedByMe: false,
  createdAt: "2026-11-10T00:00:00Z",
  updatedAt: "2026-11-10T00:00:00Z",
  isSolution: false,
};

const detail: ForumPostModel = {
  ...post,
  contentMd: "Nội dung **Markdown**",
  codeSnippet: null,
  hasCodeSnippet: false,
};

const comment = (id: string, parentId: string | null): ForumCommentModel => ({
  id,
  postId: post.id,
  parentId,
  author: post.author,
  content: `Nội dung ${id}`,
  isDeleted: false,
  createdAt: `2026-11-10T00:00:0${id.slice(-1)}Z`,
  updatedAt: "2026-11-10T00:00:00Z",
  isReply: parentId !== null,
  displayContent: `Nội dung ${id}`,
});

const page = (
  items: ForumPostSummaryModel[],
): PaginatedData<ForumPostSummaryModel> => ({
  items,
  page: 1,
  size: 20,
  total: items.length,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("forum query and model helpers", () => {
  it("normalizes invalid filters and keeps a canonical URL", () => {
    const query = parseForumQuery(
      new URLSearchParams(
        "page=0&size=999&sort=hot&postType=news&q=  arrays  ",
      ),
    );
    expect(query).toEqual({
      page: 1,
      size: 20,
      sort: "newest",
      postType: "",
      q: "  arrays  ",
    });
    expect(forumHref(query)).toBe("/forum?q=arrays");
    expect(forumApiQuery(query)).toEqual({
      page: 1,
      size: 20,
      sort: "newest",
      q: "arrays",
    });
  });

  it("roundtrips sort, type and pagination without default noise", () => {
    const query = parseForumQuery(
      new URLSearchParams(
        "sort=likes&postType=solution&page=3&size=50&q=c%C3%A1ch",
      ),
    );
    const href = forumHref(query);
    expect(
      parseForumQuery(new URL(href, "http://localhost").searchParams),
    ).toEqual(query);
    expect(href).toContain("sort=likes");
    expect(href).toContain("postType=solution");
  });

  it("groups one-level replies, keeps orphan replies visible and sorts by time", () => {
    const root = comment("c1", null);
    const reply = comment("c2", "c1");
    const orphan = comment("c3", "missing");
    const threads = groupComments([reply, orphan, root]);
    expect(threads).toHaveLength(2);
    expect(threads[0].root.id).toBe("c1");
    expect(threads[0].replies.map((item) => item.id)).toEqual(["c2"]);
    expect(threads[1].orphan).toBe(true);
  });

  it("uses full name, falls back to username, and truncates excerpts", () => {
    expect(authorName(post)).toBe("Learner Mock");
    expect(authorName({ author: { ...post.author, fullName: null } })).toBe(
      "learner",
    );
    expect(forumExcerpt("a".repeat(10), 5)).toBe("aaaa…");
  });

  it("strips raw HTML and never fetches remote Markdown images", () => {
    const html = renderToStaticMarkup(
      createElement(
        ForumMarkdown,
        null,
        [
          "<script>alert('xss')</script>",
          "",
          "![alt](https://tracker.example/pixel.png)",
        ].join("\n"),
      ),
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("tracker.example");
    expect(html).toContain("alt");
  });
});

describe("forum list resource", () => {
  it("loads a guest list and exposes the ready page", async () => {
    const listPosts = vi.fn().mockResolvedValue(page([post]));
    const resource = createForumListResource({
      community: { listPosts },
    } as unknown as Pick<ApiClient, "community">);
    const query = parseForumQuery(new URLSearchParams());
    await resource.load(query);
    expect(listPosts).toHaveBeenCalledWith(
      forumApiQuery(query),
      expect.any(Object),
    );
    expect(resource.getSnapshot()).toMatchObject({
      phase: "ready",
      data: { total: 1 },
    });
  });

  it("ignores a late response after the query changed and supports retry", async () => {
    const pending = deferred<PaginatedData<ForumPostSummaryModel>>();
    const listPosts = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(page([]));
    const resource = createForumListResource({
      community: { listPosts },
    } as unknown as Pick<ApiClient, "community">);
    const first = resource.load(parseForumQuery(new URLSearchParams()));
    await resource.load(
      parseForumQuery(new URLSearchParams("postType=question")),
    );
    pending.resolve(page([post]));
    await first;
    expect(resource.getSnapshot().data?.total).toBe(0);
    expect(resource.getSnapshot().phase).toBe("ready");
  });

  it("publishes an error and recovers through retry", async () => {
    const listPosts = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(503, "UNAVAILABLE"))
      .mockResolvedValueOnce(page([post]));
    const resource = createForumListResource({
      community: { listPosts },
    } as unknown as Pick<ApiClient, "community">);
    const query = parseForumQuery(new URLSearchParams());
    await resource.load(query);
    expect(resource.getSnapshot()).toMatchObject({ phase: "error" });
    await resource.load(query);
    expect(resource.getSnapshot()).toMatchObject({ phase: "ready" });
  });
});

describe("forum post controller", () => {
  const comments: PaginatedData<ForumCommentModel> = {
    items: [comment("c1", null), comment("c2", "c1")],
    page: 1,
    size: 20,
    total: 2,
  };

  function setup() {
    const community = {
      getPost: vi.fn().mockResolvedValue(detail),
      listComments: vi.fn().mockResolvedValue(comments),
      likePost: vi.fn().mockResolvedValue({ liked: true, likeCount: 3 }),
      unlikePost: vi.fn().mockResolvedValue({ liked: false, likeCount: 2 }),
      deletePost: vi.fn().mockResolvedValue(undefined),
      createComment: vi.fn().mockResolvedValue(comment("c3", null)),
      updateComment: vi
        .fn()
        .mockImplementation((id: string, payload: { content: string }) =>
          Promise.resolve({ ...comment(id, null), content: payload.content }),
        ),
      deleteComment: vi.fn().mockResolvedValue(undefined),
    };
    return {
      community,
      controller: createForumPostController(
        { community } as unknown as Pick<ApiClient, "community">,
        post.id,
      ),
    };
  }

  it("loads the post and comments together", async () => {
    const { controller } = setup();
    await controller.load();
    expect(controller.getSnapshot().post.data?.title).toBe(post.title);
    expect(controller.getSnapshot().comments.data?.total).toBe(2);
  });

  it("advances comment pages by server page, not by visible item count", async () => {
    const { controller, community } = setup();
    await controller.load();
    await controller.loadMoreComments();
    expect(community.listComments).toHaveBeenNthCalledWith(
      2,
      post.id,
      { page: 2, size: 20 },
      expect.any(Object),
    );
  });

  it("likes and unlikes with server state", async () => {
    const { controller, community } = setup();
    await controller.load();
    await controller.toggleLike();
    expect(community.likePost).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().post.data).toMatchObject({
      likedByMe: true,
      likeCount: 3,
    });
    await controller.toggleLike();
    expect(community.unlikePost).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().post.data).toMatchObject({
      likedByMe: false,
      likeCount: 2,
    });
  });

  it("appends a comment and increments the post counter", async () => {
    const { controller, community } = setup();
    await controller.load();
    const created = await controller.addComment("Thêm bình luận", null);
    expect(community.createComment).toHaveBeenCalledWith(
      post.id,
      { content: "Thêm bình luận", parentId: null },
      expect.any(Object),
    );
    expect(created?.id).toBe("c3");
    expect(controller.getSnapshot().comments.data).toMatchObject({
      total: 3,
    });
    expect(controller.getSnapshot().post.data?.commentCount).toBe(2);
  });

  it("keeps a tombstone when a deleted comment has replies and removes a leaf", async () => {
    const { controller, community } = setup();
    await controller.load();
    const tombstone = {
      ...comment("c1", null),
      isDeleted: true,
      content: null,
      displayContent: "Bình luận đã bị xóa.",
    };
    community.listComments.mockResolvedValueOnce({
      ...comments,
      items: [tombstone, comment("c2", "c1")],
    });
    await controller.removeComment("c1");
    const afterRoot = controller.getSnapshot().comments.data;
    expect(afterRoot?.items.find((item) => item.id === "c1")).toMatchObject({
      isDeleted: true,
      content: null,
      displayContent: "Bình luận đã bị xóa.",
    });
    expect(afterRoot?.items.some((item) => item.id === "c2")).toBe(true);
    community.listComments.mockResolvedValueOnce({
      ...comments,
      total: 0,
      items: [],
    });
    await controller.removeComment("c2");
    expect(
      controller
        .getSnapshot()
        .comments.data?.items.some((item) => item.id === "c2"),
    ).toBe(false);
  });

  it("exposes action errors without dropping loaded data", async () => {
    const { controller, community } = setup();
    await controller.load();
    community.likePost.mockRejectedValueOnce(new ApiError(403, "FORBIDDEN"));
    await controller.toggleLike();
    expect(controller.getSnapshot().actionError).toMatchObject({
      code: "FORBIDDEN",
    });
    expect(controller.getSnapshot().post.data).toEqual(detail);
  });
  it("does not cancel pending comments when retrying only the post", async () => {
    const { controller, community } = setup();
    const pending = deferred<PaginatedData<ForumCommentModel>>();
    community.listComments.mockReturnValueOnce(pending.promise);
    const first = controller.load();
    await controller.retryPost();
    pending.resolve(comments);
    await first;
    expect(controller.getSnapshot().comments.phase).toBe("ready");
    controller.dispose();
  });

  it("coalesces repeated load-more actions while the comment page is pending", async () => {
    const { controller, community } = setup();
    await controller.load();
    const pending = deferred<PaginatedData<ForumCommentModel>>();
    community.listComments.mockReturnValue(pending.promise);
    const first = controller.loadMoreComments();
    const second = controller.loadMoreComments();
    expect(community.listComments).toHaveBeenCalledTimes(2);
    pending.resolve({ ...comments, page: 2, items: [] });
    await Promise.all([first, second]);
    controller.dispose();
  });

  it("does not retain comments for an inaccessible or hidden post", async () => {
    const { controller, community } = setup();
    community.getPost.mockRejectedValue(new ApiError(404, "NOT_FOUND"));
    await controller.load();
    expect(controller.getSnapshot().post.phase).toBe("error");
    expect(controller.getSnapshot().comments.data).toBeNull();
    controller.dispose();
  });

  it("reloads server tombstone state when replies may be on another page", async () => {
    const { controller, community } = setup();
    community.listComments.mockResolvedValueOnce({
      ...comments,
      items: [comment("c1", null)],
    });
    await controller.load();
    community.listComments.mockResolvedValue({
      ...comments,
      items: [
        {
          ...comment("c1", null),
          isDeleted: true,
          content: null,
          displayContent: "Bình luận đã bị xóa.",
        },
      ],
    });
    await controller.removeComment("c1");
    expect(community.listComments).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot().comments.data?.items[0]?.isDeleted).toBe(
      true,
    );
    controller.dispose();
  });
});
