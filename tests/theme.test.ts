import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import { themeInitializationScript } from "@/lib/ui/theme";
function initialize(
  saved: string | null,
  systemDark: boolean,
  blocked = false,
) {
  const dataset: Record<string, string> = {};
  runInNewContext(themeInitializationScript, {
    localStorage: {
      getItem() {
        if (blocked) throw new Error("Storage denied");
        return saved;
      },
    },
    window: { matchMedia: () => ({ matches: systemDark }) },
    document: { documentElement: { dataset } },
  });
  return dataset;
}
describe("theme initialization before hydration", () => {
  it("respects an explicit light preference over a dark OS", () =>
    expect(initialize("light", true)).toEqual({
      theme: "light",
      themePreference: "light",
    }));
  it("respects an explicit dark preference over a light OS", () =>
    expect(initialize("dark", false)).toEqual({
      theme: "dark",
      themePreference: "dark",
    }));
  it.each([true, false])(
    "follows system without a saved preference (%s)",
    (dark) =>
      expect(initialize(null, dark)).toEqual({
        theme: dark ? "dark" : "light",
        themePreference: "system",
      }),
  );
  it("ignores invalid stored data", () =>
    expect(initialize("sepia", true).theme).toBe("dark"));
  it("does not fail if storage is blocked", () =>
    expect(initialize(null, true, true)).toEqual({
      theme: "dark",
      themePreference: "system",
    }));
});
