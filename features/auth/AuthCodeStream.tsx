"use client";
import { useEffect, useState } from "react";

const LINES = [
  ["comment", "# Mỗi lời giải bắt đầu từ một ý tưởng."],
  ["keyword", "def solve(a: int, b: int) -> int:"],
  ["plain", "    return a + b"],
  ["plain", ""],
  ["keyword", "cases = [(2, 3), (7, 5), (10, 20)]"],
  ["keyword", "for a, b in cases:"],
  ["plain", "    answer = solve(a, b)"],
  ["plain", '    print(f"{a} + {b} = {answer}")'],
  ["plain", ""],
  ["comment", "# Kiểm tra ý tưởng, từng bước một."],
  ["output", "> 2 + 3 = 5"],
  ["output", "> 7 + 5 = 12"],
  ["output", "> 10 + 20 = 30"],
  ["plain", ""],
  ["keyword", "assert solve(0, 0) == 0"],
  ["keyword", "assert solve(-2, 3) == 1"],
  ["comment", "# Thử lại. Hiểu sâu hơn. Tiếp tục viết."],
  ["plain", ""],
] as const;

export function AuthCodeStream() {
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return (
    <div className="auth-terminal" data-paused={paused || hidden}>
      <div className="auth-terminal-bar">
        <span>
          <span className="auth-terminal-dot" />
          main.py
        </span>
        <span>Python 3</span>
      </div>
      <div className="auth-code-window" aria-hidden="true">
        <div className="auth-code-track">
          {[0, 1].map((copy) => (
            <div className="auth-code-batch" key={copy}>
              {LINES.map(([tone, text], index) => (
                <div
                  className={`auth-code-line auth-code-line--${tone}`}
                  key={index}
                >
                  <span className="auth-line-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <code>{text || " "}</code>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="auth-terminal-footer">
        <span>Code minh họa · Không thực thi</span>
        <button
          type="button"
          className="auth-motion-toggle"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? "Tiếp tục hoạt ảnh" : "Tạm dừng hoạt ảnh"}
        </button>
      </div>
    </div>
  );
}
