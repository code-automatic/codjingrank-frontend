import { describe, expect, it } from "vitest";
import { elapsedAt, formatClock } from "../features/editor/workspace-clock";

describe("workspace clock", () => {
  it("includes elapsed time after a background tab resumes", () => {
    expect(elapsedAt(12000, 1000, 61000)).toBe(72000);
  });

  it("keeps accumulated time unchanged while paused", () => {
    expect(elapsedAt(72000, null, 200000)).toBe(72000);
  });

  it("does not subtract time when the clock moves backwards", () => {
    expect(elapsedAt(12000, 5000, 4000)).toBe(12000);
  });

  it("formats hours and clamps a completed countdown", () => {
    expect(formatClock(3661999)).toBe("01:01:01");
    expect(formatClock(-100)).toBe("00:00:00");
  });
});
