"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useApiClient } from "@/lib/api/useApiClient";
import { useSession } from "@/features/auth/session";
import { clearBrowserDrafts, createBrowserDraftStore } from "./draft-store";
import { createWorkspaceController, type WorkspaceSnapshot } from "./workspace";

export type ProblemWorkspaceState = {
  snapshot: WorkspaceSnapshot;
  controller: ReturnType<typeof createWorkspaceController>;
};

export function useProblemWorkspace(slug: string): ProblemWorkspaceState {
  const api = useApiClient();
  const { user, store } = useSession();
  const userId = user!.id;
  const [controller] = useState(() =>
    createWorkspaceController({
      catalog: api.catalog,
      drafts: createBrowserDraftStore(userId),
    }),
  );
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const session = store.getSnapshot();
      if (session.status !== "authenticated" || session.user?.id !== userId) {
        controller.dispose(false);
        clearBrowserDrafts(userId);
      }
    });
    void controller.open(slug);
    const flush = () => controller.flushDraft();
    window.addEventListener("pagehide", flush);
    return () => {
      unsubscribe();
      window.removeEventListener("pagehide", flush);
      controller.dispose();
    };
  }, [controller, slug, store, userId]);

  return { snapshot, controller };
}
