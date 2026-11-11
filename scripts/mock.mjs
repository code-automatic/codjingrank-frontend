import { createSubmissionDemo } from "./submission-demo.mjs";
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

// Local demo only: the contract example exposes one language, which makes the
// Sprint 2 language switch impossible to try by hand. This opt-in override adds
// C++/Java and matching starters for the `sum-two` example. It never runs by
// default and is not a claim about the Gateway contract.
const DEMO_LANGUAGES = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "python3",
    name: "Python 3",
    runtimeVersion: "3.12",
    fileExtension: ".py",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "cpp",
    name: "C++",
    runtimeVersion: "17",
    fileExtension: ".cpp",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    slug: "java",
    name: "Java",
    runtimeVersion: "17",
    fileExtension: ".java",
  },
];

const DEMO_STARTERS = {
  [DEMO_LANGUAGES[0].id]: {
    starterCode: "a, b = map(int, input().split())\nprint(a + b)\n",
    fileName: "main.py",
  },
  [DEMO_LANGUAGES[1].id]: {
    starterCode:
      "#include <iostream>\n\nint main() {\n    long long a, b;\n    std::cin >> a >> b;\n    std::cout << a + b << '\\n';\n    return 0;\n}\n",
    fileName: "main.cpp",
  },
  [DEMO_LANGUAGES[2].id]: {
    starterCode:
      "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        long a = scanner.nextLong();\n        long b = scanner.nextLong();\n        System.out.println(a + b);\n    }\n}\n",
    fileName: "Main.java",
  },
};

function applyEditorDemo(payload, pathname, searchParams) {
  if (process.env.MOCK_EDITOR_DEMO !== "1") return payload;
  if (!payload || payload.status !== "success" || !payload.data) return payload;

  const languages = DEMO_LANGUAGES.map((language) => ({ ...language }));
  if (pathname === "/api/v1/problems/sum-two") {
    return { ...payload, data: { ...payload.data, languages } };
  }
  if (pathname === "/api/v1/problems/sum-two/languages") {
    return { ...payload, data: { items: languages } };
  }
  if (pathname === "/api/v1/problems/sum-two/template") {
    const requestedId = searchParams.get("languageId");
    const starter = DEMO_STARTERS[requestedId];
    if (!starter)
      return {
        status: "error",
        code: 422,
        message: "Language not supported",
        error: "LANGUAGE_NOT_SUPPORTED",
        details: null,
      };
    return {
      ...payload,
      data: {
        ...payload.data,
        languageId: requestedId ?? payload.data.languageId,
        starterCode: starter.starterCode,
        fileName: starter.fileName,
      },
    };
  }
  return payload;
}

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

const submissionDemo =
  process.env.MOCK_SUBMISSION_DEMO === "1"
    ? createSubmissionDemo(spec, {
        verdict: process.env.MOCK_SUBMISSION_VERDICT || "Accepted",
      })
    : null;

createServer(async (req, res) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.MOCK_ORIGIN || "http://localhost:3000",
  );
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

  const url = new URL(req.url || "/", "http://localhost");
  const pathname = url.pathname;
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

  if (submissionDemo && !req.headers.prefer) {
    try {
      const fixture = await submissionDemo(req, url);
      if (fixture) {
        res.writeHead(fixture.status, {
          "Content-Type": "application/json",
          ...fixture.headers,
        });
        res.end(JSON.stringify(fixture.body));
        return;
      }
    } catch {
      res.writeHead(500, { "Content-Type": "application/json" }).end(
        JSON.stringify({
          status: "error",
          code: 500,
          message: "Demo failure",
          error: "INTERNAL_ERROR",
          details: null,
        }),
      );
      return;
    }
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

  const payload = applyEditorDemo(example, pathname, url.searchParams);
  const extraHeaders =
    code === "429"
      ? { "Content-Type": "application/json", "Retry-After": "10" }
      : { "Content-Type": "application/json" };

  res.writeHead(
    payload?.status === "error" ? Number(payload.code) : Number(code),
    extraHeaders,
  );
  res.end(
    code === "204"
      ? undefined
      : JSON.stringify(
          payload !== undefined
            ? payload
            : {
                status: "error",
                code: Number(code),
                message: "Mock error",
                error: "HTTP_ERROR",
                details: null,
              },
        ),
  );
}).listen(Number(process.env.MOCK_PORT || 4010), "127.0.0.1", () =>
  console.log(
    `OpenAPI learner mock (42 endpoints; submission demo: ${process.env.MOCK_SUBMISSION_DEMO === "1" ? "memory only" : "off"}): http://localhost:${process.env.MOCK_PORT || 4010}`,
  ),
);
