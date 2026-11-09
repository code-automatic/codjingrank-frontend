"use client";
import { useMemo } from "react";
import { useSession } from "@/features/auth/session";
import { createTransport } from "@/lib/api/client";
import { createApiClient, type ApiClient } from "@/lib/api/index";

const DEFAULT_GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:4010";

export function useApiClient(): ApiClient {
  const { store } = useSession();

  return useMemo(() => {
    const publicSend = createTransport(DEFAULT_GATEWAY_URL);
    return createApiClient({
      authRequest: store.request,
      publicRequest: <T>(path: string, init?: RequestInit) =>
        publicSend<T>(path, init),
      isAuthenticated: () => store.getSnapshot().status === "authenticated",
    });
  }, [store]);
}
