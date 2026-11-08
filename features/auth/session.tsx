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
    void s.bootstrap().catch(() => {});
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
