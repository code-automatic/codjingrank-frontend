export default function Loading() {
  return (
    <main className="container" role="status" aria-live="polite">
      <div className="panel">
        <div className="spinner" aria-hidden="true" />
        <p>Đang chuẩn bị màn hình đánh giá AI…</p>
      </div>
    </main>
  );
}
