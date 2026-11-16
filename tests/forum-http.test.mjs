import { spawn } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTransport } from "../lib/api/client";
import { createApiClient } from "../lib/api";

let child;
let base;
let api;
let guestApi;
const AUTHOR = "Bearer mock-access-token";
const OTHER = "Bearer mock-other-token";
const SEED_POST = "f1000000-0000-4000-8000-000000000001";
const MY_POST = "f1000000-0000-4000-8000-000000000002";

beforeAll(async () => {
  child = spawn(process.execPath, ["scripts/mock.mjs"], {
    env: { ...process.env, MOCK_PORT: "0", MOCK_FORUM_DEMO: "1" },
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
  const client = (token) =>
    createApiClient({
      publicRequest: send,
      authRequest: (path, init) => send(path, init, token),
      isAuthenticated: () => Boolean(token),
    });
  api = client("mock-access-token");
  guestApi = client();
}, 15000);

afterAll(async () => {
  if (child && child.exitCode === null)
    await new Promise((resolve) => {
      child.once("exit", resolve);
      child.kill();
    });
});

describe("forum over real mock HTTP", () => {
  it("lists only published posts for a guest and applies filters", async () => {
    const list = await guestApi.community.listPosts({ page: 1, size: 20 });
    expect(list.total).toBe(3);
    expect(list.items.some((item) => item.title.includes("bị ẩn"))).toBe(false);
    expect(list.items.every((item) => item.likedByMe === false)).toBe(true);
    const questions = await api.community.listPosts({ postType: "question" });
    expect(questions.items).toHaveLength(1);
    const search = await api.community.listPosts({ q: "long long" });
    expect(search.items).toHaveLength(1);
  });

  it("creates, edits, likes and deletes a post as its owner", async () => {
    const created = await api.community.createPost({
      title: "Bài viết kiểm thử",
      contentMd: "Nội dung **kiểm thử**",
      postType: "discussion",
      problemId: null,
      languageId: null,
      codeSnippet: null,
    });
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.author.username).toBeTruthy();

    const updated = await api.community.updatePost(created.id, {
      title: "Bài viết đã sửa",
      contentMd: created.contentMd,
    });
    expect(updated.title).toBe("Bài viết đã sửa");

    const liked = await api.community.likePost(created.id);
    expect(liked).toEqual({ liked: true, likeCount: 1 });
    const likedAgain = await api.community.likePost(created.id);
    expect(likedAgain.likeCount).toBe(1);
    const unliked = await api.community.unlikePost(created.id);
    expect(unliked).toEqual({ liked: false, likeCount: 0 });

    const response = await fetch(`${base}/api/v1/forum/posts/${created.id}`, {
      method: "DELETE",
      headers: { Authorization: AUTHOR },
    });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    const again = await fetch(`${base}/api/v1/forum/posts/${created.id}`, {
      method: "DELETE",
      headers: { Authorization: AUTHOR },
    });
    expect(again.status).toBe(204);
    const gone = await fetch(`${base}/api/v1/forum/posts/${created.id}`);
    expect(gone.status).toBe(404);
  });

  it("hides owner-only mutations from another account with 404", async () => {
    const response = await fetch(`${base}/api/v1/forum/posts/${MY_POST}`, {
      method: "PATCH",
      headers: { Authorization: OTHER, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Chiếm bài" }),
    });
    expect(response.status).toBe(404);
    const deleted = await fetch(`${base}/api/v1/forum/posts/${MY_POST}`, {
      method: "DELETE",
      headers: { Authorization: OTHER },
    });
    expect(deleted.status).toBe(404);
  });

  it("keeps a deleted root comment as a tombstone while preserving its reply", async () => {
    const comments = await api.community.listComments(SEED_POST, {
      page: 1,
      size: 20,
    });
    const tombstone = comments.items.find((item) => item.isDeleted);
    expect(tombstone).toBeTruthy();
    expect(tombstone?.content).toBeNull();
    expect(comments.items.some((item) => item.parentId === tombstone?.id)).toBe(
      true,
    );
  });

  it("creates a comment and reply, rejects a reply to a reply, then deletes the leaf", async () => {
    const root = await api.community.createComment(SEED_POST, {
      content: "Bình luận gốc",
      parentId: null,
    });
    const reply = await api.community.createComment(SEED_POST, {
      content: "Trả lời",
      parentId: root.id,
    });
    expect(reply.parentId).toBe(root.id);
    const invalid = await fetch(
      `${base}/api/v1/forum/posts/${SEED_POST}/comments`,
      {
        method: "POST",
        headers: { Authorization: AUTHOR, "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Sai cấp", parentId: reply.id }),
      },
    );
    expect(invalid.status).toBe(422);
    expect((await api.community.deleteComment(reply.id)) ?? "deleted").toBe(
      "deleted",
    );
    const deleteAgain = await fetch(
      `${base}/api/v1/forum/comments/${reply.id}`,
      { method: "DELETE", headers: { Authorization: AUTHOR } },
    );
    expect(deleteAgain.status).toBe(204);
    const after = await api.community.listComments(SEED_POST, {
      page: 1,
      size: 20,
    });
    expect(after.items.some((item) => item.id === reply.id)).toBe(false);
  });

  it("rejects unauthenticated writes, bad tokens and malformed filters", async () => {
    expect(
      (
        await fetch(`${base}/api/v1/forum/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "x",
            contentMd: "y",
            postType: "discussion",
          }),
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await fetch(`${base}/api/v1/forum/posts`, {
          headers: { Authorization: "Bearer invalid" },
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await fetch(`${base}/api/v1/forum/posts?size=101`, {
          headers: { Authorization: AUTHOR },
        })
      ).status,
    ).toBe(400);
  });
});
