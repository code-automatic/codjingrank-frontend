import { randomUUID } from "node:crypto";

// Opt-in in-memory UI fixture. Never executes code, validates JWTs, or sets cookies.
export function createSubmissionDemo(
  spec,
  { verdict = "Accepted", now = Date.now } = {},
) {
  const example = (path, method = "get", code = "200", name) => {
    const content =
      spec.paths[path][method].responses[code].content["application/json"];
    return structuredClone(
      content.example ??
        content.examples[name ?? Object.keys(content.examples)[0]].value,
    );
  };
  const problem = example("/api/v1/problems/{slug}").data.problem;
  const user = example("/api/v1/auth/login", "post").data.user;
  const seed = example("/api/v1/submit", "post", "201", "pending").data
    .submission;
  const records = [];
  const calls = new Map();
  let lastSubmitted = -Infinity;
  const allowed = [
    "Accepted",
    "Wrong Answer",
    "Time Limit Exceeded",
    "Memory Limit Exceeded",
    "Compilation Error",
    "Runtime Error",
    "Internal Error",
  ];
  if (!allowed.includes(verdict))
    throw new Error("Unsupported MOCK_SUBMISSION_VERDICT");
  const response = (data, status = 200) => ({
    status,
    body: {
      status: "success",
      code: status,
      message: "Local submission demo",
      data,
    },
  });
  const error = (status, code) => ({
    status,
    body: {
      status: "error",
      code: status,
      message: "Local submission demo error",
      error: code,
      details: null,
    },
  });
  function refresh(row) {
    if (!row || (row.status !== "Pending" && row.status !== "Running"))
      return row;
    const count = (calls.get(row.id) ?? 0) + 1;
    calls.set(row.id, count);
    row.status = count >= 2 ? verdict : "Running";
    if (count >= 2)
      Object.assign(row, {
        totalTestcases: 5,
        passCount: verdict === "Accepted" ? 5 : 1,
        runtimeMs: 4,
        memoryKb: 1024,
        judgedAt: new Date(now()).toISOString(),
        errorMessage:
          verdict === "Compilation Error"
            ? "Demo: mã nguồn không biên dịch được."
            : null,
      });
    return row;
  }
  return async function handle(req, url) {
    const path = url.pathname;
    if (req.method === "POST" && path === "/api/v1/submit") {
      let raw = "",
        bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 1_000_000) return error(413, "REQUEST_TOO_LARGE");
        raw += chunk.toString();
      }
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        return error(400, "VALIDATION_ERROR");
      }
      if (
        typeof payload.code !== "string" ||
        !payload.code.trim() ||
        payload.problemId !== problem.id ||
        ![
          seed.languageId,
          ...(process.env.MOCK_EDITOR_DEMO === "1"
            ? [
                "22222222-2222-4222-8222-222222222222",
                "33333333-3333-4333-8333-333333333333",
              ]
            : []),
        ].includes(payload.languageId)
      )
        return error(422, "VALIDATION_ERROR");
      if (Buffer.byteLength(payload.code, "utf8") > 102400)
        return error(413, "REQUEST_TOO_LARGE");
      if (now() - lastSubmitted < 10000)
        return {
          ...error(429, "SUBMISSION_COOLDOWN"),
          headers: {
            "Retry-After": String(
              Math.ceil((10000 - (now() - lastSubmitted)) / 1000),
            ),
          },
        };
      lastSubmitted = now();
      const row = {
        ...seed,
        id: randomUUID(),
        userId: user.id,
        problemId: problem.id,
        languageId: payload.languageId,
        languageSlug:
          payload.languageId === "22222222-2222-4222-8222-222222222222"
            ? "cpp"
            : payload.languageId === "33333333-3333-4333-8333-333333333333"
              ? "java"
              : seed.languageSlug,
        problemSlug: problem.slug,
        problemTitle: problem.title,
        code: payload.code,
        createdAt: new Date(now()).toISOString(),
      };
      records.unshift(row);
      if (records.length > 100) {
        const removed = records.pop();
        calls.delete(removed.id);
      }
      return response({ submission: row }, 201);
    }
    if (req.method !== "GET") return null;
    const match = /^\/api\/v1\/submissions\/([^/]+)$/.exec(path);
    if (match) {
      const row = records.find((item) => item.id === match[1]);
      return row
        ? response({ submission: refresh(row) })
        : error(404, "SUBMISSION_NOT_FOUND");
    }
    if (path === `/api/v1/me/submissions/${problem.id}/latest`) {
      const rows = records.filter(
        (row) =>
          !url.searchParams.get("languageId") ||
          row.languageId === url.searchParams.get("languageId"),
      );
      return response({ submission: rows[0] ?? null });
    }
    if (path === "/api/v1/me/submissions") {
      const page = Math.max(1, Number(url.searchParams.get("page")) || 1),
        size = Math.max(
          1,
          Math.min(100, Number(url.searchParams.get("size")) || 20),
        );
      const filtered = records.filter((row) =>
        ["problemId", "languageId", "status"].every(
          (key) =>
            !url.searchParams.get(key) ||
            row[key] === url.searchParams.get(key),
        ),
      );
      return response({
        items: filtered.slice((page - 1) * size, page * size).map((item) => {
          const row = { ...item };
          delete row.code;
          return row;
        }),
        page,
        size,
        total: filtered.length,
      });
    }
    if (
      path === `/api/v1/packages/${problem.packageSlug}/levels` ||
      path === `/api/v1/packages/${problem.packageSlug}`
    ) {
      const result = example("/api/v1/packages/{slug}/levels");
      if (records.some((row) => row.status === "Accepted")) {
        result.data.levels[0] = {
          ...result.data.levels[0],
          solved: 1,
          completed: true,
        };
        result.data.levels[1] = { ...result.data.levels[1], unlocked: true };
      }
      return { status: 200, body: result };
    }
    return null;
  };
}
