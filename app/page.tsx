import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/LandingPage";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: "Codjingrank · Mỗi bài giải, một bước tiến",
  description:
    "Luyện lập trình theo cấp độ. Viết code, chạy test mẫu, nộp bài và học từ cộng đồng trên Codjingrank.",
  other: { "page-type": "software", "site-kind": "software" },
  openGraph: {
    title: "Codjingrank · Mỗi bài giải, một bước tiến",
    description: "Một nơi để đọc đề, viết code và tiến bộ qua từng bài giải.",
    images: [
      {
        url: "/landing/workspace.png",
        alt: "Workspace luyện lập trình Codjingrank",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
};

export default function Home() {
  return <LandingPage />;
}
