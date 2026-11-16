"use client";

import Link from "next/link";
import { resolveAiReviewErrorMessage } from "@/features/ai-review/aiReviewModel";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container" role="alert">
      <div className="panel error-panel">
        <h2>Không thể mở màn hình đánh giá AI</h2>
        <p className="error">{resolveAiReviewErrorMessage(error)}</p>
        <div className="actions">
          <button type="button" onClick={() => reset()}>
            Thử lại
          </button>
          <Link href="/problems" className="button-secondary">
            Quay lại kho bài tập
          </Link>
        </div>
      </div>
    </main>
  );
}
