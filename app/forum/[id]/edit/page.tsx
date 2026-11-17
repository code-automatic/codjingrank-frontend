import { PostEditorPage } from "@/features/forum/PostEditorPage";

export const metadata = {
  title: "Sửa bài viết · Codjingrank",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PostEditorPage mode="edit" postId={id} />;
}
