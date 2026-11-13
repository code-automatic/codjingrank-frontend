import type { ReactNode } from "react";
import { SessionProvider } from "@/features/auth/session";
import { themeInitializationScript } from "@/lib/ui/theme";
import { ThemeSync } from "@/lib/ui/ThemeSync";
import "./theme.css";
import "./styles.css";
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
      </head>
      <body>
        <ThemeSync />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
