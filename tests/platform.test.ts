import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ProblemSummaryModel } from "@/lib/api";
import { ProblemTable } from "@/features/platform/ProblemTable";

import { StorePage } from "@/features/platform/StorePage";
import { BrandLogo } from "@/lib/ui/BrandLogo";

const problem: ProblemSummaryModel = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "sum-two",
  title: "Sum <two>",
  packageId: "22222222-2222-4222-8222-222222222222",
  packageSlug: "arrays",
  levelId: "33333333-3333-4333-8333-333333333333",
  difficulty: "easy",
  tags: [],
  solved: false,
  unlocked: true,
  acceptanceRate: 50,
  canOpen: true,
  formattedAcceptanceRate: "50%",
};

describe("platform interface boundaries", () => {
  it("shares the same brand mark between full and compact logos", () => {
    const full = renderToStaticMarkup(createElement(BrandLogo));
    const compact = renderToStaticMarkup(
      createElement(BrandLogo, { compact: true }),
    );
    expect(full).toContain("data-brand-mark");
    expect(compact).toContain("data-brand-mark");
    expect(full).toContain("data-brand-wordmark");
    expect(compact).not.toContain("data-brand-wordmark");
    expect(full).not.toContain("<img");
    expect(compact).not.toContain("<img");
  });
  it("keeps locked problems out of navigable workspace links and renders server status", () => {
    const html = renderToStaticMarkup(
      createElement(ProblemTable, {
        problems: [
          problem,
          {
            ...problem,
            id: "44444444-4444-4444-8444-444444444444",
            slug: "locked",
            title: "Locked",
            unlocked: false,
            canOpen: false,
          },
          {
            ...problem,
            id: "55555555-5555-4555-8555-555555555555",
            slug: "solved",
            solved: true,
          },
        ],
      }),
    );
    expect(html).toContain('href="/problems/sum-two"');
    expect(html).not.toContain('href="/problems/locked"');
    expect(html).toContain('aria-label="Đã giải"');
    expect(html).toContain("Sum &lt;two&gt;");
    expect(html).toContain("50%");
  });
  it("labels pricing fixtures as demo without a payment form", () => {
    const store = renderToStaticMarkup(createElement(StorePage));

    expect(store).toContain("Không thu tiền");
    expect(store).toContain("Trải nghiệm đăng ký demo");
    expect(store).not.toContain('type="number"');
    expect(store).not.toContain('name="card"');
  });
});
