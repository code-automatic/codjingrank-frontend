import { Readable } from "node:stream";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { createProfileDemo } from "../scripts/profile-demo.mjs";

const spec = parse(
  readFileSync(
    new URL("../contracts/openapi_fe.yaml", import.meta.url),
    "utf8",
  ),
);
const token =
  spec.paths["/api/v1/auth/login"].post.responses["200"].content[
    "application/json"
  ].example.data.accessToken;
const url = new URL("http://localhost/api/v1/users/me");
function request(method, body, authorized = true) {
  const req = Readable.from(body === undefined ? [] : [JSON.stringify(body)]);
  req.method = method;
  req.headers = authorized ? { authorization: `Bearer ${token}` } : {};
  return req;
}

describe("profile demo persistence", () => {
  it("saves an avatar and exposes the same user on read and later login", async () => {
    const demo = createProfileDemo(spec);
    const avatarUrl = "https://example.com/my-photo.jpg";
    const saved = await demo(request("PATCH", { avatarUrl }), url);
    expect(saved.status).toBe(200);
    expect(saved.body.data.user.avatarUrl).toBe(avatarUrl);
    expect((await demo(request("GET"), url)).body.data.user.avatarUrl).toBe(
      avatarUrl,
    );
    const login = await demo(
      request("POST", {}),
      new URL("http://localhost/api/v1/auth/login"),
    );
    expect(login.body.data.user.avatarUrl).toBe(avatarUrl);
    expect(login.body.data.user.username).toBe(saved.body.data.user.username);
  });
  it("clears an avatar with null without changing other fields", async () => {
    const demo = createProfileDemo(spec);
    await demo(
      request("PATCH", {
        avatarUrl: "https://example.com/a.png",
        fullName: "New Name",
      }),
      url,
    );
    const cleared = await demo(request("PATCH", { avatarUrl: null }), url);
    expect(cleared.body.data.user.avatarUrl).toBeNull();
    expect(cleared.body.data.user.fullName).toBe("New Name");
  });
  it.each([
    { avatarUrl: "javascript:alert(1)" },
    { avatarUrl: "data:image/png;base64,eA==" },
    { role: "admin" },
    { avatarUrl: 123 },
    { fullName: " " },
  ])("rejects invalid profile updates %j", async (body) => {
    const demo = createProfileDemo(spec);
    expect((await demo(request("PATCH", body), url)).status).toBe(400);
    expect(
      (await demo(request("GET"), url)).body.data.user.avatarUrl,
    ).toBeNull();
  });
  it("rejects unauthorized reads and writes", async () => {
    const demo = createProfileDemo(spec);
    expect((await demo(request("GET", undefined, false), url)).status).toBe(
      401,
    );
    expect(
      (await demo(request("PATCH", { avatarUrl: null }, false), url)).status,
    ).toBe(401);
  });
});
