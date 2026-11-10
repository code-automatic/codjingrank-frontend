"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { useSession } from "@/features/auth/session";
import { ProblemWorkspace } from "./ProblemWorkspace";

export function ProblemWorkspacePage({ slug }: { slug: string }) {
  const router = useRouter();
  const { status, user } = useSession();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status === "initializing") {
    return (
      <main className="workspace-main">
        <SessionNotice />
      </main>
    );
  }

  if (status !== "authenticated") {
    return (
      <main className="workspace-main">
        <SessionNotice />
        <p className="muted">Cần đăng nhập để mở bài tập.</p>
      </main>
    );
  }

  return <ProblemWorkspace key={`${user?.id}:${slug}`} slug={slug} />;
}
