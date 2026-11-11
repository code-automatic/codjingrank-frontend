import { Suspense } from "react";
import { ProblemsDirectoryPage } from "@/features/catalog/ProblemsDirectoryPage";

export const metadata = {
  title: "Kho bài tập · Codjingrank",
  description: "Tìm kiếm và lọc bài tập theo gói, độ khó, thẻ và trạng thái",
};

export default function ProblemsPage() {
  return (
    <Suspense
      fallback={
        <main className="workspace-main catalog-main">
          <p className="status-line" role="status">
            <span className="spinner" aria-hidden="true" />
            Đang mở kho bài tập…
          </p>
        </main>
      }
    >
      <ProblemsDirectoryPage />
    </Suspense>
  );
}
