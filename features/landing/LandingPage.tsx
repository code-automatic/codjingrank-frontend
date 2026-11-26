"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/lib/ui/BrandLogo";
import { Icon } from "@/lib/ui/Icon";
import { useSession } from "@/features/auth/session";
import styles from "./landing.module.css";
import { HeroWave } from "./HeroWave";
import { LearningJourney } from "./LearningJourney";

const chapters = [
  {
    title: "Viết code trong không gian của bạn",
    description:
      "Đọc đề, đổi ngôn ngữ, lưu nháp. Chạy test mẫu rồi nộp bài ngay trong cùng một workspace.",
    image: "/landing/workspace-current-0c9496a30d.png",
    alt: "Trang giải bài Sum two numbers của Codjingrank với đề bài, editor và kết quả",
    href: "/problems",
    action: "Khám phá kho bài",
  },
  {
    title: "Theo dõi từng bước tiến",
    description:
      "Chọn gói bài theo chủ đề, theo dõi số bài đã giải và luyện tập qua từng cấp độ.",
    image: "/landing/roadmap-current-ecdb1ccbc4.png",
    alt: "Lộ trình Codjingrank với gói Arrays và tiến độ bài đã giải",
    href: "/packages",
    action: "Khám phá lộ trình",
  },
  {
    title: "Cùng nhau gỡ một bài khó",
    description:
      "Đặt câu hỏi, chia sẻ cách làm và trao đổi trong cộng đồng. Một góc nhìn khác có thể mở ra cách giải mới.",
    image: "/landing/community-current-fd373b4629.png",
    alt: "Trang cộng đồng Codjingrank với danh sách thảo luận",
    href: "/forum",
    action: "Ghé thăm cộng đồng",
  },
] as const;

export function LandingPage() {
  const { status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pointerChange, setPointerChange] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const signedIn = status === "authenticated";

  useEffect(() => {
    const element = header.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      const scrolled = String(window.scrollY > 24);
      if (element.dataset.scrolled !== scrolled)
        element.dataset.scrolled = scrolled;
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const root = page.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
          } else {
            entry.target.setAttribute("data-revealed", "false");
          }
        }
      },
      { threshold: 0, rootMargin: "-8% 0px -8% 0px" },
    );
    root
      .querySelectorAll("[data-reveal]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={styles.page}
      ref={page}
      onClick={(event) => {
        if (
          !event.detail ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        const anchor = (event.target as Element).closest<HTMLAnchorElement>(
          'a[href^="#"]',
        );
        const id = anchor?.getAttribute("href")?.slice(1);
        const target = id ? document.getElementById(id) : null;
        if (!anchor || !target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(window.history.state, "", anchor.hash);
      }}
    >
      <a className={styles.skip} href="#landing-main">
        Chuyển đến nội dung
      </a>
      <header
        ref={header}
        className={styles.header}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuButton.current?.focus();
          }
        }}
      >
        <div className={styles.navWrap}>
          <Link
            href="/"
            className={styles.brand}
            aria-label="Codjingrank — trang chủ"
          >
            <BrandLogo />
          </Link>
          <button
            ref={menuButton}
            className={styles.menuButton}
            type="button"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
            aria-controls="landing-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path
                d={
                  menuOpen ? "m6 6 12 12M6 18 18 6" : "M4 7h16M4 12h16M4 17h16"
                }
              />
            </svg>
          </button>
          <nav
            id="landing-navigation"
            className={styles.navigation}
            data-open={menuOpen}
            aria-label="Điều hướng trang giới thiệu"
            onClick={() => setMenuOpen(false)}
          >
            <a href="#khong-gian">Không gian luyện tập</a>
            <a href="#lo-trinh">Lộ trình</a>
            <a href="#cong-dong">Cộng đồng</a>
            <div className={styles.navActions}>
              <Link href={signedIn ? "/protected" : "/login"}>
                {signedIn ? "Tài khoản" : "Đăng nhập"}
              </Link>
              <Link
                className={styles.primary}
                href={signedIn ? "/problems" : "/register"}
              >
                Bắt đầu luyện tập
                <Icon name="arrowUpRight" />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main id="landing-main">
        <section
          ref={hero}
          className={styles.hero}
          aria-labelledby="landing-title"
          data-enter
        >
          <HeroWave />
          <div className={styles.heroBubbles} aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => (
              <i
                key={index}
                style={{
                  left: `${8 + index * 7.5}%`,
                  width: `${8 + (index % 4) * 5}px`,
                  height: `${8 + (index % 4) * 5}px`,
                  animationDelay: `${index * -0.73}s`,
                  animationDuration: `${6 + (index % 3)}s`,
                }}
              />
            ))}
          </div>
          <div className={`${styles.wrap} wrap`}>
            <div className={styles.heroCopy}>
              <h1 id="landing-title">
                Khơi mở tư duy,
                <br />
                <span className={styles.heroSerif}>
                  vươn <span>xa cùng code.</span>
                </span>
              </h1>
              <p>
                Nhiều ngôn ngữ. Muôn cách giải. Một tư duy không giới hạn.
                <br className={styles.desktopBreak} /> Chọn ngôn ngữ bạn yêu
                thích, biến từng thử thách thành bước tiến.
              </p>
              <div className={styles.actions}>
                <Link
                  className={styles.primary}
                  href={signedIn ? "/problems" : "/register"}
                >
                  Bắt đầu luyện tập
                  <Icon name="arrowUpRight" />
                </Link>
                <a className={styles.secondary} href="#khong-gian">
                  Khám phá Codjingrank
                  <Icon name="arrowUpRight" />
                </a>
              </div>
            </div>
          </div>
          <div className={styles.heroFoot}>
            <span>Đọc đề. Viết code. Chạy mẫu. Nộp bài.</span>
            <a href="#lo-trinh" aria-label="Cuộn tới lộ trình luyện tập">
              <span>Khám phá tiếp</span>
              <Icon name="collapse" />
            </a>
          </div>
        </section>

        <LearningJourney />

        <section
          id="khong-gian"
          className={styles.explore}
          aria-labelledby="explore-title"
          data-reveal
        >
          <div className={`${styles.wrap} ${styles.exploreGrid} wrap`}>
            <div className={styles.chapterCopy}>
              <h2 id="explore-title">
                Tập trung vào
                <br />
                cách bạn <span>giải bài.</span>
              </h2>
              <div
                className={styles.tabs}
                role="tablist"
                aria-label="Khám phá tính năng"
                aria-orientation="vertical"
              >
                {chapters.map((chapter, index) => (
                  <button
                    type="button"
                    role="tab"
                    id={`landing-tab-${index}`}
                    aria-selected={active === index}
                    aria-controls={`landing-panel-${index}`}
                    tabIndex={active === index ? 0 : -1}
                    className={styles.chapter}
                    key={chapter.title}
                    onClick={(event) => {
                      setPointerChange(event.detail > 0);
                      setActive(index);
                    }}
                    onKeyDown={(event) => {
                      if (
                        !["ArrowDown", "ArrowUp", "Home", "End"].includes(
                          event.key,
                        )
                      )
                        return;
                      event.preventDefault();
                      const next =
                        event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? 2
                            : (index + (event.key === "ArrowDown" ? 1 : 2)) % 3;
                      setPointerChange(false);
                      setActive(next);
                      document.getElementById(`landing-tab-${next}`)?.focus();
                    }}
                  >
                    <span className={styles.chapterArrow}>
                      <Icon name="arrowUpRight" />
                    </span>
                    <span>
                      <strong>{chapter.title}</strong>
                      <span>{chapter.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.chapterStage}>
              <Image
                src="/landing/landscape.jpg"
                alt=""
                fill
                sizes="(max-width: 768px) 150vw, 1100px"
                className={styles.landscape}
              />
              <span className={styles.stageDemo}>
                Giao diện Codjingrank · dữ liệu demo
              </span>
              {chapters.map((chapter, index) => (
                <div
                  key={chapter.title}
                  id={`landing-panel-${index}`}
                  role="tabpanel"
                  aria-labelledby={`landing-tab-${index}`}
                  aria-hidden={active !== index}
                  inert={active !== index}
                  data-active={active === index}
                  className={styles.chapterPanel}
                  data-pointer={pointerChange}
                  tabIndex={0}
                >
                  <Image
                    src={chapter.image}
                    width={1440}
                    height={800}
                    alt={chapter.alt}
                    sizes="(max-width: 768px) 90vw, 600px"
                  />
                  <Link href={chapter.href} className={styles.primary}>
                    {chapter.action}
                    <Icon name="arrowUpRight" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="cong-dong"
          className={styles.community}
          aria-labelledby="community-title"
          data-reveal
        >
          <div className={`${styles.wrap} ${styles.communityGrid} wrap`}>
            <div className={styles.communityVisual}>
              <span className={styles.stageDemo}>
                Cộng đồng · nội dung demo
              </span>
              <Image
                src="/landing/community-current-fd373b4629.png"
                width={1440}
                height={900}
                alt="Giao diện thảo luận cộng đồng Codjingrank"
                sizes="(max-width: 768px) 100vw, 700px"
              />
            </div>
            <div>
              <h2 id="community-title">
                Bài khó.
                <br />
                <span>Có người cùng nghĩ.</span>
              </h2>
              <p>
                Một câu hỏi đúng lúc. Một lời giải theo hướng khác. Chia sẻ điều
                bạn học được và tìm thêm góc nhìn từ cộng đồng.
              </p>
              <Link className={styles.primary} href="/forum">
                Khám phá cộng đồng
                <Icon name="arrowUpRight" />
              </Link>
              <p className={styles.communityNote}>
                Đọc thảo luận công khai. Đăng nhập để viết bài, bình luận và
                tương tác.
              </p>
            </div>
          </div>
        </section>
      </main>
      <div className={styles.scenicEnd}>
        <Image
          src="/landing/ocean-waves.jpg"
          alt=""
          fill
          sizes="100vw"
          className={styles.footerOcean}
        />
        <section
          className={styles.close}
          aria-labelledby="close-title"
          data-reveal
        >
          <div className={`${styles.wrap} wrap`}>
            <div className={styles.closeStart}>
              <h2 id="close-title">
                Lời giải tiếp theo
                <br />
                bắt đầu từ bạn.
              </h2>
              <Link
                className={styles.darkButton}
                href={signedIn ? "/problems" : "/register"}
              >
                Bắt đầu luyện tập
                <Icon name="arrowUpRight" />
              </Link>
            </div>
            <div className={styles.closeCommunity}>
              <h3>Cùng nhau tiến bộ.</h3>
              <p className={styles.closeDescription}>
                Chia sẻ cách giải. Khám phá góc nhìn mới cùng cộng đồng
                Codjingrank.
              </p>
              <Link className={styles.secondary} href="/forum">
                Ghé thăm cộng đồng
                <Icon name="arrowUpRight" />
              </Link>
            </div>
          </div>
        </section>
        <footer className={styles.footer}>
          <div className={`${styles.wrap} wrap`}>
            <div className={styles.footerTop}>
              <Link
                href="/"
                className={styles.brand}
                aria-label="Codjingrank — trang chủ"
              >
                <BrandLogo />
              </Link>
              <p>Đọc đề, viết code, tiến bộ từng ngày.</p>
            </div>
            <nav
              aria-label="Liên kết cuối trang"
              className={styles.footerColumns}
            >
              <div>
                <h3>Luyện tập</h3>
                <Link href="/problems">Kho bài tập</Link>
                <Link href="/packages">Lộ trình học</Link>
                <Link href="/leaderboard">Bảng xếp hạng</Link>
              </div>
              <div>
                <h3>Cùng tiến bộ</h3>
                <Link href="/forum">Cộng đồng</Link>
                <Link href="/forum?postType=question">Hỏi đáp</Link>
                <Link href="/forum?postType=solution">Chia sẻ lời giải</Link>
              </div>
              <div>
                <h3>Bắt đầu</h3>
                <Link href="/register">Tạo tài khoản</Link>
                <Link href="/login">Đăng nhập</Link>
                <Link href="/#khong-gian">Khám phá Codjingrank</Link>
              </div>
            </nav>
            <div className={styles.footerBottom}>
              <span>© {new Date().getFullYear()} Codjingrank</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
