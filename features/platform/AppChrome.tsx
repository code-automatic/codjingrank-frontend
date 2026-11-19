"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useSession } from "@/features/auth/session";
import { BrandLogo } from "@/lib/ui/BrandLogo";
import { Icon } from "@/lib/ui/Icon";
import {
  applyTheme,
  subscribeToTheme,
  type ThemePreference,
} from "@/lib/ui/theme";
import { PracticeAside } from "./PracticeAside";
import { PracticeStats } from "./PracticeStats";
import "./platform.css";
import "./usability.css";

const links = [
  ["/protected", "Tổng quan"],
  ["/problems", "Kho bài"],
  ["/packages", "Lộ trình"],
  ["/forum", "Cộng đồng"],
  ["/leaderboard", "Ranking"],
] as const;

export function AppChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { status, user, store, loggingOut } = useSession();
  const accountPanel = useRef<HTMLDivElement>(null);
  const [noticeTab, setNoticeTab] = useState("Cộng đồng");
  const [logoutError, setLogoutError] = useState("");
  const preference = useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.dataset.themePreference || "system",
    () => "system",
  );
  const appRoute =
    /^\/(protected|problems|packages|forum|leaderboard|store|profile)(\/|$)/.test(
      path,
    );
  const workspace = /^\/problems\/.+/.test(path);
  if (!appRoute || workspace) return children;
  const catalog = path === "/problems" || path === "/packages";
  const current = (href: string) =>
    path === href || path.startsWith(`${href}/`);
  const navigation = links.map(([href, label]) => (
    <Link
      key={href}
      href={href}
      aria-current={current(href) ? "page" : undefined}
    >
      {label}
    </Link>
  ));
  return (
    <div
      className="platform"
      data-platform-route={path}
      onClickCapture={(event) => {
        const trigger = (event.target as HTMLElement).closest<HTMLElement>(
          "[popovertarget]",
        );
        const target = trigger?.getAttribute("popovertarget");
        if (target)
          document
            .getElementById(target)
            ?.setAttribute("data-pointer-open", String(event.detail > 0));
      }}
    >
      <a className="platform-skip" href="#platform-content">
        Đến nội dung chính
      </a>
      <header className="platform-header">
        <Link
          className="platform-brand"
          href="/protected"
          aria-label="Codjingrank — tổng quan"
        >
          <BrandLogo />
        </Link>
        <nav className="platform-nav" aria-label="Điều hướng chính">
          {navigation}
        </nav>
        <form
          className="platform-search"
          role="search"
          onClick={(event) => {
            if (!(event.target as HTMLElement).closest("button"))
              event.currentTarget.querySelector("input")?.focus();
          }}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            router.push(
              `/problems?q=${encodeURIComponent(String(data.get("q") || "").trim())}`,
            );
          }}
        >
          <Icon name="search" />
          <input
            name="q"
            type="search"
            aria-label="Tìm bài tập"
            placeholder="Tìm bài tập…"
            maxLength={200}
          />
          <button type="submit" aria-label="Tìm kiếm">
            <Icon name="arrowUpRight" />
          </button>
        </form>
        <div className="platform-tools">
          <button
            className="platform-icon-button platform-mobile-menu"
            popoverTarget="platform-mobile-nav"
            aria-label="Mở điều hướng"
          >
            <Icon name="menu" size={20} />
          </button>
          <button
            className="platform-icon-button"
            popoverTarget="platform-notices"
            aria-label="Mở thông báo demo"
          >
            <Icon name="bell" size={19} />
          </button>
          <PracticeStats key={user?.id || "guest"} />
          <button
            className="platform-avatar"
            popoverTarget="platform-account"
            aria-label="Mở menu tài khoản"
          >
            {(user?.username || "C").slice(0, 2).toUpperCase()}
          </button>
          <Link className="platform-store-link" href="/store">
            Khám phá Pro
          </Link>
        </div>
      </header>
      <div
        id="platform-mobile-nav"
        popover="auto"
        className="platform-popover platform-mobile-popover"
      >
        <nav
          aria-label="Điều hướng trên điện thoại"
          onClick={(event) => event.currentTarget.parentElement?.hidePopover()}
        >
          {navigation}
          <Link href="/store">Khám phá Pro · demo</Link>
        </nav>
      </div>
      <div
        id="platform-account"
        ref={accountPanel}
        popover="auto"
        className="platform-popover platform-account"
      >
        <div className="platform-account-head">
          <span className="platform-avatar">
            {(user?.username || "C").slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>{user?.fullName || user?.username || "Codjingrank"}</strong>
            <small>{user?.email || "Không gian của bạn"}</small>
          </div>
        </div>
        <nav
          className="platform-account-grid"
          aria-label="Lối tắt tài khoản"
          onClick={() => accountPanel.current?.hidePopover()}
        >
          <Link href="/profile">
            <Icon name="user" size={23} />
            Hồ sơ
          </Link>
          <Link href="/problems?solved=true">
            <Icon name="check" size={23} />
            Bài đã giải
          </Link>
          <Link href="/packages">
            <Icon name="book" size={23} />
            Lộ trình
          </Link>
          <Link href="/leaderboard">
            <Icon name="trophy" size={23} />
            Thứ hạng
          </Link>
        </nav>
        <fieldset className="platform-theme">
          <legend>
            <Icon name="moon" />
            Giao diện
          </legend>
          {(
            [
              ["system", "Hệ thống"],
              ["light", "Sáng"],
              ["dark", "Tối"],
            ] as const
          ).map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="platform-theme"
                checked={preference === value}
                onChange={() => applyTheme(value as ThemePreference, true)}
              />
              {label}
            </label>
          ))}
        </fieldset>
        {status === "authenticated" ? (
          <button
            className="platform-signout"
            disabled={loggingOut}
            onClick={async () => {
              setLogoutError("");
              try {
                await store.logout();
                accountPanel.current?.hidePopover();
                router.push("/login");
              } catch {
                setLogoutError("Chưa đăng xuất được. Vui lòng thử lại.");
              }
            }}
          >
            <Icon name="logout" />
            {loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        ) : (
          <Link href="/login" className="platform-signout">
            Đăng nhập
          </Link>
        )}
        {logoutError && (
          <p role="alert" className="error">
            {logoutError}
          </p>
        )}
      </div>
      <div
        id="platform-notices"
        popover="auto"
        className="platform-popover platform-notices"
      >
        <div className="platform-panel-title">
          <h2>Thông báo</h2>
          <span className="platform-demo">Demo giao diện</span>
        </div>
        <div
          className="platform-notice-tabs"
          role="group"
          aria-label="Lọc thông báo"
        >
          {["Cộng đồng", "Cập nhật"].map((tab) => (
            <button
              key={tab}
              aria-pressed={noticeTab === tab}
              onClick={() => setNoticeTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="platform-notice-item">
          <Icon
            name={noticeTab === "Cộng đồng" ? "message" : "code"}
            size={25}
          />
          <div>
            <strong>
              {noticeTab === "Cộng đồng"
                ? "Một góc nhìn mới cho bài khó"
                : "Workspace sẵn sàng cho bạn"}
            </strong>
            <p>
              {noticeTab === "Cộng đồng"
                ? "Đọc thảo luận và chia sẻ cách giải cùng mọi người."
                : "Đổi ngôn ngữ, chạy mẫu và xem kết quả trong cùng một màn hình."}
            </p>
            <Link
              href={noticeTab === "Cộng đồng" ? "/forum" : "/problems"}
              onClick={(event) =>
                event.currentTarget
                  .closest<HTMLElement>("[popover]")
                  ?.hidePopover()
              }
            >
              Khám phá <Icon name="arrowUpRight" />
            </Link>
          </div>
        </div>
        <p className="platform-muted">
          Thông báo minh họa, không phải hoạt động từ tài khoản thật.
        </p>
      </div>
      {catalog ? (
        <div className="platform-library">
          <aside className="platform-sidebar" aria-label="Thư viện">
            <nav>
              <Link
                href="/problems"
                aria-current={path === "/problems" ? "page" : undefined}
              >
                <Icon name="book" />
                Thư viện bài tập
              </Link>
              <Link
                href="/packages"
                aria-current={path === "/packages" ? "page" : undefined}
              >
                <Icon name="layers" />
                Lộ trình học
              </Link>
              <Link href="/problems?solved=false">
                <Icon name="code" />
                Bài chưa giải
              </Link>
              <Link href="/problems?solved=true">
                <Icon name="check" />
                Bài đã giải
              </Link>
            </nav>
            <div className="platform-sidebar-note">
              <strong>Tiến từng bước.</strong>
              <p>Chọn một bài, hiểu một cách giải mới.</p>
              <Link href="/forum">
                Trao đổi cùng cộng đồng <Icon name="arrowUpRight" />
              </Link>
            </div>
          </aside>
          <div
            id="platform-content"
            className="platform-library-content"
            tabIndex={-1}
          >
            {children}
          </div>
          <aside className="platform-library-aside">
            <PracticeAside key={user?.id || "guest"} />
          </aside>
        </div>
      ) : (
        <div id="platform-content" tabIndex={-1}>
          {children}
        </div>
      )}
    </div>
  );
}
