"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type UIEvent,
} from "react";
import { indentSelection } from "./edit-ops";
import { tokenizeLines, type EditorLanguage } from "./highlight";

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
  const lines = useMemo(
    () => tokenizeLines(value, language),
    [value, language],
  );
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
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

  const updateCursor = () => {
    const area = areaRef.current;
    if (!area) return;
    setCursor(cursorAt(value, area.selectionStart));
  };

  const handleScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    syncScroll(event.currentTarget);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.currentTarget.blur();
      return;
    }
    if (
      event.key !== "Tab" ||
      event.shiftKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    const area = event.currentTarget;
    const edit = indentSelection(
      value,
      area.selectionStart,
      area.selectionEnd,
    );
    pendingSelection.current = [edit.start, edit.end];
    onChange(edit.code);
  };

  return (
    <div
      className={`code-editor${disabled ? " code-editor--disabled" : ""}`}
    >
      <div className="code-editor__gutter" ref={gutterRef} aria-hidden="true">
        {lines.map((_, index) => (
          <div className="code-editor__line-number" key={index}>
            {index + 1}
          </div>
        ))}
      </div>
      <div className="code-editor__surface">
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
                    <span
                      className={`tok tok-${token.kind}`}
                      key={tokenIndex}
                    >
                      {token.text}
                    </span>
                  ))}
            </span>
          ))}
        </pre>
        <textarea
          ref={areaRef}
          className="code-editor__input"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setCursor(cursorAt(event.target.value, event.target.selectionStart));
          }}
          onScroll={handleScroll}
          onSelect={updateCursor}
          onClick={updateCursor}
          onKeyUp={updateCursor}
          onKeyDown={handleKeyDown}
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
        <span>{lines.length} dòng</span>
      </div>
    </div>
  );
}
