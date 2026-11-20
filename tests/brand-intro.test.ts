import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import { brandIntroInitializationScript } from "@/lib/ui/brand-intro-init";

function visit(reduced = false, complete = false) {
  const dataset: Record<string, string> = {};
  const timers = new Map<number, { callback: () => void; delay: number }>();
  const events = new Map<string, () => void>();
  let id = 0;
  runInNewContext(brandIntroInitializationScript, {
    window: {
      matchMedia: () => ({ matches: reduced }),
      addEventListener: (name: string, callback: () => void) =>
        events.set(name, callback),
      removeEventListener: (name: string) => events.delete(name),
      clearTimeout: (key: number) => timers.delete(key),
      setTimeout: (callback: () => void, delay: number) => {
        timers.set(++id, { callback, delay });
        return id;
      },
    },
    document: {
      documentElement: { dataset },
      readyState: complete ? "complete" : "loading",
    },
  });
  return { dataset, timers, load: () => events.get("load")?.() };
}

describe("brand intro after document loading", () => {
  it("waits through a slow load before starting its full animation budget", () => {
    const page = visit();
    expect(page.dataset.brandIntro).toBe("pending");
    expect([...page.timers.values()].map((t) => t.delay)).toEqual([30000]);
    page.load();
    expect(page.dataset.brandIntro).toBe("active");
    expect([...page.timers.values()].map((t) => t.delay)).toEqual([2200]);
    [...page.timers.values()][0].callback();
    expect(page.dataset.brandIntro).toBeUndefined();
  });
  it("runs on each full document visit without requiring session storage or a query", () => {
    expect(visit(false, true).dataset.brandIntro).toBe("active");
    expect(visit(false, true).dataset.brandIntro).toBe("active");
  });
  it("does not restart on duplicate load events", () => {
    const page = visit();
    page.load();
    const timer = [...page.timers.keys()][0];
    page.load();
    expect([...page.timers.keys()]).toEqual([timer]);
  });
  it("fails open if a resource never finishes loading", () => {
    const page = visit();
    [...page.timers.values()][0].callback();
    expect(page.dataset.brandIntro).toBeUndefined();
    page.load();
    expect(page.dataset.brandIntro).toBeUndefined();
  });
  it("skips the overlay for reduced motion", () => {
    const page = visit(true);
    expect(page.dataset.brandIntro).toBeUndefined();
    expect(page.timers.size).toBe(0);
  });
});
