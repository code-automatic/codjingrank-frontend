import { adaptUserData, type UserModel } from "@/lib/api/adapters/community";
import type { RequestOptions, Requester } from "@/lib/api/client";
import {
  assertChangePasswordPayload,
  assertForgotPasswordPayload,
  assertProfilePatchPayload,
  assertResetPasswordPayload,
} from "@/lib/api/domains/preflight";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ProfilePatchRequest,
  ResetPasswordRequest,
} from "@/lib/api/types";

function toRequestInit(
  options?: RequestOptions,
  extra?: RequestInit,
): RequestInit {
  return {
    ...extra,
    ...(options?.signal ? { signal: options.signal } : {}),
    ...(options?.headers ? { headers: options.headers } : {}),
  };
}

export function createAccountClient(deps: {
  authRequest: Requester;
  publicRequest: Requester;
  onUserUpdated?: (user: UserModel) => void;
}) {
  return {
    async getMe(options?: RequestOptions): Promise<UserModel> {
      const raw = await deps.authRequest<unknown>(
        "/api/v1/users/me",
        toRequestInit(options),
      );
      const user = adaptUserData(raw);
      deps.onUserUpdated?.(user);
      return user;
    },

    async updateMe(
      payload: ProfilePatchRequest,
      options?: RequestOptions,
    ): Promise<UserModel> {
      const valid = assertProfilePatchPayload(payload);
      const raw = await deps.authRequest<unknown>(
        "/api/v1/users/me",
        toRequestInit(options, {
          method: "PATCH",
          body: JSON.stringify(valid),
        }),
      );
      const user = adaptUserData(raw);
      deps.onUserUpdated?.(user);
      return user;
    },

    async changePassword(
      payload: ChangePasswordRequest,
      options?: RequestOptions,
    ): Promise<void> {
      const valid = assertChangePasswordPayload(payload);
      await deps.authRequest<void>(
        "/api/v1/users/me/password",
        toRequestInit(options, {
          method: "PUT",
          body: JSON.stringify(valid),
        }),
      );
    },

    async forgotPassword(
      payload: ForgotPasswordRequest,
      options?: RequestOptions,
    ): Promise<null> {
      const valid = assertForgotPasswordPayload(payload);
      return deps.publicRequest<null>(
        "/api/v1/auth/forgot-password",
        toRequestInit(options, {
          method: "POST",
          body: JSON.stringify(valid),
        }),
      );
    },

    async resetPassword(
      payload: ResetPasswordRequest,
      options?: RequestOptions,
    ): Promise<void> {
      const valid = assertResetPasswordPayload(payload);
      await deps.publicRequest<void>(
        "/api/v1/auth/reset-password",
        toRequestInit(options, {
          method: "POST",
          body: JSON.stringify(valid),
        }),
      );
    },
  };
}
