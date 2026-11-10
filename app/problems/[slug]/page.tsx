import { notFound } from "next/navigation";
import { ProblemPage } from "@/features/problems/ProblemPage";
import { isSlug } from "@/lib/api/guards";

export const metadata = { title: "Chi tiết bài tập · Codjingrank" };

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  return <ProblemPage slug={slug} />;
}
