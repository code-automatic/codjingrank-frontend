"use client";
import { useEffect, useRef } from "react";
export function AuthMotion() {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = matchMedia("(max-width: 760px)");
    const sync = () => {
      if (reduced.matches || compact.matches || document.hidden) {
        element.pause();
        return;
      }
      if (!element.getAttribute("src")) element.src = "/media/auth-workspace-teal.mp4";
      void element.play().catch(() => {});
    };
    sync();
    reduced.addEventListener("change", sync);
    compact.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("pointerdown", sync);
    return () => {
      element.pause();
      reduced.removeEventListener("change", sync);
      compact.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      document.removeEventListener("pointerdown", sync);
    };
  }, []);
  return <div className="auth-cinematic-media" aria-hidden="true"><video ref={video} autoPlay muted loop playsInline preload="none" poster="/media/auth-workspace-teal.jpg" /><div className="auth-cinematic-shade" /></div>;
}
