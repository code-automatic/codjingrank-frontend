import { createTransport, type Requester } from "@/lib/api/client";
import type { UserModel } from "@/lib/api/adapters/shared";
import { createAccountClient } from "@/lib/api/domains/account";
import { createCatalogClient } from "@/lib/api/domains/catalog";
import { createCommunityClient } from "@/lib/api/domains/community";
import { createJudgeClient } from "@/lib/api/domains/judge";

export * from "@/lib/api/client";
export * from "@/lib/api/guards";
export * from "@/lib/api/types";
export * from "@/lib/api/adapters/shared";
export * from "@/lib/api/adapters/catalog";
export * from "@/lib/api/adapters/judge";
export * from "@/lib/api/adapters/community";
export {
  assertChangePasswordPayload,
  assertCommentCreatePayload,
  assertCommentPatchPayload,
  assertExecutePayload,
  assertForgotPasswordPayload,
  assertPostCreatePayload,
  assertPostPatchPayload,
  assertProfilePatchPayload,
  assertResetPasswordPayload,
  assertSlugParam,
  assertUuidParam,
  MAX_COMMENT_CHARS,
  MAX_EXECUTE_CODE_BYTES,
  MAX_POST_CODE_SNIPPET_BYTES,
  MAX_POST_CONTENT_CHARS,
  MAX_POST_TITLE_CHARS,
} from "@/lib/api/domains/preflight";

export type ApiClientDeps = {
  authRequest: Requester;
  publicRequest: Requester;
  isAuthenticated?: () => boolean;
  onUserUpdated?: (user: UserModel) => void;
};

export function createApiClient(deps: ApiClientDeps) {
  const isAuthenticated = deps.isAuthenticated ?? (() => true);
  const optionalRequest: Requester = <T>(path: string, init?: RequestInit) =>
    isAuthenticated()
      ? deps.authRequest<T>(path, init)
      : deps.publicRequest<T>(path, init);

  return {
    catalog: createCatalogClient({
      authRequest: deps.authRequest,
      publicRequest: deps.publicRequest,
    }),
    judge: createJudgeClient({
      authRequest: deps.authRequest,
    }),
    community: createCommunityClient({
      authRequest: deps.authRequest,
      publicRequest: deps.publicRequest,
      optionalRequest,
    }),
    account: createAccountClient({
      authRequest: deps.authRequest,
      publicRequest: deps.publicRequest,
      onUserUpdated: deps.onUserUpdated,
    }),
  };
}

export function createStandaloneApiClient(
  gatewayOrigin: string,
  fetcher: typeof fetch = fetch,
  getToken?: () => string | undefined,
  onUserUpdated?: (user: UserModel) => void,
) {
  const send = createTransport(gatewayOrigin, fetcher);
  const authRequest: Requester = <T>(path: string, init?: RequestInit) =>
    send<T>(path, init, getToken?.());
  return createApiClient({
    authRequest,
    publicRequest: <T>(path: string, init?: RequestInit) => send<T>(path, init),
    isAuthenticated: () => Boolean(getToken?.()),
    onUserUpdated,
  });
}

export type ApiClient = ReturnType<typeof createApiClient>;
