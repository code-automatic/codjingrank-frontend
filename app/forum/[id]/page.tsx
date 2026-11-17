import { ForumPostPage } from "@/features/forum/ForumPostPage";

export const metadata = {
  title: "Bài viết cộng đồng · Codjingrank",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ForumPostPage id={id} />;
}
