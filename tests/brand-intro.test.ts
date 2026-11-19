import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import {
  brandIntroInitializationScript,
  BRAND_INTRO_SESSION_KEY,
} from "@/lib/ui/brand-intro-init";

function visit(storage: Map<string, string>, reduced = false, blocked = false) {
  const dataset: Record<string, string> = {};
  let finish: (() => void) | undefined;
  runInNewContext(brandIntroInitializationScript, {
    sessionStorage: {
      getItem: (key: string) => {
        if (blocked) throw Error("Storage denied");
        return storage.get(key);
      },
      setItem: (key: string, value: string) => storage.set(key, value),
    },
    window: {
      matchMedia: () => ({ matches: reduced }),
      setTimeout: (callback: () => void) => {
        finish = callback;
      },
    },
    document: { documentElement: { dataset } },
  });
  return { dataset, finish };
}

describe("brand intro session lifecycle", () => {
  it("runs once per tab session and clears without hydration", () => {
    const storage = new Map<string, string>();
    const first = visit(storage);
    expect(first.dataset.brandIntro).toBe("active");
    expect(storage.get(BRAND_INTRO_SESSION_KEY)).toBe("seen");
    first.finish?.();
    expect(first.dataset.brandIntro).toBeUndefined();
    expect(visit(storage).dataset.brandIntro).toBeUndefined();
    expect(visit(new Map()).dataset.brandIntro).toBe("active");
  });
  it("skips motion and records the reduced-motion visit", () => {
    const storage = new Map<string, string>();
    expect(visit(storage, true).finish).toBeUndefined();
    expect(visit(storage).dataset.brandIntro).toBeUndefined();
  });
  it("leaves the page available when session storage is blocked", () => {
    expect(visit(new Map(), false, true).dataset.brandIntro).toBeUndefined();
  });
});
