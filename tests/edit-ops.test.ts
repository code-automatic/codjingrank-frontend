import { describe, expect, it } from "vitest";
import { indentSelection, INDENT } from "@/features/editor/edit-ops";

describe("indentSelection", () => {
  it("inserts four spaces at a collapsed caret", () => {
    expect(indentSelection("print(1)", 0, 0)).toEqual({
      code: `${INDENT}print(1)`,
      start: 4,
      end: 4,
    });
  });

  it("inserts at an interior caret without moving other text", () => {
    const result = indentSelection("ab", 1, 1);
    expect(result.code).toBe(`a${INDENT}b`);
    expect(result.start).toBe(5);
    expect(result.end).toBe(5);
  });

  it("indents every line touched by a multi-line selection", () => {
    const code = "a\nbc\nd";
    const result = indentSelection(code, 0, 4);
    expect(result.code).toBe(`    a\n    bc\nd`);
    expect(result.code.slice(result.start, result.end)).toBe(`a\n    bc`);
  });

  it("does not treat a selection ending exactly at a line start as a full line", () => {
    const code = "one\ntwo";
    const result = indentSelection(code, 0, 4);
    expect(result.code).toBe(`    one\ntwo`);
    expect(result.start).toBe(4);
    expect(result.end).toBe(8);
    expect(result.code.slice(result.start, result.end)).toBe("one\n");
  });

  it("clamps out-of-range selections", () => {
    expect(indentSelection("ab", 99, 99)).toEqual({
      code: `ab${INDENT}`,
      start: 6,
      end: 6,
    });
    expect(indentSelection("ab", -3, -1)).toEqual({
      code: `${INDENT}ab`,
      start: 4,
      end: 4,
    });
  });
});
