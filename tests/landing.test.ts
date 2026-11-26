import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "../app/page";
import { SessionProvider } from "../features/auth/session";

describe("public landing page", () => {
  it("renders the home route before session bootstrap instead of redirecting to protected", () => {
    const html = renderToStaticMarkup(
      createElement(SessionProvider, null, createElement(Home)),
    );
    expect(html).toContain("Khơi mở tư duy");
    expect(html).toMatch(/workspace-current-[a-f0-9]{10}\.png/);
    expect(html).toMatch(/community-current-[a-f0-9]{10}\.png/);
    expect(html).toMatch(/roadmap-current-[a-f0-9]{10}\.png/);
    expect(html).not.toContain("Ảnh phong cảnh:");
    expect(html).not.toContain("Ảnh biển:");
    expect(html).not.toContain('src="/landing/workspace.png"');
    expect(html).not.toContain('src="/landing/community.png"');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('href="/register"');
    expect(html).toContain('href="/login"');
    expect(html).not.toContain('href="/protected"');
  });

  it("provides a visible default feature and labelled alternative panels without JavaScript", () => {
    const html = renderToStaticMarkup(
      createElement(SessionProvider, null, createElement(Home)),
    );
    expect(html).toContain('id="landing-tab-0"');
    expect(html).toContain('aria-controls="landing-panel-0"');
    expect(html).toContain('id="landing-panel-0"');
    expect(html.match(/role="tabpanel"/g)).toHaveLength(3);
    expect(html).toContain("dữ liệu demo");
    expect(html).not.toContain("demo_learner");
  });
});
