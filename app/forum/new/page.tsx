import { PostEditorPage } from "@/features/forum/PostEditorPage";

export const metadata = {
  title: "Viết bài · Codjingrank",
};

export default function Page() {
  return <PostEditorPage mode="create" />;
}
