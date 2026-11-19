import type { ReactNode } from "react";
import { SessionProvider } from "@/features/auth/session";
import { themeInitializationScript } from "@/lib/ui/theme";
import { ThemeSync } from "@/lib/ui/ThemeSync";
import { AppChrome } from "@/features/platform/AppChrome";
import { BrandIntro } from "@/lib/ui/BrandIntro";
import { brandIntroInitializationScript } from "@/lib/ui/brand-intro-init";
import "./theme.css";
import "./styles.css";
import "./motion.css";
export const metadata = {
  title: "Codjingrank · Luyện giải lập trình",
  description:
    "Đọc đề, viết code, chạy mẫu và luyện giải lập trình cùng Codjingrank.",
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
        <script
          id="brand-intro-init"
          dangerouslySetInnerHTML={{ __html: brandIntroInitializationScript }}
        />
      </head>
      <body>
        <BrandIntro />
        <ThemeSync />
        <SessionProvider>
          <AppChrome>{children}</AppChrome>
        </SessionProvider>
      </body>
    </html>
  );
}
