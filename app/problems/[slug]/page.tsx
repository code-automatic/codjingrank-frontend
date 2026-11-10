import { notFound } from "next/navigation";
import { ProblemWorkspacePage } from "@/features/editor/ProblemWorkspacePage";
import { isSlug } from "@/lib/api/guards";

export const metadata = { title: "Luyện tập · Codjingrank" };

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  return <ProblemWorkspacePage slug={slug} />;
}
