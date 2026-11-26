"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSession } from "@/features/auth/session";
import { BrandLogo } from "@/lib/ui/BrandLogo";
import { Icon, type IconName } from "@/lib/ui/Icon";
import { ThemeToggle } from "@/lib/ui/ThemeToggle";
import { applyTheme } from "@/lib/ui/theme";
import { PracticeStats } from "./PracticeStats";
import { initials } from "@/features/forum/presentation";
import "./platform.css";
import "./usability.css";

const links = [
  ["/protected", "Tổng quan"],
  ["/problems", "Kho bài"],
  ["/packages", "Lộ trình"],
  ["/forum", "Cộng đồng"],
  ["/leaderboard", "Ranking"],
] as const;
const navigationIcons: IconName[] = [
  "layers",
  "code",
  "book",
  "message",
  "trophy",
];

export function AppChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { status, user, store, loggingOut } = useSession();
  const accountPanel = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const [noticeTab, setNoticeTab] = useState("Cộng đồng");
  const [logoutError, setLogoutError] = useState("");
  const [ambientMotion, setAmbientMotion] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarMotion, setSidebarMotion] = useState(false);
  useEffect(() => {
    shell.current
      ?.querySelector<HTMLElement>(
        ":scope > #platform-content, :scope > .platform-library",
      )
      ?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [path]);
  const appRoute =
    /^\/(protected|problems|packages|forum|leaderboard|store|profile)(\/|$)/.test(
      path,
    );
  const workspace = /^\/problems\/.+/.test(path);
  if (!appRoute || workspace) return children;
  const catalog = path === "/problems" || path === "/packages";
  const current = (href: string) =>
    path === href || path.startsWith(`${href}/`);
  const navigation = links.map(([href, label], index) => (
    <Link
      key={href}
      href={href}
      aria-current={current(href) ? "page" : undefined}
      aria-label={label}
      title={label}
    >
      <Icon name={navigationIcons[index]} size={19} />
      <span>{label}</span>
    </Link>
  ));
  return (
    <div
      className="platform"
      data-platform-route={path}
      data-sidebar-expanded={sidebarExpanded}
      data-sidebar-motion={sidebarMotion}
      data-ambient-motion={ambientMotion}
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
        <button
          type="button"
          className="platform-rail-toggle"
          aria-label={
            sidebarExpanded ? "Thu gọn điều hướng" : "Mở rộng điều hướng"
          }
          aria-expanded={sidebarExpanded}
          onClick={(event) => {
            setSidebarMotion(event.detail > 0);
            setSidebarExpanded((value) => !value);
          }}
          title={sidebarExpanded ? "Thu gọn" : "Mở rộng"}
        >
          <Icon name={sidebarExpanded ? "chevronLeft" : "menu"} size={20} />
        </button>
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
        <div className="platform-tools">
          <button
            className="platform-icon-button platform-mobile-menu"
            popoverTarget="platform-mobile-nav"
            aria-label="Mở điều hướng"
          >
            <Icon name="menu" size={20} />
          </button>
          <button
            className="platform-icon-button platform-appearance-trigger"
            popoverTarget="platform-appearance"
            aria-label="Tùy chỉnh giao diện"
            title="Tùy chỉnh giao diện"
          >
            <Icon name="settings" size={20} />
            <span>Tùy chỉnh</span>
          </button>
          <button
            className="platform-avatar"
            popoverTarget="platform-account"
            aria-label="Mở menu tài khoản"
          >
            <span className="platform-account-initials">
              {initials(user?.fullName || user?.username || "Codjingrank")}
            </span>
            <span className="platform-account-name">
              {user?.fullName || user?.username || "Tài khoản"}
            </span>
          </button>
          <Link
            className="platform-store-link"
            href="/store"
            aria-label="Khám phá Pro"
            title="Khám phá Pro"
          >
            <Icon name="sparkles" size={20} />
            <span>Khám phá Pro</span>
          </Link>
        </div>
      </header>
      <div className="platform-shell" ref={shell}>
        <div className="platform-meteors" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="platform-topbar" aria-label="Tìm kiếm và hoạt động">
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
              placeholder="Tìm bài tập toàn hệ thống…"
              maxLength={200}
            />
            <button type="submit" aria-label="Tìm kiếm">
              <Icon name="arrowUpRight" />
            </button>
          </form>
          <div className="platform-topbar-actions">
            {" "}
            <button
              type="button"
              className="platform-icon-button"
              title="Thông báo"
              popoverTarget="platform-notices"
              aria-label="Mở thông báo demo"
            >
              <Icon name="bell" size={20} />
            </button>
            <PracticeStats key={user?.id || "guest"} />
          </div>
        </div>
        <div
          id="platform-mobile-nav"
          popover="auto"
          className="platform-popover platform-mobile-popover"
        >
          <nav
            aria-label="Điều hướng trên điện thoại"
            onClick={(event) =>
              event.currentTarget.parentElement?.hidePopover()
            }
          >
            {navigation}
            <Link href="/store">Khám phá Pro · demo</Link>
          </nav>
        </div>
        <div
          id="platform-appearance"
          popover="auto"
          className="platform-popover platform-appearance"
        >
          <h2>Tùy chỉnh giao diện</h2>
          <div className="platform-appearance-row">
            <span>Sáng / Tối</span>
            <ThemeToggle />
          </div>
          <button type="button" onClick={() => applyTheme("system", true)}>
            Theo cài đặt hệ thống
          </button>
          <button
            type="button"
            onClick={() => setAmbientMotion(!ambientMotion)}
            aria-pressed={!ambientMotion}
          >
            <Icon name="sparkles" size={17} />
            {ambientMotion ? "Tạm dừng sao băng" : "Bật sao băng"}
          </button>
        </div>
        <div
          id="platform-account"
          ref={accountPanel}
          popover="auto"
          className="platform-popover platform-account"
        >
          <div className="platform-account-head">
            <span className="platform-avatar">
              {initials(user?.fullName || user?.username || "Codjingrank")}
            </span>
            <div>
              <strong>
                {user?.fullName || user?.username || "Codjingrank"}
              </strong>
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
          </nav>

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
            <div
              id="platform-content"
              className="platform-library-content"
              tabIndex={-1}
            >
              {children}
            </div>
          </div>
        ) : (
          <div id="platform-content" tabIndex={-1}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
