"use client";

export default function ProblemError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="workspace-main">
      <div className="panel error-panel" role="alert">
        <h1>Không mở được trang bài tập</h1>
        <p>
          Đã xảy ra lỗi khi hiển thị bài. Vui lòng thử lại; nếu lỗi lặp lại,
          tải lại trang hoặc quay về trang tài khoản.
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
