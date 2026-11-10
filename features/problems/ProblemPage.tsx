"use client";

import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/session";
import { SessionNotice } from "@/features/auth/SessionNotice";
import { useApiClient } from "@/lib/api/useApiClient";
import { createProblemResource } from "./resource";
import { ProblemContent } from "./ProblemContent";

function AuthenticatedProblem({ slug }: { slug: string }) {
  const api = useApiClient();
  const resource = useMemo(() => createProblemResource(api, slug), [api, slug]);
  const state = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getServerSnapshot,
  );
  useEffect(() => {
    void resource.load();
    return resource.cancel;
  }, [resource]);
  return (
    <ProblemContent
      state={state}
      reload={() => void resource.load()}
      selectLanguage={(id) => void resource.selectLanguage(id)}
    />
  );
}

export function ProblemPage({ slug }: { slug: string }) {
  const { status, user } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);
  return (
    <main className="problem-page">
      <nav aria-label="Điều hướng bài tập">
        <Link href="/protected">← Tài khoản</Link>
      </nav>
      <SessionNotice />
      {status === "authenticated" && user && (
        <AuthenticatedProblem key={`${user.id}:${slug}`} slug={slug} />
      )}
    </main>
  );
}
