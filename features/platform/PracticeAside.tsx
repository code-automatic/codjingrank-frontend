"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/features/auth/session";
import { useApiClient } from "@/lib/api/useApiClient";
import { type DailyChallengeModel, errorText } from "@/lib/api";
import { Icon } from "@/lib/ui/Icon";
import { PracticeCalendar } from "./PracticeCalendar";

export function PracticeAside({
  showCalendar = true,
}: {
  showCalendar?: boolean;
}) {
  const api = useApiClient();
  const { status, user } = useSession();
  const [daily, setDaily] = useState<DailyChallengeModel | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    api.catalog
      .getDailyChallenge({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setDaily(data);
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
      {showCalendar && <PracticeCalendar key={user?.id || "guest"} />}
      <section className="platform-daily">
        <span className="platform-daily-icon">
          <Icon name="code" size={25} />
        </span>
        <h2>Bài thử thách</h2>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button onClick={() => setRetry((value) => value + 1)}>
              Thử tải lại
            </button>
          </>
        ) : daily ? (
          <>
            <small>{daily.date}</small>
            <h3>{daily.problem.title}</h3>
            <p>
              {daily.problem.solved
                ? "Bạn đã giải bài này."
                : "Dành một chút thời gian cho một bài giải mới."}
            </p>
            {daily.problem.canOpen ? (
              <Link
                className="platform-primary"
                href={`/problems/${daily.problem.slug}`}
              >
                Mở bài tập <Icon name="arrowUpRight" />
              </Link>
            ) : (
              <Link href={`/packages/${daily.problem.packageSlug}`}>
                Xem lộ trình mở khóa
              </Link>
            )}
          </>
        ) : (
          <p role="status">
            {status === "authenticated"
              ? "Đang tải bài thử thách…"
              : "Đăng nhập để xem bài thử thách."}
          </p>
        )}
      </section>
      <section className="platform-aside-community">
        <Icon name="message" size={27} />
        <h2>Gỡ khó cùng nhau</h2>
        <p>Đặt câu hỏi, đọc cách làm và chia sẻ lời giải.</p>
        <Link href="/forum">
          Đến cộng đồng <Icon name="arrowUpRight" />
        </Link>
      </section>
    </>
  );
}
