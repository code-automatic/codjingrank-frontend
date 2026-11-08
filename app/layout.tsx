import type { ReactNode } from "react";
import { SessionProvider } from "@/features/auth/session";
import "./styles.css";
export const metadata = {
  title: "Codjingrank · Tài khoản",
  description: "Đăng nhập Codjingrank",
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
