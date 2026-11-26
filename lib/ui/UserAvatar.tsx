"use client";

import Image from "next/image";
import { useState } from "react";
import { initials } from "@/features/forum/presentation";

export function avatarSource(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function UserAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = avatarSource(avatarUrl);
  return (
    <span data-user-avatar="" aria-hidden="true">
      {source && failedSource !== source ? (
        <Image
          src={source}
          alt=""
          width={96}
          height={96}
          unoptimized
          referrerPolicy="no-referrer"
          onError={() => setFailedSource(source)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
