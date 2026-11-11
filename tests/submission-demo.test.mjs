import { Readable } from "node:stream";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { createSubmissionDemo } from "../scripts/submission-demo.mjs";
import {
  adaptSubmissionData,
  adaptMySubmissionsPage,
} from "../lib/api/adapters/judge";
import { adaptPackageDetail } from "../lib/api/adapters/catalog";
const spec = parse(
  readFileSync(
    new URL("../contracts/openapi_fe.yaml", import.meta.url),
    "utf8",
  ),
);
const payload =
  spec.paths["/api/v1/submit"].post.requestBody.content["application/json"]
    .example;
const problem =
  spec.paths["/api/v1/problems/{slug}"].get.responses["200"].content[
    "application/json"
  ].example.data.problem;
const call = (handler, path, body) => {
  const req = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []);
  req.method = body ? "POST" : "GET";
  return handler(req, new URL(path, "http://localhost"));
};
describe("opt-in submission demo", () => {
  it("returns contract-valid owner data, pending/running/accepted, history without code and server unlock fixture", async () => {
    const demo = createSubmissionDemo(spec);
    const before = await call(
      demo,
      `/api/v1/packages/${problem.packageSlug}/levels`,
    );
    expect(adaptPackageDetail(before.body.data).levels[1].unlocked).toBe(false);
    const created = await call(demo, "/api/v1/submit", {
      ...payload,
      problemId: problem.id,
    });
    expect(created.status).toBe(201);
    const row = adaptSubmissionData(created.body.data);
    expect(row.problemId).toBe(problem.id);
    expect(row.isPending).toBe(true);
    const running = await call(demo, `/api/v1/submissions/${row.id}`);
    expect(adaptSubmissionData(running.body.data).status).toBe("Running");
    const done = await call(demo, `/api/v1/submissions/${row.id}`);
    expect(adaptSubmissionData(done.body.data).isAccepted).toBe(true);
    const history = await call(
      demo,
      `/api/v1/me/submissions?problemId=${problem.id}&page=1&size=10`,
    );
    expect(adaptMySubmissionsPage(history.body.data).total).toBe(1);
    expect(history.body.data.items[0]).not.toHaveProperty("code");
    const progress = await call(
      demo,
      `/api/v1/packages/${problem.packageSlug}/levels`,
    );
    expect(adaptPackageDetail(progress.body.data).levels[1].unlocked).toBe(
      true,
    );
  });
  it("honors cooldown and alternative verdicts without unlocking", async () => {
    let now = Date.now();
    const demo = createSubmissionDemo(spec, {
      verdict: "Wrong Answer",
      now: () => now,
    });
    const body = { ...payload, problemId: problem.id };
    const created = await call(demo, "/api/v1/submit", body);
    expect((await call(demo, "/api/v1/submit", body)).status).toBe(429);
    now += 10000;
    expect((await call(demo, "/api/v1/submit", body)).status).toBe(201);
    const id = created.body.data.submission.id;
    await call(demo, `/api/v1/submissions/${id}`);
    expect(
      (await call(demo, `/api/v1/submissions/${id}`)).body.data.submission
        .status,
    ).toBe("Wrong Answer");
    expect(
      (await call(demo, `/api/v1/packages/${problem.packageSlug}/levels`)).body
        .data.levels[1].unlocked,
    ).toBe(false);
  });
  it("preserves distinct C++ and Java demo languages for Submit after changing editor language", async () => {
    const old = process.env.MOCK_EDITOR_DEMO;
    process.env.MOCK_EDITOR_DEMO = "1";
    try {
      let now = Date.now();
      const demo = createSubmissionDemo(spec, { now: () => now });
      const ids = [
        "22222222-2222-4222-8222-222222222222",
        "33333333-3333-4333-8333-333333333333",
      ];
      for (const [index, languageId] of ids.entries()) {
        const created = await call(demo, "/api/v1/submit", {
          ...payload,
          problemId: problem.id,
          languageId,
        });
        expect(created.status).toBe(201);
        const row = adaptSubmissionData(created.body.data);
        expect(row.languageId).toBe(languageId);
        expect(row.languageSlug).toBe(index === 0 ? "cpp" : "java");
        now += 10000;
      }
    } finally {
      if (old === undefined) delete process.env.MOCK_EDITOR_DEMO;
      else process.env.MOCK_EDITOR_DEMO = old;
    }
  });
  it("starts without persistence and does not intercept unrelated operations", async () => {
    const demo = createSubmissionDemo(spec);
    expect(
      (await call(demo, `/api/v1/me/submissions/${problem.id}/latest`)).body
        .data.submission,
    ).toBeNull();
    expect(await call(demo, "/api/v1/run")).toBeNull();
    expect((await call(demo, "/api/v1/submissions/missing")).status).toBe(404);
  });
});
