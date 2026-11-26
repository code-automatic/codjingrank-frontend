import type { ReactNode } from "react";
import { SessionProvider } from "@/features/auth/session";
import { themeInitializationScript } from "@/lib/ui/theme";
import { ThemeSync } from "@/lib/ui/ThemeSync";
import { AppChrome } from "@/features/platform/AppChrome";
import { AuthTransition } from "@/lib/ui/AuthTransition";
import { BrandIntro } from "@/lib/ui/BrandIntro";
import { brandIntroInitializationScript } from "@/lib/ui/brand-intro-init";
import "./theme.css";
import "./styles.css";
import "./motion.css";
import "./refinements.css";
import "./product-motion.css";
import "./product-design.css";
import "./product-glass.css";
import "./unified-ui.css";
import "../features/auth/auth-scene.css";
import "./sidebar-ui.css";
import "./product-system.css";
import "./typography.css";
import "./rounded-controls.css";
import "../features/auth/auth-fit.css";
export const metadata = {
  title: "Codjingrank · Luyện giải lập trình",
  description:
    "Đọc đề, viết code, chạy mẫu và luyện giải lập trình cùng Codjingrank.",
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/brand/codjingrank-cr.svg" as="image" />
        <link
          rel="preload"
          href="/fonts/jetbrains-mono-nerd/regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
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
          <AuthTransition>
            <AppChrome>{children}</AppChrome>
          </AuthTransition>
        </SessionProvider>
      </body>
    </html>
  );
}
