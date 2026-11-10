import { ProblemWorkspacePage } from "@/features/editor/ProblemWorkspacePage";

export const metadata = {
  title: "Luyện tập · Codjingrank",
  description: "Soạn code, đổi ngôn ngữ và lưu nháp theo bài.",
};

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProblemWorkspacePage slug={slug} />;
}
