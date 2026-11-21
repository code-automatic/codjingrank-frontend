"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { SlashAtmosphere } from "./SlashAtmosphere";
import { playAuthSlash } from "./auth-transition-sound";
import styles from "./AuthTransition.module.css";

const seam =
  "1000,0 935,72 900,94 867,142 820,167 778,224 739,249 704,304 656,326 620,385 578,408 545,458 500,491 469,546 417,571 383,627 340,650 301,702 255,727 218,783 172,808 136,861 89,892 56,947 0,1000";

export function AuthTransition({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "cover" | "opening">("idle");
  const pending = useRef<{ href: string; path: string; sent: boolean } | null>(
    null,
  );
  const navigation = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sound = useRef<(() => void) | undefined>(undefined);
  const overflow = useRef("");
  const navigate = useCallback(() => {
    if (!pending.current || pending.current.sent) return;
    pending.current.sent = true;
    router.push(pending.current.href);
  }, [router]);
  const finish = useCallback(() => {
    clearTimeout(navigation.current);
    clearTimeout(timeout.current);
    sound.current?.();
    document.body.style.overflow = overflow.current;
    const arrived = pending.current?.path === window.location.pathname;
    pending.current = null;
    setPhase("idle");
    if (arrived)
      requestAnimationFrame(() => {
        if (!pending.current)
          document
            .querySelector<HTMLInputElement>("main input:not([disabled])")
            ?.focus({ preventScroll: true });
      });
  }, []);

  useEffect(() => {
    if (!pending.current || path !== pending.current.path) return;
    const frame = requestAnimationFrame(() => setPhase("opening"));
    return () => cancelAnimationFrame(frame);
  }, [path]);

  useEffect(() => {
    const skip = (event: KeyboardEvent) => {
      if (event.key === "Escape" && pending.current) {
        navigate();
        finish();
      }
    };
    const hide = () => {
      if (document.hidden && pending.current) {
        navigate();
        finish();
      }
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => {
      if (reduced.matches && pending.current) {
        navigate();
        finish();
      }
    };
    const back = () => {
      if (pending.current) finish();
    };
    reduced.addEventListener("change", reduce);
    window.addEventListener("popstate", back);
    document.addEventListener("keydown", skip);
    document.addEventListener("visibilitychange", hide);
    return () => {
      reduced.removeEventListener("change", reduce);
      window.removeEventListener("popstate", back);
      document.removeEventListener("keydown", skip);
      document.removeEventListener("visibilitychange", hide);
      clearTimeout(navigation.current);
      clearTimeout(timeout.current);
      sound.current?.();
      if (pending.current) document.body.style.overflow = overflow.current;
    };
  }, [finish, navigate]);

  const intercept = (event: MouseEvent<HTMLDivElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const anchor = (event.target as Element).closest<HTMLAnchorElement>(
      "a[href]",
    );
    if (
      !anchor ||
      anchor.hasAttribute("download") ||
      (anchor.target && anchor.target !== "_self")
    )
      return;
    const target = new URL(anchor.href, window.location.href);
    if (
      target.origin !== window.location.origin ||
      !/^\/(login|register)\/?$/.test(target.pathname) ||
      /^\/(login|register|forgot-password|reset-password)\/?$/.test(path) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    event.preventDefault();
    if (pending.current) return;
    pending.current = {
      href: target.pathname + target.search + target.hash,
      path: target.pathname.replace(/\/$/, ""),
      sent: false,
    };
    overflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setPhase("cover");
    sound.current = playAuthSlash();
    navigation.current = setTimeout(navigate, 160);
    timeout.current = setTimeout(() => {
      navigate();
      finish();
    }, 3200);
  };

  return (
    <>
      <div
        className={styles.content}
        onClickCapture={intercept}
        inert={phase !== "idle" ? true : undefined}
      >
        {children}
      </div>
      <div
        className={styles.overlay}
        hidden={phase === "idle"}
        data-auth-transition={phase !== "idle" ? "" : undefined}
        data-phase={phase}
        aria-hidden="true"
      >
        <svg
          className={styles.upper}
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
        >
          <polygon points={`0,0 ${seam}`} />
          <polyline className={styles.edge} points={seam} />
          <polyline className={styles.light} points={seam} />
        </svg>
        <svg
          className={styles.lower}
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) finish();
          }}
        >
          <polygon points={`${seam} 1000,1000`} />
          <polyline className={styles.edge} points={seam} />
          <polyline className={styles.light} points={seam} />
        </svg>
        <span className={styles.sheen} />
        <SlashAtmosphere phase={phase} />
      </div>
    </>
  );
}
