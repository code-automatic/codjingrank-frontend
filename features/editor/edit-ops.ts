export const INDENT = "    ";

export type CodeEdit = {
  code: string;
  start: number;
  end: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Inserts one indent at a collapsed caret, or indents every line touched by a
 * non-empty selection. Selection offsets are returned for the resulting code.
 */
export function indentSelection(
  code: string,
  selectionStart: number,
  selectionEnd: number,
): CodeEdit {
  const start = clamp(selectionStart, 0, code.length);
  const end = clamp(selectionEnd, 0, code.length);
  const from = Math.min(start, end);
  const to = Math.max(start, end);

  if (from === to) {
    return {
      code: code.slice(0, from) + INDENT + code.slice(from),
      start: from + INDENT.length,
      end: from + INDENT.length,
    };
  }

  const lineStart = code.lastIndexOf("\n", from - 1) + 1;
  // A selection ending at a line start does not include that next line.
  const effectiveEnd = to > from && code[to - 1] === "\n" ? to - 1 : to;
  const nextBreak = code.indexOf("\n", effectiveEnd);
  const lineEnd = nextBreak === -1 ? code.length : nextBreak;
  const block = code.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const indented = lines.map((line) => INDENT + line).join("\n");

  return {
    code: code.slice(0, lineStart) + indented + code.slice(lineEnd),
    start: from + INDENT.length,
    end: to + INDENT.length * lines.length,
  };
}
