"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useApiClient } from "@/lib/api/useApiClient";
import { createBrowserDraftStore } from "./draft-store";
import {
  createWorkspaceController,
  type WorkspaceSnapshot,
} from "./workspace";

export type ProblemWorkspaceState = {
  snapshot: WorkspaceSnapshot;
  controller: ReturnType<typeof createWorkspaceController>;
};

export function useProblemWorkspace(slug: string): ProblemWorkspaceState {
  const api = useApiClient();
  const [controller] = useState(() =>
    createWorkspaceController({
      catalog: api.catalog,
      drafts: createBrowserDraftStore(),
    }),
  );
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );

  useEffect(() => {
    void controller.open(slug);
    const flush = () => controller.flushDraft();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      controller.dispose();
    };
  }, [controller, slug]);

  return { snapshot, controller };
}
