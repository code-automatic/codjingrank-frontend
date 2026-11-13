"use client";
import { useEffect, useRef, useState } from "react";
type MotionStatus =
  "poster" | "playing" | "reduced" | "compact" | "hidden" | "blocked" | "error";
export function AuthMotion() {
  const video = useRef<HTMLVideoElement>(null);
  const failed = useRef(false);
  const syncPlayback = useRef<() => void>(() => {});
  const [status, setStatus] = useState<MotionStatus>("poster");
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compact = window.matchMedia("(max-width: 760px)");
    let disposed = false,
      epoch = 0;
    function sync() {
      if (!element) return;
      const run = ++epoch;
      const stop: MotionStatus | null = failed.current
        ? "error"
        : reduced.matches
          ? "reduced"
          : compact.matches
            ? "compact"
            : document.hidden
              ? "hidden"
              : null;
      if (stop) {
        element.pause();
        setStatus(stop);
        return;
      }
      if (!element.getAttribute("src")) element.src = "/media/auth-clock.mp4";
      element.muted = true;
      void element
        .play()
        .then(() => {
          if (!disposed && run === epoch) setStatus("playing");
        })
        .catch(() => {
          if (!disposed && run === epoch) setStatus("blocked");
        });
    }
    function resumeAfterInteraction() {
      if (element?.paused) sync();
    }
    syncPlayback.current = sync;
    sync();
    reduced.addEventListener("change", sync);
    compact.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("pointerdown", resumeAfterInteraction);
    document.addEventListener("keydown", resumeAfterInteraction);
    return () => {
      disposed = true;
      ++epoch;
      element.pause();
      syncPlayback.current = () => {};
      reduced.removeEventListener("change", sync);
      compact.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      document.removeEventListener("pointerdown", resumeAfterInteraction);
      document.removeEventListener("keydown", resumeAfterInteraction);
    };
  }, []);
  return (
    <>
      <div className="auth-media" data-motion={status} aria-hidden="true">
        <video
          ref={video}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/media/auth-clock-poster.jpg"
          onError={() => {
            failed.current = true;
            syncPlayback.current();
          }}
        />
        <div className="auth-media-scrim" />
      </div>
    </>
  );
}
