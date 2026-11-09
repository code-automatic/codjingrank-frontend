import { ApiError } from "@/lib/api/client";
import { SLUG_PATTERN, UUID_PATTERN, utf8ByteLength } from "@/lib/api/guards";
import type {
  ChangePasswordRequest,
  CommentCreateRequest,
  CommentPatchRequest,
  ExecuteRequest,
  ForgotPasswordRequest,
  PostCreateRequest,
  PostPatchRequest,
  ProfilePatchRequest,
  ResetPasswordRequest,
} from "@/lib/api/types";

export const MAX_EXECUTE_CODE_BYTES = 102400;
export const MAX_POST_TITLE_CHARS = 200;
export const MAX_POST_CONTENT_CHARS = 20000;
export const MAX_POST_CODE_SNIPPET_BYTES = 102400;
export const MAX_COMMENT_CHARS = 5000;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*[0-9]).{8,72}$/;
const MAX_PASSWORD_BYTES = 72;

export function assertSlugParam(slug: string, field = "slug"): string {
  if (!SLUG_PATTERN.test(slug)) {
    throw new ApiError(400, "VALIDATION_ERROR", { field });
  }
  return slug;
}

export function assertUuidParam(id: string, field = "id"): string {
  if (!UUID_PATTERN.test(id)) {
    throw new ApiError(400, "VALIDATION_ERROR", { field });
  }
  return id;
}

export function assertExecutePayload(payload: ExecuteRequest): ExecuteRequest {
  assertUuidParam(payload.problemId, "problemId");
  assertUuidParam(payload.languageId, "languageId");
  if (typeof payload.code !== "string" || payload.code.trim().length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "code" });
  }
  if (utf8ByteLength(payload.code) > MAX_EXECUTE_CODE_BYTES) {
    throw new ApiError(413, "REQUEST_TOO_LARGE", {
      field: "code",
      maxBytes: MAX_EXECUTE_CODE_BYTES,
    });
  }
  return payload;
}

export function assertPostCreatePayload(
  payload: PostCreateRequest,
): PostCreateRequest {
  if (
    typeof payload.title !== "string" ||
    payload.title.trim().length === 0 ||
    [...payload.title].length > MAX_POST_TITLE_CHARS
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "title" });
  }
  if (
    typeof payload.contentMd !== "string" ||
    payload.contentMd.trim().length === 0 ||
    [...payload.contentMd].length > MAX_POST_CONTENT_CHARS
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "contentMd" });
  }
  if (
    payload.codeSnippet !== undefined &&
    payload.codeSnippet !== null &&
    utf8ByteLength(payload.codeSnippet) > MAX_POST_CODE_SNIPPET_BYTES
  ) {
    throw new ApiError(413, "REQUEST_TOO_LARGE", {
      field: "codeSnippet",
      maxBytes: MAX_POST_CODE_SNIPPET_BYTES,
    });
  }
  if (payload.problemId !== undefined && payload.problemId !== null) {
    assertUuidParam(payload.problemId, "problemId");
  }
  if (payload.postType === "solution" && !payload.problemId) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "problemId" });
  }
  if (payload.languageId !== undefined && payload.languageId !== null) {
    assertUuidParam(payload.languageId, "languageId");
  }
  return payload;
}

export function assertPostPatchPayload(
  payload: PostPatchRequest,
): PostPatchRequest {
  const keys = Object.keys(payload).filter(
    (k) => payload[k as keyof PostPatchRequest] !== undefined,
  );
  if (keys.length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "payload" });
  }
  if (
    payload.title !== undefined &&
    (typeof payload.title !== "string" ||
      payload.title.trim().length === 0 ||
      [...payload.title].length > MAX_POST_TITLE_CHARS)
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "title" });
  }
  if (
    payload.contentMd !== undefined &&
    (typeof payload.contentMd !== "string" ||
      payload.contentMd.trim().length === 0 ||
      [...payload.contentMd].length > MAX_POST_CONTENT_CHARS)
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "contentMd" });
  }
  if (
    payload.codeSnippet !== undefined &&
    payload.codeSnippet !== null &&
    utf8ByteLength(payload.codeSnippet) > MAX_POST_CODE_SNIPPET_BYTES
  ) {
    throw new ApiError(413, "REQUEST_TOO_LARGE", {
      field: "codeSnippet",
      maxBytes: MAX_POST_CODE_SNIPPET_BYTES,
    });
  }
  if (payload.problemId !== undefined && payload.problemId !== null) {
    assertUuidParam(payload.problemId, "problemId");
  }
  if (payload.postType === "solution" && !payload.problemId) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "problemId" });
  }
  if (payload.languageId !== undefined && payload.languageId !== null) {
    assertUuidParam(payload.languageId, "languageId");
  }
  return payload;
}

export function assertCommentCreatePayload(
  payload: CommentCreateRequest,
): CommentCreateRequest {
  if (
    typeof payload.content !== "string" ||
    payload.content.trim().length === 0 ||
    [...payload.content].length > MAX_COMMENT_CHARS
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "content" });
  }
  if (payload.parentId !== undefined && payload.parentId !== null) {
    assertUuidParam(payload.parentId, "parentId");
  }
  return payload;
}

export function assertCommentPatchPayload(
  payload: CommentPatchRequest,
): CommentPatchRequest {
  if (
    typeof payload.content !== "string" ||
    payload.content.trim().length === 0 ||
    [...payload.content].length > MAX_COMMENT_CHARS
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "content" });
  }
  return payload;
}

export function assertProfilePatchPayload(
  payload: ProfilePatchRequest,
): ProfilePatchRequest {
  const keys = Object.keys(payload).filter(
    (k) => payload[k as keyof ProfilePatchRequest] !== undefined,
  );
  if (keys.length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "payload" });
  }
  if (
    payload.fullName !== undefined &&
    payload.fullName !== null &&
    (!payload.fullName.trim() || [...payload.fullName].length > 120)
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "fullName" });
  }
  if (
    payload.avatarUrl !== undefined &&
    payload.avatarUrl !== null &&
    payload.avatarUrl.length > 2048
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "avatarUrl" });
  }
  if (
    payload.bio !== undefined &&
    payload.bio !== null &&
    [...payload.bio].length > 1000
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "bio" });
  }
  return payload;
}

function assertValidNewPassword(password: string, field: string) {
  if (
    typeof password !== "string" ||
    !PASSWORD_PATTERN.test(password) ||
    utf8ByteLength(password) > MAX_PASSWORD_BYTES
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", { field });
  }
}

export function assertChangePasswordPayload(
  payload: ChangePasswordRequest,
): ChangePasswordRequest {
  if (
    typeof payload.currentPassword !== "string" ||
    payload.currentPassword.length === 0
  ) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "currentPassword" });
  }
  assertValidNewPassword(payload.newPassword, "newPassword");
  return payload;
}

export function assertForgotPasswordPayload(
  payload: ForgotPasswordRequest,
): ForgotPasswordRequest {
  if (typeof payload.email !== "string" || payload.email.trim().length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "email" });
  }
  return payload;
}

export function assertResetPasswordPayload(
  payload: ResetPasswordRequest,
): ResetPasswordRequest {
  if (typeof payload.token !== "string" || payload.token.trim().length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", { field: "token" });
  }
  assertValidNewPassword(payload.newPassword, "newPassword");
  return payload;
}
