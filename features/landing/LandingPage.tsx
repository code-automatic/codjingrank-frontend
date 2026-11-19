"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/lib/ui/BrandLogo";
import { Icon } from "@/lib/ui/Icon";
import { useSession } from "@/features/auth/session";
import styles from "./landing.module.css";

const chapters = [
  {
    title: "Viết code trong không gian của bạn",
    description:
      "Đọc đề, đổi ngôn ngữ, lưu nháp. Chạy test mẫu rồi nộp bài ngay trong cùng một workspace.",
    image: "/landing/workspace-current.png",
    alt: "Trang giải bài Sum two numbers của Codjingrank với đề bài, editor và kết quả",
    href: "/problems",
    action: "Khám phá kho bài",
  },
  {
    title: "Hiểu thêm từ mỗi lời giải",
    description:
      "Đọc nhận xét AI theo từng lượt nộp, xem điểm cần cải thiện. Kết quả chấm bài luôn được tính độc lập.",
    image: "/landing/ai-review.png",
    alt: "Màn hình AI review Codjingrank hiển thị nhận xét và mã nguồn",
    href: "/problems",
    action: "Bắt đầu giải bài",
  },
  {
    title: "Cùng nhau gỡ một bài khó",
    description:
      "Đặt câu hỏi, chia sẻ cách làm và trao đổi trong cộng đồng. Một góc nhìn khác có thể mở ra cách giải mới.",
    image: "/landing/community-current.png",
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
  const page = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const ambient = useRef<HTMLDivElement>(null);
  const warmLight = useRef<HTMLSpanElement>(null);
  const signedIn = status === "authenticated";

  useEffect(() => {
    const surface = hero.current;
    const light = ambient.current;
    const warm = warmLight.current;
    if (!surface || !light || !warm) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let previous = 0;
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    let targetX = 0;
    let targetY = 0;
    const paint = () => {
      light.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      warm.style.transform = `translate3d(${-x * 0.65}px, ${y * 0.45}px, 0)`;
    };
    const tick = (time: number) => {
      const dt = Math.min((time - (previous || time - 16)) / 1000, 0.032);
      previous = time;
      vx += ((targetX - x) * 100 - vx * 10) * dt;
      vy += ((targetY - y) * 100 - vy * 10) * dt;
      x += vx * dt;
      y += vy * dt;
      paint();
      if (
        Math.abs(targetX - x) +
          Math.abs(targetY - y) +
          Math.abs(vx) +
          Math.abs(vy) >
        0.1
      ) {
        frame = requestAnimationFrame(tick);
      } else {
        x = targetX;
        y = targetY;
        paint();
        frame = 0;
        previous = 0;
      }
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = previous = x = y = vx = vy = targetX = targetY = 0;
      paint();
    };
    const reset = () => {
      targetX = targetY = 0;
      if (motion.matches || !pointer.matches || document.hidden) stop();
      else start();
    };
    const move = (event: PointerEvent) => {
      if (motion.matches || !pointer.matches || event.pointerType !== "mouse")
        return;
      const bounds = surface.getBoundingClientRect();
      targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 300;
      targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 170;
      start();
    };
    surface.addEventListener("pointermove", move, { passive: true });
    surface.addEventListener("pointerleave", reset);
    motion.addEventListener("change", reset);
    pointer.addEventListener("change", reset);
    document.addEventListener("visibilitychange", stop);
    window.addEventListener("blur", stop);
    return () => {
      stop();
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", reset);
      motion.removeEventListener("change", reset);
      pointer.removeEventListener("change", reset);
      document.removeEventListener("visibilitychange", stop);
      window.removeEventListener("blur", stop);
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
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    root
      .querySelectorAll("[data-reveal]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.page} ref={page}>
      <a className={styles.skip} href="#landing-main">
        Chuyển đến nội dung
      </a>
      <header
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
          <div
            ref={ambient}
            className={styles.heroAmbient}
            aria-hidden="true"
          />
          <span
            ref={warmLight}
            className={styles.heroWarm}
            aria-hidden="true"
          />
          <div className={`${styles.wrap} wrap`}>
            <div className={styles.heroCopy}>
              <h1 id="landing-title">
                Mỗi bài giải,
                <br />
                một <span>bước tiến.</span>
              </h1>
              <p>
                Luyện giải với Python, C++ và Java.
                <br className={styles.desktopBreak} /> Đọc đề, chạy test mẫu và
                theo dõi từng bài nộp.
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
            <div className={styles.heroStage}>
              <div className={styles.screenBar}>
                <span>
                  <BrandLogo compact />
                  Workspace của bạn
                </span>
                <span className={styles.demoLabel}>
                  Ảnh giao diện · dữ liệu demo
                </span>
              </div>
              <Image
                src="/landing/workspace-current.png"
                width={2880}
                height={1800}
                alt="Workspace Codjingrank: đọc đề ở bên trái, viết code và xem kết quả ở bên phải"
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
                className={styles.heroScreen}
              />
            </div>
            <div className={styles.heroFoot}>
              <span>Đọc đề. Viết code. Chạy mẫu. Nộp bài.</span>
              <a
                href="#khong-gian"
                aria-label="Cuộn tới phần không gian luyện tập"
              >
                <span>Khám phá tiếp</span>
                <Icon name="collapse" />
              </a>
            </div>
          </div>
        </section>

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
                  hidden={active !== index}
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
          id="lo-trinh"
          className={styles.journey}
          aria-labelledby="journey-title"
          data-reveal
        >
          <div className={`${styles.wrap} wrap`}>
            <div className={styles.sectionTop}>
              <h2 id="journey-title">
                Có lộ trình.
                <br />
                <span>Có bước tiếp theo.</span>
              </h2>
              <div>
                <p>
                  Chọn gói bài theo chủ đề, luyện qua từng cấp độ và theo dõi
                  tiến độ. Mỗi bài hoàn thành giúp bạn nhìn rõ mình đã đi đến
                  đâu.
                </p>
                <Link className={styles.textLink} href="/packages">
                  Khám phá gói bài tập
                  <Icon name="arrowUpRight" />
                </Link>
              </div>
            </div>
            <ol className={styles.steps}>
              <li>
                <span className={styles.stepNumber}>01</span>
                <h3>Tạo tài khoản</h3>
                <p>Một nơi lưu tiến độ và bản nháp của bạn.</p>
                <Link href="/register">
                  Đăng ký
                  <Icon name="arrowUpRight" />
                </Link>
              </li>
              <li>
                <span className={styles.stepNumber}>02</span>
                <h3>Chọn một bài</h3>
                <p>Tìm chủ đề phù hợp, bắt đầu từ cấp đang mở.</p>
                <Link href="/problems">
                  Tìm bài tập
                  <Icon name="arrowUpRight" />
                </Link>
              </li>
              <li>
                <span className={styles.stepNumber}>03</span>
                <h3>Thử cách giải</h3>
                <p>Viết code, chạy mẫu, nộp và đọc kết quả.</p>
                <Link href="/problems/sum-two">
                  Mở bài mẫu
                  <Icon name="arrowUpRight" />
                </Link>
              </li>
              <li>
                <span className={styles.stepNumber}>04</span>
                <h3>Nhìn lại tiến bộ</h3>
                <p>Xem bài đã giải và vị trí trên bảng xếp hạng.</p>
                <Link href="/leaderboard">
                  Xem thứ hạng
                  <Icon name="arrowUpRight" />
                </Link>
              </li>
            </ol>
            <div className={styles.journeyStatement}>
              <span>Một bài hôm nay.</span>
              <span>Một cách nghĩ mới ngày mai.</span>
              <Icon name="code" size={44} />
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
                src="/landing/community-current.png"
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

        <section
          className={styles.close}
          aria-labelledby="close-title"
          data-reveal
        >
          <div className={`${styles.wrap} wrap`}>
            <h2 id="close-title">
              Lời giải tiếp theo
              <br />
              bắt đầu từ <span>bạn.</span>
            </h2>
            <Link
              className={styles.darkButton}
              href={signedIn ? "/problems" : "/register"}
            >
              Bắt đầu luyện tập
              <Icon name="arrowUpRight" />
            </Link>
          </div>
        </section>
      </main>
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
          <nav aria-label="Liên kết cuối trang">
            <Link href="/packages">Gói bài tập</Link>
            <Link href="/problems">Kho bài tập</Link>
            <Link href="/leaderboard">Bảng xếp hạng</Link>
            <Link href="/forum">Cộng đồng</Link>
            <Link href="/login">Đăng nhập</Link>
          </nav>
          <div className={styles.footerBottom}>
            <span>© {new Date().getFullYear()} Codjingrank</span>
            <a
              href="https://unsplash.com/photos/brown-house-near-body-of-water-zAjdgNXsMeg"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ảnh phong cảnh: Luca Bravo / Unsplash
              <Icon name="arrowUpRight" size={13} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
