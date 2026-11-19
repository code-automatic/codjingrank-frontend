"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/features/auth/session";
import { useApiClient } from "@/lib/api/useApiClient";
import { type UserStatsModel, errorText } from "@/lib/api";
import { Icon } from "@/lib/ui/Icon";
import Link from "next/link";
export function PracticeStats() {
  const { status, user } = useSession();
  const api = useApiClient();
  const [stats, setStats] = useState<UserStatsModel | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    api.judge
      .getMyStats({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setStats(data);
          setError("");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(errorText(error));
      });
    return () => controller.abort();
  }, [api, status, user?.id, retry]);
  return (
    <>
      <button
        className="platform-icon-button platform-streak-button"
        popoverTarget="platform-streak"
        aria-label="Xem chuỗi luyện tập"
      >
        <Icon name="flame" size={19} />
        <span>
          {status === "authenticated" && stats
            ? stats.streak.currentStreak
            : "—"}
        </span>
      </button>
      <div
        id="platform-streak"
        popover="auto"
        className="platform-popover platform-streak"
      >
        <h2>Nhịp luyện tập của bạn</h2>
        {process.env.NEXT_PUBLIC_MOCK_MODE === "true" && (
          <span className="platform-demo">Dữ liệu demo</span>
        )}
        {status !== "authenticated" ? (
          <p>Đăng nhập để theo dõi tiến độ.</p>
        ) : error ? (
          <>
            <p role="alert">{error}</p>
            <button onClick={() => setRetry((value) => value + 1)}>
              Thử lại
            </button>
          </>
        ) : stats ? (
          <>
            <dl>
              <div>
                <dt>Chuỗi hiện tại</dt>
                <dd>{stats.streak.currentStreak} ngày</dd>
              </div>
              <div>
                <dt>Chuỗi dài nhất</dt>
                <dd>{stats.streak.maxStreak} ngày</dd>
              </div>
              <div>
                <dt>Bài đã giải</dt>
                <dd>{stats.solvedCount.total}</dd>
              </div>
              <div>
                <dt>Thứ hạng</dt>
                <dd>
                  {stats.rank.currentRank
                    ? `#${stats.rank.currentRank}`
                    : "Chưa xếp hạng"}
                </dd>
              </div>
            </dl>
            <Link
              href="/problems?solved=false"
              onClick={(event) =>
                event.currentTarget
                  .closest<HTMLElement>("[popover]")
                  ?.hidePopover()
              }
            >
              Giải thêm một bài <Icon name="arrowUpRight" />
            </Link>
          </>
        ) : (
          <p role="status">Đang tải tiến độ…</p>
        )}
      </div>
    </>
  );
}
