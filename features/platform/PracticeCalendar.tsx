"use client";
import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/api/useApiClient";
import { useSession } from "@/features/auth/session";
import { type UserStatsModel, errorText } from "@/lib/api";
import { Icon } from "@/lib/ui/Icon";

export function PracticeCalendar() {
  const api = useApiClient();
  const { status, user } = useSession();
  const [now, setNow] = useState<Date | null>(null);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState("");
  const [stats, setStats] = useState<UserStatsModel | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
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
  if (!now)
    return (
      <section className="practice-calendar" aria-label="Lịch luyện tập">
        <p role="status">Đang tải lịch…</p>
      </section>
    );
  const today = now.toISOString().slice(0, 10);
  const month = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1),
  );
  const days = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const remaining =
    86400 -
    (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds());
  const countdown = [
    Math.floor(remaining / 3600),
    Math.floor(remaining / 60) % 60,
    remaining % 60,
  ]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
  const activities = new Map(
    stats?.activity.map((item) => [item.date, item.count]) || [],
  );
  const activeDate = selected || today;
  const count = activities.get(activeDate);
  return (
    <section className="practice-calendar" aria-label="Lịch luyện tập">
      <div className="practice-calendar-top">
        <div>
          <strong>Ngày {now.getUTCDate()}</strong>
          <span aria-hidden="true">{countdown} còn lại</span>
          <small>UTC</small>
        </div>
        <span
          className="practice-calendar-badge"
          aria-label={`Tháng ${month.getUTCMonth() + 1}`}
        >
          {String(month.getUTCMonth() + 1).padStart(2, "0")}
          <small>THÁNG</small>
        </span>
      </div>
      <div className="practice-calendar-month">
        <strong>
          {month.toLocaleDateString("vi-VN", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}
        </strong>
        <div>
          <button
            aria-label="Tháng trước"
            onClick={() => setOffset((value) => value - 1)}
          >
            <Icon name="chevronLeft" />
          </button>
          <button
            aria-label="Tháng sau"
            onClick={() => setOffset((value) => value + 1)}
          >
            <Icon name="chevronRight" />
          </button>
        </div>
      </div>
      <div className="practice-calendar-grid">
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
          <span className="practice-calendar-weekday" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: month.getUTCDay() }, (_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = new Date(
            Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), i + 1),
          )
            .toISOString()
            .slice(0, 10);
          const activity = activities.get(date);
          return (
            <button
              key={date}
              aria-label={`${i + 1}/${month.getUTCMonth() + 1}/${month.getUTCFullYear()}${activity ? `, ${activity} hoạt động` : ""}`}
              aria-current={date === today ? "date" : undefined}
              aria-pressed={date === activeDate}
              data-active={Boolean(activity)}
              onClick={() => setSelected(date)}
            >
              {i + 1}
              <i aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <div className="practice-calendar-summary">
        <strong>{activeDate.split("-").reverse().join("/")}</strong>
        <p>
          {error
            ? "Chưa tải được lịch sử hoạt động."
            : stats
              ? count
                ? `${count} hoạt động luyện tập được ghi nhận.`
                : "Không có hoạt động được ghi nhận trong dữ liệu hiện có."
              : "Đang tải hoạt động luyện tập…"}
        </p>
        {error && (
          <button onClick={() => setRetry((value) => value + 1)} title={error}>
            Tải lại hoạt động
          </button>
        )}
      </div>
      <div className="practice-calendar-footer">
        <span>
          <Icon name="flame" />
          {stats
            ? `${stats.streak.currentStreak} ngày liên tiếp`
            : "Chuỗi luyện tập"}
        </span>
        <button
          onClick={() => {
            setOffset(0);
            setSelected(today);
          }}
        >
          Hôm nay
        </button>
      </div>
    </section>
  );
}
