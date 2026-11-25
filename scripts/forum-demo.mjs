import { randomUUID } from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ok(status, message, data) {
  return { status, body: { status: "success", code: status, message, data } };
}

function failure(status, error, message = "Demo request rejected") {
  return {
    status,
    body: {
      status: "error",
      code: status,
      message,
      error,
      details: null,
    },
  };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 200_000) reject(new Error("too large"));
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

function isText(value, max) {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= max
  );
}

export function createForumDemo(spec, now = () => new Date()) {
  const login =
    spec.paths["/api/v1/auth/login"].post.responses["200"].content[
      "application/json"
    ].example.data;
  const me = {
    id: login.user.id,
    username: login.user.username,
    fullName: login.user.fullName,
    avatarUrl: login.user.avatarUrl,
  };
  const mentor = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    username: "mock_mentor",
    fullName: "Mentor Mock",
    avatarUrl: null,
  };
  const createdAt = new Date(now());
  createdAt.setUTCDate(createdAt.getUTCDate() - 3);
  const later = new Date(createdAt);
  later.setUTCHours(later.getUTCHours() + 5);

  const posts = [
    {
      id: "f1000000-0000-4000-8000-000000000001",
      author: mentor,
      problemId: null,
      languageId: null,
      postType: "discussion",
      status: "published",
      title: "Cách chia nhỏ bài toán trước khi viết code?",
      contentMd:
        "Mình thường **đọc kỹ đề**, viết tay vài ví dụ rồi mới code.\n\nMọi người có mẹo nào để không bỏ sót điều kiện biên không?",
      codeSnippet: null,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      viewCount: 42,
      likes: new Set([mentor.id]),
    },
    {
      id: "f1000000-0000-4000-8000-000000000002",
      author: me,
      problemId: "11111111-1111-4111-8111-111111111111",
      languageId: "11111111-1111-4111-8111-111111111111",
      postType: "question",
      status: "published",
      title: "Bài sum-two bị Wrong Answer ở test ẩn",
      contentMd:
        "Code của mình qua hết sample nhưng sai ở test ẩn. Có nên dùng `long long` cho tổng hai số không?",
      codeSnippet: "a, b = map(int, input().split())\nprint(a + b)\n",
      createdAt: later.toISOString(),
      updatedAt: later.toISOString(),
      viewCount: 18,
      likes: new Set(),
    },
    {
      id: "f1000000-0000-4000-8000-000000000003",
      author: mentor,
      problemId: "11111111-1111-4111-8111-111111111111",
      languageId: "11111111-1111-4111-8111-111111111111",
      postType: "solution",
      status: "published",
      title: "Lời giải Python cho sum-two",
      contentMd:
        "Đọc hai số và in tổng. Lưu ý giới hạn của input để chọn kiểu dữ liệu phù hợp.",
      codeSnippet: "a, b = map(int, input().split())\nprint(a + b)\n",
      createdAt: new Date(later.getTime() + 60_000).toISOString(),
      updatedAt: new Date(later.getTime() + 60_000).toISOString(),
      viewCount: 7,
      likes: new Set([me.id]),
    },
    {
      id: "f1000000-0000-4000-8000-000000000004",
      author: mentor,
      problemId: null,
      languageId: null,
      postType: "discussion",
      status: "deleted",
      title: "Bài viết đã bị ẩn",
      contentMd: "Không được trả về cho learner.",
      codeSnippet: null,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      viewCount: 0,
      likes: new Set(),
    },
  ];

  const comments = [
    {
      id: "c1000000-0000-4000-8000-000000000001",
      postId: posts[0].id,
      parentId: null,
      author: me,
      content: "Mình thường viết test biên trước khi code.",
      isDeleted: false,
      createdAt: new Date(createdAt.getTime() + 60_000).toISOString(),
      updatedAt: new Date(createdAt.getTime() + 60_000).toISOString(),
    },
    {
      id: "c1000000-0000-4000-8000-000000000002",
      postId: posts[0].id,
      parentId: "c1000000-0000-4000-8000-000000000001",
      author: mentor,
      content: "Đồng ý, nhất là với input rỗng hoặc số âm.",
      isDeleted: false,
      createdAt: new Date(createdAt.getTime() + 120_000).toISOString(),
      updatedAt: new Date(createdAt.getTime() + 120_000).toISOString(),
    },
    {
      id: "c1000000-0000-4000-8000-000000000003",
      postId: posts[0].id,
      parentId: null,
      author: mentor,
      content: "Bình luận này đã bị xóa nhưng còn trả lời.",
      isDeleted: true,
      createdAt: new Date(createdAt.getTime() + 180_000).toISOString(),
      updatedAt: new Date(createdAt.getTime() + 180_000).toISOString(),
    },
    {
      id: "c1000000-0000-4000-8000-000000000004",
      postId: posts[0].id,
      parentId: "c1000000-0000-4000-8000-000000000003",
      author: me,
      content: "Mình vẫn thấy câu trả lời này hữu ích.",
      isDeleted: false,
      createdAt: new Date(createdAt.getTime() + 240_000).toISOString(),
      updatedAt: new Date(createdAt.getTime() + 240_000).toISOString(),
    },
  ];

  function principal(req) {
    const auth = req.headers.authorization;
    if (!auth) return null;
    if (auth === "Bearer mock-access-token") return me;
    if (auth === "Bearer mock-other-token") return mentor;
    return undefined;
  }

  function visibleComment(comment) {
    if (!comment.isDeleted) return true;
    return comments.some(
      (child) => child.parentId === comment.id && !child.isDeleted,
    );
  }

  function commentView(comment) {
    return {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      author: comment.author,
      content: comment.isDeleted ? null : comment.content,
      isDeleted: comment.isDeleted,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  function summary(post, user) {
    const items = comments.filter(
      (comment) => comment.postId === post.id && visibleComment(comment),
    );
    return {
      id: post.id,
      author: post.author,
      problemId: post.problemId,
      languageId: post.languageId,
      postType: post.postType,
      status: "published",
      title: post.title,
      excerpt: post.contentMd.slice(0, 1000),
      likeCount: post.likes.size,
      viewCount: post.viewCount,
      commentCount: items.length,
      likedByMe: user ? post.likes.has(user.id) : false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  function full(post, user) {
    return {
      ...summary(post, user),
      contentMd: post.contentMd,
      codeSnippet: post.codeSnippet,
    };
  }

  function findPost(id) {
    return posts.find((post) => post.id === id && post.status === "published");
  }

  function parseList(url) {
    const page = Number(url.searchParams.get("page") ?? 1);
    const size = Number(url.searchParams.get("size") ?? 20);
    const sort = url.searchParams.get("sort") ?? "newest";
    const postType = url.searchParams.get("postType") ?? "";
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const problemId = url.searchParams.get("problemId");
    const languageId = url.searchParams.get("languageId");
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(size) ||
      size < 1 ||
      size > 100 ||
      !["newest", "likes", "views"].includes(sort) ||
      (postType &&
        !["discussion", "question", "solution"].includes(postType)) ||
      (problemId && !UUID.test(problemId)) ||
      (languageId && !UUID.test(languageId))
    )
      return null;
    return { page, size, sort, postType, q, problemId, languageId };
  }

  return async (req, url) => {
    if (!url.pathname.startsWith("/api/v1/forum/")) return null;

    const method = req.method ?? "GET";
    const user = principal(req);
    if (user === undefined) return failure(401, "UNAUTHORIZED");

    const postMatch = url.pathname.match(
      /^\/api\/v1\/forum\/posts\/([^/]+)(?:\/(comments|like))?$/,
    );
    const commentMatch = url.pathname.match(
      /^\/api\/v1\/forum\/comments\/([^/]+)$/,
    );

    if (url.pathname === "/api/v1/forum/posts") {
      if (method === "GET") {
        const query = parseList(url);
        if (!query) return failure(400, "VALIDATION_ERROR");
        let list = posts.filter((post) => post.status === "published");
        if (query.postType)
          list = list.filter((post) => post.postType === query.postType);
        if (query.problemId)
          list = list.filter((post) => post.problemId === query.problemId);
        if (query.languageId)
          list = list.filter((post) => post.languageId === query.languageId);
        if (query.q)
          list = list.filter(
            (post) =>
              post.title.toLowerCase().includes(query.q) ||
              post.contentMd.toLowerCase().includes(query.q),
          );
        list = [...list].sort((a, b) => {
          if (query.sort === "likes")
            return (
              b.likes.size - a.likes.size ||
              b.createdAt.localeCompare(a.createdAt)
            );
          if (query.sort === "views")
            return (
              b.viewCount - a.viewCount ||
              b.createdAt.localeCompare(a.createdAt)
            );
          return (
            b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
          );
        });
        return ok(200, "Posts retrieved", {
          items: list
            .slice((query.page - 1) * query.size, query.page * query.size)
            .map((post) => summary(post, user)),
          page: query.page,
          size: query.size,
          total: list.length,
        });
      }
      if (method === "POST") {
        if (!user) return failure(401, "UNAUTHORIZED");
        let body;
        try {
          body = await readJson(req);
        } catch {
          return failure(400, "BAD_REQUEST");
        }
        if (
          !isText(body.title, 200) ||
          !isText(body.contentMd, 20_000) ||
          !["discussion", "question", "solution"].includes(body.postType) ||
          (body.postType === "solution" && !body.problemId) ||
          (body.problemId && !UUID.test(body.problemId)) ||
          (body.languageId && !UUID.test(body.languageId))
        )
          return failure(400, "VALIDATION_ERROR");
        const timestamp = now().toISOString();
        const post = {
          id: randomUUID(),
          author: user,
          problemId: body.problemId ?? null,
          languageId: body.languageId ?? null,
          postType: body.postType,
          status: "published",
          title: body.title.trim(),
          contentMd: body.contentMd,
          codeSnippet: body.codeSnippet ?? null,
          createdAt: timestamp,
          updatedAt: timestamp,
          viewCount: 0,
          likes: new Set(),
        };
        posts.unshift(post);
        return ok(201, "Post created", { post: full(post, user) });
      }
      return failure(405, "METHOD_NOT_ALLOWED");
    }

    if (postMatch) {
      const [, id, sub] = postMatch;
      if (!UUID.test(id)) return failure(400, "VALIDATION_ERROR");
      const post = findPost(id);

      if (sub === "like") {
        if (!user) return failure(401, "UNAUTHORIZED");
        if (!post) return failure(404, "NOT_FOUND");
        if (method === "PUT") post.likes.add(user.id);
        else if (method === "DELETE") post.likes.delete(user.id);
        else return failure(405, "METHOD_NOT_ALLOWED");
        return ok(200, method === "PUT" ? "Post liked" : "Post unliked", {
          liked: post.likes.has(user.id),
          likeCount: post.likes.size,
        });
      }

      if (sub === "comments") {
        if (method === "GET") {
          if (!post) return failure(404, "NOT_FOUND");
          const page = Number(url.searchParams.get("page") ?? 1);
          const size = Number(url.searchParams.get("size") ?? 20);
          if (
            !Number.isSafeInteger(page) ||
            page < 1 ||
            !Number.isSafeInteger(size) ||
            size < 1 ||
            size > 100
          )
            return failure(400, "VALIDATION_ERROR");
          const list = comments
            .filter(
              (comment) =>
                comment.postId === post.id && visibleComment(comment),
            )
            .sort(
              (a, b) =>
                a.createdAt.localeCompare(b.createdAt) ||
                a.id.localeCompare(b.id),
            );
          return ok(200, "Comments retrieved", {
            items: list
              .slice((page - 1) * size, page * size)
              .map((comment) => commentView(comment, user)),
            page,
            size,
            total: list.length,
          });
        }
        if (method === "POST") {
          if (!user) return failure(401, "UNAUTHORIZED");
          if (!post) return failure(404, "NOT_FOUND");
          let body;
          try {
            body = await readJson(req);
          } catch {
            return failure(400, "BAD_REQUEST");
          }
          if (!isText(body.content, 5000))
            return failure(400, "VALIDATION_ERROR");
          if (body.parentId) {
            if (!UUID.test(body.parentId))
              return failure(400, "VALIDATION_ERROR");
            const parent = comments.find(
              (comment) =>
                comment.id === body.parentId &&
                comment.postId === post.id &&
                !comment.isDeleted,
            );
            if (!parent || parent.parentId !== null)
              return failure(422, "INVALID_COMMENT_PARENT");
          }
          const timestamp = now().toISOString();
          const comment = {
            id: randomUUID(),
            postId: post.id,
            parentId: body.parentId ?? null,
            author: user,
            content: body.content,
            isDeleted: false,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          comments.push(comment);
          return ok(201, "Comment created", {
            comment: commentView(comment, user),
          });
        }
        return failure(405, "METHOD_NOT_ALLOWED");
      }

      if (method === "DELETE") {
        if (!user) return failure(401, "UNAUTHORIZED");
        const target = posts.find((item) => item.id === id);
        if (!target || target.author.id !== user.id)
          return failure(404, "NOT_FOUND");
        target.status = "deleted";
        return { status: 204, body: undefined };
      }

      if (!post) return failure(404, "NOT_FOUND");
      if (method === "GET") {
        post.viewCount++;
        return ok(200, "Post retrieved", { post: full(post, user) });
      }
      if (!user) return failure(401, "UNAUTHORIZED");
      if (post.author.id !== user.id) return failure(404, "NOT_FOUND");
      if (method === "PATCH") {
        let body;
        try {
          body = await readJson(req);
        } catch {
          return failure(400, "BAD_REQUEST");
        }
        const nextType = body.postType ?? post.postType;
        const nextProblem =
          body.problemId !== undefined ? body.problemId : post.problemId;
        if (
          (body.title !== undefined && !isText(body.title, 200)) ||
          (body.contentMd !== undefined && !isText(body.contentMd, 20_000)) ||
          (body.postType !== undefined &&
            !["discussion", "question", "solution"].includes(body.postType)) ||
          (body.problemId && !UUID.test(body.problemId)) ||
          (body.languageId && !UUID.test(body.languageId)) ||
          (nextType === "solution" && !nextProblem)
        )
          return failure(400, "VALIDATION_ERROR");
        if (body.title !== undefined) post.title = body.title.trim();
        if (body.contentMd !== undefined) post.contentMd = body.contentMd;
        if (body.postType !== undefined) post.postType = body.postType;
        if (body.problemId !== undefined) post.problemId = body.problemId;
        if (body.languageId !== undefined) post.languageId = body.languageId;
        if (body.codeSnippet !== undefined) post.codeSnippet = body.codeSnippet;
        post.updatedAt = now().toISOString();
        return ok(200, "Post updated", { post: full(post, user) });
      }
      return failure(405, "METHOD_NOT_ALLOWED");
    }

    if (commentMatch) {
      if (!UUID.test(commentMatch[1])) return failure(400, "VALIDATION_ERROR");
      const comment = comments.find((item) => item.id === commentMatch[1]);
      if (!comment) return failure(404, "NOT_FOUND");
      const post = findPost(comment.postId);
      if (!post) return failure(404, "NOT_FOUND");
      if (!user) return failure(401, "UNAUTHORIZED");
      if (comment.author.id !== user.id) return failure(404, "NOT_FOUND");
      if (method === "DELETE") {
        comment.isDeleted = true;
        comment.updatedAt = now().toISOString();
        return { status: 204, body: undefined };
      }
      if (comment.isDeleted) return failure(404, "NOT_FOUND");
      if (method === "PATCH") {
        let body;
        try {
          body = await readJson(req);
        } catch {
          return failure(400, "BAD_REQUEST");
        }
        if (!isText(body.content, 5000))
          return failure(400, "VALIDATION_ERROR");
        comment.content = body.content;
        comment.updatedAt = now().toISOString();
        return ok(200, "Comment updated", {
          comment: commentView(comment, user),
        });
      }
      return failure(405, "METHOD_NOT_ALLOWED");
    }

    return failure(404, "NOT_FOUND");
  };
}
