import { Suspense } from "react";
import { PackagesCatalogPage } from "@/features/catalog/PackagesCatalogPage";

export const metadata = {
  title: "Gói bài tập · Codjingrank",
  description: "Danh sách gói bài tập theo chủ đề",
};

export default function PackagesPage() {
  return (
    <Suspense
      fallback={
        <main className="workspace-main catalog-main">
          <p className="status-line" role="status">
            <span className="spinner" aria-hidden="true" />
            Đang mở danh sách gói bài…
          </p>
        </main>
      }
    >
      <PackagesCatalogPage />
    </Suspense>
  );
}
