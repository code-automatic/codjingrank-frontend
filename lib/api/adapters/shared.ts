import {
  assertBoolean,
  assertEnum,
  assertInt,
  assertIsoDateTime,
  assertNonEmptyString,
  assertNullableString,
  assertRecord,
  assertUuid,
} from "@/lib/api/guards";
import type {
  LeaderboardEntryDto,
  PublicUserDto,
  UserDto,
} from "@/lib/api/types";

const USER_ROLES = ["student", "teacher", "admin"] as const;

export type PublicUserModel = PublicUserDto & {
  displayName: string;
};

export type UserModel = UserDto & {
  displayName: string;
};

export type LeaderboardEntryModel = LeaderboardEntryDto;

export function adaptPublicUser(
  raw: unknown,
  field = "publicUser",
): PublicUserModel {
  const r = assertRecord(raw, field);
  const username = assertNonEmptyString(r.username, `${field}.username`);
  const fullName = assertNullableString(r.fullName, `${field}.fullName`);
  return {
    id: assertUuid(r.id, `${field}.id`),
    username,
    fullName,
    avatarUrl: assertNullableString(r.avatarUrl, `${field}.avatarUrl`),
    displayName: fullName && fullName.trim() ? fullName : username,
  };
}

export function adaptUser(raw: unknown, field = "user"): UserModel {
  const r = assertRecord(raw, field);
  const username = assertNonEmptyString(r.username, `${field}.username`);
  const fullName = assertNullableString(r.fullName, `${field}.fullName`);
  return {
    id: assertUuid(r.id, `${field}.id`),
    email: assertNonEmptyString(r.email, `${field}.email`),
    username,
    fullName,
    avatarUrl: assertNullableString(r.avatarUrl, `${field}.avatarUrl`),
    bio: assertNullableString(r.bio, `${field}.bio`),
    role: assertEnum(r.role, USER_ROLES, `${field}.role`),
    isActive: assertBoolean(r.isActive, `${field}.isActive`),
    createdAt: assertIsoDateTime(r.createdAt, `${field}.createdAt`),
    updatedAt: assertIsoDateTime(r.updatedAt, `${field}.updatedAt`),
    displayName: fullName && fullName.trim() ? fullName : username,
  };
}

export function adaptLeaderboardEntry(
  raw: unknown,
  field = "leaderboardEntry",
): LeaderboardEntryModel {
  const r = assertRecord(raw, field);
  return {
    rank: assertInt(r.rank, `${field}.rank`, 1),
    userId: assertUuid(r.userId, `${field}.userId`),
    username: assertNonEmptyString(r.username, `${field}.username`),
    avatarUrl: assertNullableString(r.avatarUrl, `${field}.avatarUrl`),
    solvedProblemCount: assertInt(
      r.solvedProblemCount,
      `${field}.solvedProblemCount`,
      0,
    ),
    acceptedSolutionCount: assertInt(
      r.acceptedSolutionCount,
      `${field}.acceptedSolutionCount`,
      0,
    ),
  };
}
