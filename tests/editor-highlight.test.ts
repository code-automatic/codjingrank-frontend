import { describe, expect, it } from "vitest";
import {
  highlightCode,
  MAX_HIGHLIGHT_CHARS,
  resolveEditorLanguage,
  tokenizeLines,
  type EditorLanguage,
  type HighlightToken,
} from "@/features/editor/highlight";

function join(tokens: HighlightToken[]): string {
  return tokens.map((token) => token.text).join("");
}

function kinds(tokens: HighlightToken[], text: string): string[] {
  return tokens
    .filter((token) => token.text === text)
    .map((token) => token.kind);
}

describe("resolveEditorLanguage", () => {
  it.each<[string, EditorLanguage]>([
    ["python3", "python"],
    ["python", "python"],
    ["py", "python"],
    ["cpp", "cpp"],
    ["c++", "cpp"],
    ["g++", "cpp"],
    ["java", "java"],
    ["javascript", "javascript"],
    ["node", "javascript"],
    ["rust", "plain"],
    ["", "plain"],
  ])("maps %s to %s", (slug, expected) => {
    expect(resolveEditorLanguage(slug)).toBe(expected);
  });
});

describe("highlightCode", () => {
  it("keeps every source byte when tokenizing", () => {
    const code = `def solve(a, b):\n    # sum\n    return a + b  # done\n`;
    const tokens = highlightCode(code, "python");
    expect(join(tokens)).toBe(code);
  });

  it("classifies Python comments, strings, keywords, functions and numbers", () => {
    const tokens = highlightCode(
      `def solve(x):\n    # note\n    return "a#b" + str(42)`,
      "python",
    );

    expect(kinds(tokens, "def")).toEqual(["keyword"]);
    expect(kinds(tokens, "solve")).toEqual(["function"]);
    expect(kinds(tokens, "# note")).toEqual(["comment"]);
    expect(kinds(tokens, '"a#b"')).toEqual(["string"]);
    expect(kinds(tokens, "42")).toEqual(["number"]);
    expect(kinds(tokens, "str")).toEqual(["type"]);
    // The hash inside the string is not a comment.
    expect(tokens.some((token) => token.text === "#b\"")).toBe(false);
  });

  it("handles C++ block comments spanning lines", () => {
    const code = `int main() {\n/* note\n   more */\n  return 0;\n}`;
    const lines = tokenizeLines(code, "cpp");

    expect(lines).toHaveLength(5);
    expect(lines[1].every((token) => token.kind === "comment")).toBe(true);
    expect(lines[2][0]).toEqual({ text: "   more */", kind: "comment" });
    expect(lines[3].map((token) => token.text).join("")).toBe("  return 0;");
    expect(
      lines.map((line) => line.map((token) => token.text).join("")).join("\n"),
    ).toBe(code);
  });

  it("classifies Java types and keywords", () => {
    const tokens = highlightCode(
      `public class Main {\n  public static void main(String[] args) {\n    System.out.println(1);\n  }\n}`,
      "java",
    );

    expect(kinds(tokens, "public")).toEqual(["keyword", "keyword"]);
    expect(kinds(tokens, "class")).toEqual(["keyword"]);
    expect(kinds(tokens, "String")).toEqual(["type"]);
    expect(kinds(tokens, "System")).toEqual(["type"]);
    expect(kinds(tokens, "println")).toEqual(["builtin"]);
  });

  it("handles unterminated strings and block comments without losing text", () => {
    const block = highlightCode("/* never closed", "cpp");
    expect(block).toEqual([{ text: "/* never closed", kind: "comment" }]);

    const quote = highlightCode('const char *s = "open', "cpp");
    expect(join(quote)).toBe('const char *s = "open');
  });

  it("treats unknown languages as plain text", () => {
    const tokens = highlightCode("return 42", "plain");
    expect(tokens).toEqual([{ text: "return 42", kind: "plain" }]);
    expect(tokenizeLines("a\nb", "plain")).toHaveLength(2);
  });

  it("falls back to plain text above the size guard", () => {
    const code = "x".repeat(MAX_HIGHLIGHT_CHARS + 1);
    const tokens = highlightCode(code, "python");
    expect(tokens).toEqual([{ text: code, kind: "plain" }]);
  });

  it("keeps a trailing newline as an extra editable line", () => {
    expect(tokenizeLines("a\n", "plain")).toHaveLength(2);
    expect(tokenizeLines("", "plain")).toHaveLength(1);
  });
});
