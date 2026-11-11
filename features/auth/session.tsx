"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createTransport } from "@/lib/api/client";
import { createSession } from "./store";
import { clearBrowserDrafts } from "@/features/editor/draft-store";
const C = createContext<ReturnType<typeof createSession> | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [s] = useState(() =>
    createSession(
      createTransport(
        process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:4010",
      ),
    ),
  );
  useEffect(() => {
    let previousUserId = s.getSnapshot().user?.id;
    const unsubscribe = s.subscribe(() => {
      const nextUserId = s.getSnapshot().user?.id;
      if (previousUserId && previousUserId !== nextUserId)
        clearBrowserDrafts(previousUserId);
      previousUserId = nextUserId;
    });
    void s.bootstrap().catch(() => {});
    return () => {
      unsubscribe();
    };
  }, [s]);
  return <C.Provider value={s}>{children}</C.Provider>;
}
export function useSession() {
  const s = useContext(C);
  if (!s) throw Error("Missing SessionProvider");
  return {
    ...useSyncExternalStore(s.subscribe, s.getSnapshot, s.getServerSnapshot),
    store: s,
  };
}
