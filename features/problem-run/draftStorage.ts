import type { LanguageModel } from "@/lib/api/adapters/catalog";

export const PREFERRED_LANGUAGE_KEY = "cjp.preferred_language";

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;
type StorageRemover = Pick<Storage, "removeItem">;

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function buildDraftStorageKey(
  userId: string,
  problemSlug: string,
  languageSlug: string,
): string {
  return `cjp.draft.${userId}.${problemSlug}.${languageSlug}`;
}

export function safeReadStorage(
  key: string,
  storage: StorageReader | null = getBrowserStorage(),
): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeWriteStorage(
  key: string,
  value: string,
  storage: StorageWriter | null = getBrowserStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveStorage(
  key: string,
  storage: StorageRemover | null = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Bỏ qua lỗi quota hoặc private mode trên trình duyệt.
  }
}

export function pickInitialLanguage(
  languages: LanguageModel[],
  preferredSlug: string | null,
): LanguageModel | null {
  if (languages.length === 0) return null;
  if (preferredSlug) {
    const matched = languages.find((lang) => lang.slug === preferredSlug);
    if (matched) return matched;
  }
  return languages[0];
}
