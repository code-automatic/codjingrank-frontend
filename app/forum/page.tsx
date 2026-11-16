import { Suspense } from "react";
import { ForumPage } from "@/features/forum/ForumPage";

export const metadata = {
  title: "Cộng đồng · Codjingrank",
  description:
    "Hỏi đáp, thảo luận và chia sẻ lời giải cùng cộng đồng Codjingrank.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <main>
          <p role="status">Đang mở cộng đồng…</p>
        </main>
      }
    >
      <ForumPage />
    </Suspense>
  );
}
