import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

// Stateless OpenAPI examples across all 42 learner operations.
// Auth refresh defaults to 401 so login forms still open cleanly.
const spec = parse(
  readFileSync(
    new URL("../contracts/openapi_fe.yaml", import.meta.url),
    "utf8",
  ),
);

const AUTH_ONLY_PATHS = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
  "/api/v1/users/me",
]);

function resolveOperation(pathname, method) {
  const lowerMethod = method.toLowerCase();
  if (process.env.MOCK_AUTH_ONLY === "1" && !AUTH_ONLY_PATHS.has(pathname)) {
    return null;
  }

  const exact = spec.paths[pathname]?.[lowerMethod];
  if (exact) return exact;

  const incomingSegments = pathname.split("/");
  const candidates = [];

  for (const [template, pathItem] of Object.entries(spec.paths)) {
    const op = pathItem?.[lowerMethod];
    if (!op) continue;
    const templateSegments = template.split("/");
    if (templateSegments.length !== incomingSegments.length) continue;

    let staticMatches = 0;
    let matched = true;
    for (let i = 0; i < templateSegments.length; i++) {
      const tplSeg = templateSegments[i];
      const reqSeg = incomingSegments[i];
      if (tplSeg.startsWith("{") && tplSeg.endsWith("}")) {
        if (!reqSeg) {
          matched = false;
          break;
        }
      } else if (tplSeg === reqSeg) {
        staticMatches++;
      } else {
        matched = false;
        break;
      }
    }
    if (matched) candidates.push({ op, staticMatches });
  }

  candidates.sort((a, b) => b.staticMatches - a.staticMatches);
  return candidates[0]?.op ?? null;
}

createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Prefer",
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Expose-Headers", "Retry-After");
  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  const pathname = new URL(req.url || "/", "http://localhost").pathname;
  const operation = resolveOperation(pathname, req.method || "GET");

  if (!operation) {
    res.writeHead(404, { "Content-Type": "application/json" }).end(
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

  const preferHeader = String(req.headers.prefer || "");
  const preferredCode = /code=(\d+)/.exec(preferHeader)?.[1];
  const preferredExample = /example=([A-Za-z0-9_-]+)/.exec(preferHeader)?.[1];
  const code =
    preferredCode ||
    (pathname.endsWith("/refresh")
      ? process.env.MOCK_REFRESH_STATUS || "401"
      : Object.keys(operation.responses).find((c) => c.startsWith("2")));

  if (!operation.responses[code]) {
    res.writeHead(400).end();
    return;
  }

  let response = operation.responses[code];
  if (response.$ref) {
    response = spec.components.responses[response.$ref.split("/").pop()];
  }

  const content = response.content?.["application/json"];
  const namedExample = preferredExample
    ? content?.examples?.[preferredExample]?.value
    : undefined;
  let example =
    namedExample !== undefined
      ? namedExample
      : (content?.example ?? Object.values(content?.examples || {})[0]?.value);

  // The source examples use different problem UUIDs for detail and template.
  // Keep their fixture references coherent; this remains a stateless example.
  if (
    operation.operationId === "getTemplate" &&
    code === "200" &&
    example?.data
  ) {
    const detail =
      spec.paths["/api/v1/problems/{slug}"].get.responses["200"].content[
        "application/json"
      ].example.data;
    example = {
      ...example,
      data: { ...example.data, problemId: detail.problem.id },
    };
  }

  const extraHeaders =
    code === "429"
      ? { "Content-Type": "application/json", "Retry-After": "10" }
      : { "Content-Type": "application/json" };

  res.writeHead(Number(code), extraHeaders);
  res.end(
    code === "204"
      ? undefined
      : JSON.stringify(
          example !== undefined
            ? example
            : {
                status: "error",
                code: Number(code),
                message: "Mock error",
                error: "HTTP_ERROR",
                details: null,
              },
        ),
  );
}).listen(4010, "127.0.0.1", () =>
  console.log(
    "Stateless OpenAPI learner mock (42 endpoints): http://localhost:4010",
  ),
);
