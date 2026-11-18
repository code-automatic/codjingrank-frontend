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
      data-tone={
        Array.from(entry.userId).reduce((sum, c) => sum + c.charCodeAt(0), 0) %
        5
      }
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
        <span>
          {Array.from(
            entry.username.replace(/^demo_/, ""),
          )[0]?.toLocaleUpperCase("vi-VN")}
        </span>
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
  return (
    <span className={styles.artworkStage} data-pair={pair} aria-hidden="true">
      <span className={styles.artworkOrbit} />
      <span className={styles.artworkShadow} />
      <span className={styles.artworkCube}>
        <span className={styles.cubeFront} />
        <span className={styles.cubeRight} />
        <span className={styles.cubeTop} />
        <span className={styles.cubeCore} />
      </span>
      {pair && (
        <span className={`${styles.artworkCube} ${styles.cubeCompanion}`}>
          <span className={styles.cubeFront} />
          <span className={styles.cubeRight} />
          <span className={styles.cubeTop} />
          <span className={styles.cubeCore} />
        </span>
      )}
    </span>
  );
}
