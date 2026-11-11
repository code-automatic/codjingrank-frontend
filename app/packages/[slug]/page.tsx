import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PackageDetailPage } from "@/features/catalog/PackageDetailPage";
import { isSlug } from "@/lib/api/guards";

export const metadata = {
  title: "Chi tiết gói bài · Codjingrank",
  description: "Theo dõi 3 cấp độ và lọc bài tập trong gói",
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  return (
    <Suspense
      fallback={
        <main className="workspace-main catalog-main">
          <p className="status-line" role="status">
            <span className="spinner" aria-hidden="true" />
            Đang mở gói bài…
          </p>
        </main>
      }
    >
      <PackageDetailPage slug={slug} />
    </Suspense>
  );
}
