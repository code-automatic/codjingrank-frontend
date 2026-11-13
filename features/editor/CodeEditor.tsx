"use client";

import {
  useEffect,
  memo,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type UIEvent,
} from "react";
import { indentSelection } from "./edit-ops";
import {
  MAX_HIGHLIGHT_CHARS,
  tokenizeLines,
  type EditorLanguage,
} from "./highlight";

export type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language: EditorLanguage;
  label: string;
  describedBy?: string;
  disabled?: boolean;
};

type Cursor = {
  line: number;
  column: number;
};

function cursorAt(value: string, position: number): Cursor {
  const safe = Math.max(0, Math.min(position, value.length));
  const before = value.slice(0, safe);
  const lastBreak = before.lastIndexOf("\n");
  return {
    line: before.split("\n").length,
    column: safe - lastBreak,
  };
}

export function CodeEditor({
  value,
  onChange,
  language,
  label,
  describedBy,
  disabled = false,
}: CodeEditorProps) {
  const [tabMovesFocus, setTabMovesFocus] = useState(false);
  const plain = value.length > MAX_HIGHLIGHT_CHARS;
  const lines = useMemo(
    () => (plain ? [] : tokenizeLines(value, language)),
    [value, language, plain],
  );
  const lineCount = plain ? value.split("\n").length : lines.length;
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<[number, number] | null>(null);
  const [cursor, setCursor] = useState<Cursor>({ line: 1, column: 1 });

  const syncScroll = (area: HTMLTextAreaElement) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = area.scrollTop;
      highlightRef.current.scrollLeft = area.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = area.scrollTop;
    }
  };

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const pending = pendingSelection.current;
    if (pending) {
      area.setSelectionRange(pending[0], pending[1]);
      pendingSelection.current = null;
    }
    syncScroll(area);
    setCursor(cursorAt(value, area.selectionStart));
  }, [value]);

  useEffect(() => {
    if (areaRef.current && activeLineRef.current)
      activeLineRef.current.style.transform = `translateY(${(cursor.line - 1) * 20 - areaRef.current.scrollTop}px)`;
  }, [cursor.line]);

  const updateCursor = () => {
    const area = areaRef.current;
    if (!area) return;
    setCursor(cursorAt(value, area.selectionStart));
  };

  const handleScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    syncScroll(event.currentTarget);
    if (activeLineRef.current)
      activeLineRef.current.style.transform = `translateY(${(cursor.line - 1) * 20 - event.currentTarget.scrollTop}px)`;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      setTabMovesFocus(true);
      return;
    }
    if (
      event.key !== "Tab" ||
      tabMovesFocus ||
      event.shiftKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    const area = event.currentTarget;
    const edit = indentSelection(value, area.selectionStart, area.selectionEnd);
    pendingSelection.current = [edit.start, edit.end];
    onChange(edit.code);
  };

  return (
    <div className={`code-editor${disabled ? " code-editor--disabled" : ""}`}>
      <div className="code-editor__gutter" ref={gutterRef} aria-hidden="true">
        {lines.map((_, index) => (
          <div className="code-editor__line-number" key={index}>
            {index + 1}
          </div>
        ))}
      </div>
      <div className="code-editor__surface">
        <div
          className="code-editor__active-line"
          ref={activeLineRef}
          aria-hidden="true"
        />
        <pre
          className="code-editor__highlight"
          ref={highlightRef}
          aria-hidden="true"
        >
          {lines.map((line, lineIndex) => (
            <span className="code-editor__line" key={lineIndex}>
              {line.length === 0
                ? "\u200b"
                : line.map((token, tokenIndex) => (
                    <span className={`tok tok-${token.kind}`} key={tokenIndex}>
                      {token.text}
                    </span>
                  ))}
            </span>
          ))}
        </pre>
        <textarea
          ref={areaRef}
          className={`code-editor__input${plain ? " code-editor__input--plain" : ""}`}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setCursor(
              cursorAt(event.target.value, event.target.selectionStart),
            );
          }}
          onScroll={handleScroll}
          onSelect={updateCursor}
          onClick={updateCursor}
          onKeyUp={updateCursor}
          onKeyDown={handleKeyDown}
          onBlur={() => setTabMovesFocus(false)}
          disabled={disabled}
          aria-label={label}
          aria-describedby={describedBy}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
        />
      </div>
      <div className="code-editor__status" aria-hidden="true">
        <span>
          Ln {cursor.line}, Col {cursor.column}
        </span>
        <span>
          {lineCount} dòng{plain ? " · Văn bản thuần (mã dài)" : ""}
        </span>
      </div>
    </div>
  );
}

export const MemoCodeEditor = memo(CodeEditor);
