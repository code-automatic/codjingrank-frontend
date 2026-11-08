import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

// Stateless OpenAPI examples only. No cookie/JWT/session simulation.
const spec = parse(
  readFileSync(
    new URL("../contracts/openapi_fe.yaml", import.meta.url),
    "utf8",
  ),
);
const allowed = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
  "/api/v1/users/me",
]);
createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Prefer",
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }
  const path = new URL(req.url, "http://localhost").pathname;
  const operation =
    allowed.has(path) && spec.paths[path]?.[req.method.toLowerCase()];
  if (!operation) {
    res
      .writeHead(404, { "Content-Type": "application/json" })
      .end(
        JSON.stringify({
          status: "error",
          code: 404,
          message: "Not found",
          error: "NOT_FOUND",
          details: null,
        }),
      );
    return;
  }
  const preferred = /code=(\d+)/.exec(req.headers.prefer || "")?.[1];
  const code =
    preferred ||
    (path.endsWith("/refresh")
      ? process.env.MOCK_REFRESH_STATUS || "401"
      : Object.keys(operation.responses).find((c) => c.startsWith("2")));
  if (!operation.responses[code]) {
    res.writeHead(400).end();
    return;
  }
  let response = operation.responses[code];
  if (response.$ref)
    response = spec.components.responses[response.$ref.split("/").pop()];
  const content = response.content?.["application/json"];
  const example =
    content?.example || Object.values(content?.examples || {})[0]?.value;
  res.writeHead(Number(code), { "Content-Type": "application/json" });
  res.end(
    code === "204"
      ? undefined
      : JSON.stringify(
          example || {
            status: "error",
            code: Number(code),
            message: "Mock error",
            error: "HTTP_ERROR",
            details: null,
          },
        ),
  );
}).listen(4010, "127.0.0.1", () =>
  console.log("Stateless OpenAPI auth mock: http://localhost:4010"),
);
