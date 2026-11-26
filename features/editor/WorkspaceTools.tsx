"use client";

import { RoundedSelect } from "@/lib/ui/RoundedSelect";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/lib/ui/Icon";
import { elapsedAt, formatClock } from "./workspace-clock";

export function WorkspaceTools({
  fontSize,
  onFontSize,
}: {
  fontSize: number;
  onFontSize: (size: number) => void;
}) {
  const [mode, setMode] = useState<"stopwatch" | "timer">("stopwatch");
  const [minutes, setMinutes] = useState(25);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [pointer, setPointer] = useState(false);
  const accumulated = useRef(0);
  const startedAt = useRef<number | null>(null);
  const remaining = Math.max(0, minutes * 60000 - elapsed);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const value = elapsedAt(
        accumulated.current,
        startedAt.current,
        Date.now(),
      );
      if (mode === "timer" && value >= minutes * 60000) {
        accumulated.current = minutes * 60000;
        startedAt.current = null;
        setElapsed(minutes * 60000);
        setRunning(false);
        setFinished(true);
      } else setElapsed(value);
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [running, mode, minutes]);

  function reset() {
    accumulated.current = 0;
    startedAt.current = null;
    setElapsed(0);
    setRunning(false);
    setFinished(false);
  }

  function toggle() {
    if (running) {
      const value = elapsedAt(
        accumulated.current,
        startedAt.current,
        Date.now(),
      );
      accumulated.current = value;
      startedAt.current = null;
      setElapsed(value);
      setRunning(false);
    } else {
      if (finished) {
        accumulated.current = 0;
        setElapsed(0);
        setFinished(false);
      }
      startedAt.current = Date.now();
      setRunning(true);
    }
  }

  return (
    <div className="workspace-tools">
      <button
        type="button"
        className="workspace-icon-button"
        popoverTarget="workspace-settings"
        aria-label="Cài đặt trình soạn thảo"
        title="Cài đặt trình soạn thảo"
      >
        <Icon name="settings" />
      </button>
      <div
        id="workspace-settings"
        popover="auto"
        className="workspace-tool-popover workspace-settings-popover"
      >
        <header>
          <strong>Trình soạn thảo</strong>
          <button
            type="button"
            popoverTarget="workspace-settings"
            popoverTargetAction="hide"
            aria-label="Đóng cài đặt"
          >
            <Icon name="close" />
          </button>
        </header>
        <label htmlFor="workspace-font-size">Cỡ chữ</label>
        <RoundedSelect
          label="Cỡ chữ"
          id="workspace-font-size"
          value={fontSize}
          onChange={(event) => onFontSize(Number(event.target.value))}
        >
          {[12, 13, 14, 15, 16].map((size) => (
            <option key={size} value={size}>
              {size} px
            </option>
          ))}
        </RoundedSelect>
        <p>
          Theme dùng chung với Codjingrank. Bản nháp tự lưu theo tài khoản, bài
          và ngôn ngữ.
        </p>
      </div>
      <button
        type="button"
        className={`workspace-clock-trigger ${running ? "is-running" : ""}`}
        popoverTarget="workspace-clock"
        aria-label="Mở đồng hồ luyện tập"
        title="Đồng hồ luyện tập"
        onClick={(event) => setPointer(event.detail > 0)}
      >
        <Icon name="clock" />
        {(running || elapsed > 0) && (
          <span>{formatClock(mode === "timer" ? remaining : elapsed)}</span>
        )}
      </button>
      <div
        id="workspace-clock"
        popover="auto"
        className="workspace-tool-popover workspace-clock-popover"
        data-pointer={pointer}
      >
        <header>
          <strong>Đồng hồ luyện tập</strong>
          <button
            type="button"
            popoverTarget="workspace-clock"
            popoverTargetAction="hide"
            aria-label="Đóng đồng hồ"
          >
            <Icon name="close" />
          </button>
        </header>
        <div
          className="workspace-clock-modes"
          role="group"
          aria-label="Chế độ đồng hồ"
        >
          <button
            type="button"
            aria-pressed={mode === "stopwatch"}
            onClick={() => {
              reset();
              setMode("stopwatch");
            }}
          >
            <Icon name="clock" size={24} />
            <span lang="en">Stopwatch</span>
          </button>
          <button
            type="button"
            aria-pressed={mode === "timer"}
            onClick={() => {
              reset();
              setMode("timer");
            }}
          >
            <Icon name="history" size={24} />
            <span lang="en">Timer</span>
          </button>
        </div>
        <output
          className="workspace-clock-display"
          aria-label={
            mode === "timer" ? "Thời gian còn lại" : "Thời gian đã luyện"
          }
          aria-live="off"
        >
          {formatClock(mode === "timer" ? remaining : elapsed)}
        </output>
        {mode === "timer" && (
          <label className="workspace-clock-duration">
            Số phút
            <input
              type="number"
              min={1}
              max={180}
              value={minutes}
              disabled={running || elapsed > 0}
              onChange={(event) =>
                setMinutes(
                  Math.max(1, Math.min(180, Number(event.target.value) || 1)),
                )
              }
            />
          </label>
        )}
        <div className="workspace-clock-actions">
          <button type="button" onClick={toggle}>
            <Icon name={running ? "pause" : "play"} />
            {running
              ? "Tạm dừng"
              : finished
                ? "Bắt đầu lại"
                : elapsed > 0
                  ? "Tiếp tục"
                  : mode === "timer"
                    ? "Bắt đầu đếm ngược"
                    : "Bắt đầu bấm giờ"}
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Đặt lại đồng hồ"
            title="Đặt lại đồng hồ"
          >
            <Icon name="reset" />
          </button>
        </div>
        <p role="status">
          {finished
            ? "Đã hết thời gian luyện tập."
            : "Đồng hồ tiếp tục khi đóng bảng; rời trang sẽ đặt lại."}
        </p>
      </div>
      {finished && (
        <span className="workspace-clock-complete" role="status">
          Hết giờ
        </span>
      )}
    </div>
  );
}
