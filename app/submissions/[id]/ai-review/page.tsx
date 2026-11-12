import { notFound } from "next/navigation";
import { AiReviewPage } from "@/features/ai-review/AiReviewPage";
import { isUuid } from "@/lib/api/guards";

export const metadata = {
  title: "Đánh giá AI · Codjingrank",
  description: "Xem điểm, tiêu chí và góp ý AI tách biệt với kết quả chấm",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  return <AiReviewPage submissionId={id} />;
}
