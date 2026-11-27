"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/api/useApiClient";
import { errorText, type SubmissionSummaryModel } from "@/lib/api";
import { Icon } from "@/lib/ui/Icon";

export function Notifications({ userId }: { userId: string }) {
  const api = useApiClient();
  const [items, setItems] = useState<SubmissionSummaryModel[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const storageKey = `codjingrank:notifications:${userId}`;
  const itemKey = (item: SubmissionSummaryModel) => `${item.id}:${item.status}`;
  useEffect(() => {
    let active = true;
    let busy = false;
    let controller: AbortController | undefined;
    async function load() {
      if (busy || document.hidden) return;
      busy = true;
      controller = new AbortController();
      const timer = setTimeout(() => controller?.abort(), 15000);
      try {
        const result = await api.judge.listMySubmissions(
          { page: 1, size: 20 },
          { signal: controller.signal },
        );
        if (!active) return;
        setItems(
          result.items.filter(
            (item) => item.userId === userId && item.isTerminal,
          ),
        );
        try {
          const saved: unknown = JSON.parse(
            localStorage.getItem(storageKey) || "[]",
          );
          setRead(
            Array.isArray(saved)
              ? saved
                  .filter((value): value is string => typeof value === "string")
                  .slice(-300)
              : [],
          );
        } catch {
          setRead([]);
        }
        setError("");
      } catch (reason) {
        if (active)
          setError(
            controller.signal.aborted
              ? "Tải thông báo quá thời gian chờ."
              : errorText(reason),
          );
      } finally {
        clearTimeout(timer);
        busy = false;
        if (active) setReady(true);
      }
    }
    void load();
    const timer = setInterval(() => void load(), 60000);
    const refresh = () => void load();
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      controller?.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [api, userId, storageKey, revision]);
  function markRead(keys: string[]) {
    const next = [...new Set([...read, ...keys])].slice(-300);
    setRead(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  }
  const unread = items.filter((item) => !read.includes(itemKey(item)));
  const shown = onlyUnread ? unread : items;
  return (
    <>
      <button
        type="button"
        className="platform-icon-button notification-trigger"
        title="Thông báo bài nộp"
        popoverTarget="platform-notices"
        aria-label={`Thông báo bài nộp${unread.length ? `, ${unread.length} chưa đọc` : ""}`}
      >
        <Icon name="bell" size={20} />
        {unread.length > 0 && (
          <span className="notification-count" aria-hidden="true">
            {unread.length}
          </span>
        )}
      </button>
      <div
        id="platform-notices"
        popover="auto"
        className="platform-popover platform-notices"
      >
        <div className="platform-panel-title">
          <h2>Thông báo</h2>
          <span>{unread.length} chưa đọc</span>
        </div>
        <p className="platform-muted">
          Kết quả từ 20 bài nộp gần nhất của bạn.
        </p>
        <div className="platform-notice-tabs">
          <button
            aria-pressed={!onlyUnread}
            onClick={() => setOnlyUnread(false)}
          >
            Tất cả
          </button>
          <button aria-pressed={onlyUnread} onClick={() => setOnlyUnread(true)}>
            Chưa đọc
          </button>
        </div>
        {!ready && <p role="status">Đang tải thông báo…</p>}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {ready && !error && !shown.length && (
          <p>
            Không có {onlyUnread ? "thông báo chưa đọc" : "kết quả bài nộp"}.
          </p>
        )}
        <div className="notification-list">
          {shown.map((item) => (
            <article
              className="platform-notice-item"
              key={itemKey(item)}
              data-unread={!read.includes(itemKey(item))}
            >
              <Icon name={item.isAccepted ? "check" : "code"} size={22} />
              <div>
                <strong>{item.problemTitle}</strong>
                <p>
                  {item.status} · {item.passCount}/{item.totalTestcases} test ·{" "}
                  {item.languageSlug}
                </p>
                <time dateTime={item.judgedAt || item.createdAt}>
                  {new Date(item.judgedAt || item.createdAt).toLocaleString(
                    "vi-VN",
                  )}
                </time>
                <Link
                  href={`/problems/${encodeURIComponent(item.problemSlug)}`}
                  onClick={(event) => {
                    markRead([itemKey(item)]);
                    event.currentTarget
                      .closest<HTMLElement>("[popover]")
                      ?.hidePopover();
                  }}
                >
                  Mở bài tập <Icon name="arrowUpRight" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="notification-actions">
          <button
            disabled={!unread.length}
            onClick={() => markRead(items.map(itemKey))}
          >
            Đánh dấu đã đọc
          </button>
          <button onClick={() => setRevision((value) => value + 1)}>
            Tải lại
          </button>
        </div>
        <p className="platform-muted">
          Tự cập nhật mỗi phút. Trạng thái đã đọc được lưu trên trình duyệt này.
        </p>
      </div>
    </>
  );
}
