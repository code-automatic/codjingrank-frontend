import { isUuid } from "@/lib/api/guards";

/**
 * Drafts are deliberately scoped by (problemId, languageId), never by slug or
 * language name. IDs are stable UUIDs from the v1 contract, so renaming a slug
 * cannot collide with another problem's draft.
 */
export const DRAFT_STORAGE_VERSION = 1;
export const DRAFT_KEY_PREFIX = "codjingrank:draft";
export const PREFERRED_LANGUAGE_KEY_PREFIX = "codjingrank:language";

export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type DraftRecord = {
  code: string;
  savedAt: number;
};

export type DraftStore = {
  available: boolean;
  read(problemId: string, languageId: string): DraftRecord | null;
  write(problemId: string, languageId: string, record: DraftRecord): boolean;
  remove(problemId: string, languageId: string): void;
  readPreferredLanguage(problemId: string): string | null;
  writePreferredLanguage(problemId: string, languageId: string): void;
};

export function draftKey(problemId: string, languageId: string): string {
  return `${DRAFT_KEY_PREFIX}:v${DRAFT_STORAGE_VERSION}:${problemId}:${languageId}`;
}

export function preferredLanguageKey(problemId: string): string {
  return `${PREFERRED_LANGUAGE_KEY_PREFIX}:v${DRAFT_STORAGE_VERSION}:${problemId}`;
}

type StoredDraft = {
  v: number;
  problemId: string;
  languageId: string;
  code: string;
  savedAt: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseDraft(
  raw: string,
  problemId: string,
  languageId: string,
): DraftRecord | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (parsed.v !== DRAFT_STORAGE_VERSION) return null;
  if (parsed.problemId !== problemId || parsed.languageId !== languageId)
    return null;
  if (typeof parsed.code !== "string") return null;
  if (typeof parsed.savedAt !== "number" || !Number.isFinite(parsed.savedAt))
    return null;
  if (parsed.savedAt < 0) return null;
  return { code: parsed.code, savedAt: parsed.savedAt };
}

export function createDraftStore(
  storage: KeyValueStorage | null,
): DraftStore {
  let available = false;
  if (storage) {
    try {
      const probe = `${DRAFT_KEY_PREFIX}:probe`;
      storage.setItem(probe, "1");
      storage.removeItem(probe);
      available = true;
    } catch {
      available = false;
    }
  }

  const store: DraftStore = {
    available,

    read(problemId, languageId) {
      if (!available || !isUuid(problemId) || !isUuid(languageId)) return null;
      const key = draftKey(problemId, languageId);
      let raw: string | null;
      try {
        raw = storage!.getItem(key);
      } catch {
        return null;
      }
      if (raw === null) return null;
      const draft = parseDraft(raw, problemId, languageId);
      if (!draft) {
        // Corrupt or foreign record: drop it instead of restoring wrong source.
        try {
          storage!.removeItem(key);
        } catch {
          // Ignore storage failures while cleaning up.
        }
      }
      return draft;
    },

    write(problemId, languageId, record) {
      if (!available || !isUuid(problemId) || !isUuid(languageId)) return false;
      if (typeof record.code !== "string") return false;
      if (!Number.isFinite(record.savedAt) || record.savedAt < 0) return false;
      const payload: StoredDraft = {
        v: DRAFT_STORAGE_VERSION,
        problemId,
        languageId,
        code: record.code,
        savedAt: record.savedAt,
      };
      try {
        storage!.setItem(draftKey(problemId, languageId), JSON.stringify(payload));
        return true;
      } catch {
        // Quota exceeded or storage disabled: the editor keeps the code in
        // memory and surfaces the failure instead of throwing.
        return false;
      }
    },

    remove(problemId, languageId) {
      if (!available || !isUuid(problemId) || !isUuid(languageId)) return;
      try {
        storage!.removeItem(draftKey(problemId, languageId));
      } catch {
        // Ignore storage failures while removing a draft.
      }
    },

    readPreferredLanguage(problemId) {
      if (!available || !isUuid(problemId)) return null;
      const key = preferredLanguageKey(problemId);
      let raw: string | null;
      try {
        raw = storage!.getItem(key);
      } catch {
        return null;
      }
      if (raw === null) return null;
      if (!isUuid(raw)) {
        try {
          storage!.removeItem(key);
        } catch {
          // Ignore storage failures while cleaning up.
        }
        return null;
      }
      return raw;
    },

    writePreferredLanguage(problemId, languageId) {
      if (!available || !isUuid(problemId) || !isUuid(languageId)) return;
      try {
        storage!.setItem(preferredLanguageKey(problemId), languageId);
      } catch {
        // Preference is a convenience; failure must not block editing.
      }
    },
  };

  return store;
}

function browserStorage(): KeyValueStorage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Returns a store backed by `localStorage` when the browser allows it. On the
 * server (or in private mode where access throws) every operation is a no-op
 * and `available` is false.
 */
export function createBrowserDraftStore(): DraftStore {
  return createDraftStore(browserStorage());
}
