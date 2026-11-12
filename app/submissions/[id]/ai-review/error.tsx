"use client";

export default function AiReviewError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="workspace-main ai-review-main">
      <div className="panel error-panel" role="alert">
        <h1>Không mở được màn hình đánh giá AI</h1>
        <p>
          Đã xảy ra lỗi khi hiển thị nhận xét AI. Vui lòng thử lại hoặc quay về
          kho bài tập.
        </p>
        <div className="actions">
          <button type="button" onClick={props.reset}>
            Thử lại
          </button>
        </div>
      </div>
    </main>
  );
}
