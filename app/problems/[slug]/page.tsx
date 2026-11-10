import { ProblemRunWorkspace } from "@/features/problem-run/ProblemRunWorkspace";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProblemRunWorkspace slug={slug} />;
}
