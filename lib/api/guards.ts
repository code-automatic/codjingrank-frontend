import { ApiError } from "@/lib/api/client";
import type { PaginatedData } from "@/lib/api/types";

export const UUID_PATTERN = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const FORBIDDEN_LEGACY_KEYS = new Set([
  "wrapperCode",
  "executeCode",
  "points",
  "rating",
  "hiddenTestCases",
  "expectedOutputHidden",
  "subjectId",
  "sessionId",
  "lessonId",
  "categoryId",
  "repositoryId",
  "commitSha",
  "commitUrl",
]);

function invalidContract(
  field: string,
  reason: string,
  actual?: unknown,
): never {
  throw new ApiError(200, "INVALID_CONTRACT_DATA", {
    field,
    reason,
    ...(actual === undefined ? {} : { actualType: typeof actual }),
  });
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function isSlug(value: unknown): value is string {
  return typeof value === "string" && SLUG_PATTERN.test(value);
}

export function assertRecord(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalidContract(field, "expected_object", value);
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (FORBIDDEN_LEGACY_KEYS.has(key)) {
      invalidContract(`${field}.${key}`, "forbidden_legacy_or_hidden_field");
    }
  }
  return record;
}

export function assertArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    invalidContract(field, "expected_array", value);
  }
  return value;
}

export function assertUuid(value: unknown, field: string): string {
  if (!isUuid(value)) {
    invalidContract(field, "expected_uuid_string", value);
  }
  return value;
}

export function assertNullableUuid(
  value: unknown,
  field: string,
): string | null {
  if (value === null) return null;
  return assertUuid(value, field);
}

export function assertSlug(value: unknown, field: string): string {
  if (!isSlug(value)) {
    invalidContract(field, "expected_slug", value);
  }
  return value;
}

export function assertString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalidContract(field, "expected_string", value);
  }
  return value;
}

export function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    invalidContract(field, "expected_non_empty_string", value);
  }
  return value;
}

export function assertNullableString(
  value: unknown,
  field: string,
): string | null {
  if (value === null) return null;
  return assertString(value, field);
}

export function assertBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    invalidContract(field, "expected_boolean", value);
  }
  return value;
}

export function assertInt(
  value: unknown,
  field: string,
  min?: number,
  max?: number,
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    invalidContract(field, "expected_integer", value);
  }
  if (min !== undefined && value < min) {
    invalidContract(field, `expected_integer_gte_${min}`);
  }
  if (max !== undefined && value > max) {
    invalidContract(field, `expected_integer_lte_${max}`);
  }
  return value;
}

export function assertNullableInt(
  value: unknown,
  field: string,
  min?: number,
  max?: number,
): number | null {
  if (value === null) return null;
  return assertInt(value, field, min, max);
}

export function assertNumber(
  value: unknown,
  field: string,
  min?: number,
  max?: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    invalidContract(field, "expected_finite_number", value);
  }
  if (min !== undefined && value < min) {
    invalidContract(field, `expected_number_gte_${min}`);
  }
  if (max !== undefined && value > max) {
    invalidContract(field, `expected_number_lte_${max}`);
  }
  return value;
}

export function assertNullableNumber(
  value: unknown,
  field: string,
  min?: number,
  max?: number,
): number | null {
  if (value === null) return null;
  return assertNumber(value, field, min, max);
}

export function assertEnum<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string,
): T[number] {
  if (
    typeof value !== "string" ||
    !(allowed as readonly string[]).includes(value)
  ) {
    invalidContract(field, "unexpected_enum_value", value);
  }
  return value as T[number];
}

export function assertIsoDateTime(value: unknown, field: string): string {
  const s = assertString(value, field);
  if (Number.isNaN(Date.parse(s))) {
    invalidContract(field, "expected_iso_datetime");
  }
  return s;
}

export function assertNullableIsoDateTime(
  value: unknown,
  field: string,
): string | null {
  if (value === null) return null;
  return assertIsoDateTime(value, field);
}

export function assertIsoDate(value: unknown, field: string): string {
  const s = assertString(value, field);
  if (!ISO_DATE_PATTERN.test(s) || Number.isNaN(Date.parse(`${s}T00:00:00Z`))) {
    invalidContract(field, "expected_iso_date");
  }
  return s;
}

export function assertNullableIsoDate(
  value: unknown,
  field: string,
): string | null {
  if (value === null) return null;
  return assertIsoDate(value, field);
}

export function adaptPaginated<Model>(
  raw: unknown,
  field: string,
  adaptItem: (item: unknown, index: number) => Model,
): PaginatedData<Model> {
  const record = assertRecord(raw, field);
  const rawItems = assertArray(record.items, `${field}.items`);
  return {
    items: rawItems.map((item, index) => adaptItem(item, index)),
    page: assertInt(record.page, `${field}.page`, 1),
    size: assertInt(record.size, `${field}.size`, 1, 100),
    total: assertInt(record.total, `${field}.total`, 0),
  };
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}
