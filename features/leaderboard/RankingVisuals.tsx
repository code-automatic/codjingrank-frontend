"use client";

import Image from "next/image";
import { useState } from "react";
import type { LeaderboardEntryModel } from "@/lib/api/adapters/shared";
import styles from "./leaderboard.module.css";

export function RankingAvatar({
  entry,
  large = false,
}: {
  entry: LeaderboardEntryModel;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const source =
    entry.avatarUrl && /^https?:\/\//i.test(entry.avatarUrl)
      ? entry.avatarUrl
      : null;
  return (
    <span
      className={`${styles.avatar} ${large ? styles.avatarLarge : ""}`}
      aria-hidden="true"
    >
      {source && !failed ? (
        <Image
          src={source}
          width={large ? 64 : 30}
          height={large ? 64 : 30}
          alt=""
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{Array.from(entry.username)[0]?.toLocaleUpperCase("vi-VN")}</span>
      )}
    </span>
  );
}

export function RankingTrophy() {
  return (
    <div className={styles.trophy} aria-hidden="true">
      <svg viewBox="0 0 200 190" fill="none" focusable="false">
        <defs>
          <linearGradient
            id="ranking-gold"
            x1="54"
            y1="32"
            x2="148"
            y2="133"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--ctp-yellow)" />
            <stop offset="0.4" stopColor="var(--ctp-rosewater)" />
            <stop offset="0.62" stopColor="var(--ctp-yellow)" />
            <stop offset="1" stopColor="var(--ctp-peach)" />
          </linearGradient>
          <linearGradient
            id="ranking-stem"
            x1="76"
            y1="136"
            x2="128"
            y2="166"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--ctp-peach)" />
            <stop offset="0.5" stopColor="var(--ctp-yellow)" />
            <stop offset="1" stopColor="var(--ctp-peach)" />
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="175" rx="57" ry="7" fill="var(--ui-shadow)" />
        <path
          d="M53 46H40c-20 0-14 45 26 58M147 46h13c20 0 14 45-26 58"
          stroke="var(--ctp-peach)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M53 45H41c-16 0-11 35 22 49M147 45h12c16 0 11 35-22 49"
          stroke="var(--ctp-yellow)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M49 31h102l-8 58c-3 23-22 42-43 48-21-6-40-25-43-48z"
          fill="url(#ranking-gold)"
        />
        <path
          d="M59 37l6 49c3 18 13 31 25 38"
          stroke="var(--ctp-rosewater)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M94 134h12v17c0 9 12 9 19 14H75c7-5 19-5 19-14z"
          fill="url(#ranking-stem)"
        />
        <rect
          x="70"
          y="162"
          width="60"
          height="9"
          rx="4.5"
          fill="url(#ranking-gold)"
        />
        <ellipse cx="100" cy="31" rx="52" ry="6" fill="var(--ctp-yellow)" />
        <ellipse
          cx="100"
          cy="31"
          rx="46"
          ry="3"
          fill="var(--ctp-peach)"
          opacity="0.45"
        />
      </svg>
      <Image
        src="/brand/codjingrank-mark.png"
        width={36}
        height={36}
        alt=""
        unoptimized
        className={styles.trophyMark}
      />
    </div>
  );
}

export function PracticeArtwork({ pair = false }: { pair?: boolean }) {
  const prefix = pair ? "practice-pair" : "practice-single";
  const cube = (
    <>
      <path d="m180 20 48 28-48 28-48-28z" fill={`url(#${prefix}-top)`} />
      <path d="m132 48 48 28v57l-48-28z" fill={`url(#${prefix}-left)`} />
      <path d="m180 76 48-28v57l-48 28z" fill={`url(#${prefix}-right)`} />
      <path
        d="m180 20 48 28v57l-48 28-48-28V48zm-48 28 48 28 48-28m-48 28v57"
        stroke="var(--card-cube-edge)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m180 26 41 24v51l-41 24-41-24V52l41 24"
        stroke="var(--ctp-base)"
        strokeOpacity="0.6"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="m180 31 34 20-34 20-34-20z"
        fill="var(--ctp-base)"
        fillOpacity="0.16"
      />
      <path
        d="M180 80v43m6-45 36-21"
        stroke="var(--ctp-base)"
        strokeWidth="1"
        strokeOpacity="0.65"
      />
    </>
  );
  return (
    <svg
      viewBox="0 0 360 150"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={styles.practiceArt}
    >
      <defs>
        <linearGradient
          id={`${prefix}-top`}
          x1="132"
          y1="20"
          x2="228"
          y2="76"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--ctp-base)" stopOpacity="0.75" />
          <stop
            offset="1"
            stopColor="var(--card-cube-face)"
            stopOpacity="0.2"
          />
        </linearGradient>
        <linearGradient
          id={`${prefix}-left`}
          x1="132"
          y1="48"
          x2="180"
          y2="133"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--ctp-base)" stopOpacity="0.55" />
          <stop
            offset="1"
            stopColor="var(--card-cube-face)"
            stopOpacity="0.85"
          />
        </linearGradient>
        <linearGradient
          id={`${prefix}-right`}
          x1="180"
          y1="76"
          x2="228"
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--card-cube-face)" stopOpacity="0.3" />
          <stop offset="1" stopColor="var(--ctp-base)" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      <ellipse cx="180" cy="133" rx="66" ry="8" fill="var(--ui-shadow)" />
      <g transform={pair ? "translate(-30 0)" : undefined}>{cube}</g>
      {pair && <g transform="translate(55 32) scale(0.72)">{cube}</g>}
    </svg>
  );
}
