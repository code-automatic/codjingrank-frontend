import { Suspense } from "react";
import { LeaderboardPage } from "@/features/leaderboard/LeaderboardPage";

export const metadata = {
  title: "Bảng xếp hạng · Codjingrank",
  description: "Thứ hạng theo số bài đã giải và lời giải Accepted.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <main>
          <p role="status">Đang mở bảng xếp hạng…</p>
        </main>
      }
    >
      <LeaderboardPage />
    </Suspense>
  );
}
