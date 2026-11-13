export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";
export const THEME_STORAGE_KEY = "codjingrank-theme";
export function readThemePreference(): ThemePreference {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}
export function applyTheme(preference: ThemePreference, persist = false) {
  const theme =
    preference === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : preference;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = preference;
  if (persist) {
    try {
      if (preference === "system")
        window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      /* A blocked storage must not disable the current-page choice. */
    }
  }
  window.dispatchEvent(new Event("codjingrank-theme-change"));
}
export function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
export function getServerThemeSnapshot(): Theme {
  return "light";
}
export function subscribeToTheme(callback: () => void) {
  window.addEventListener("codjingrank-theme-change", callback);
  return () => window.removeEventListener("codjingrank-theme-change", callback);
}
export function watchThemePreference() {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const systemChanged = () => {
    if (document.documentElement.dataset.themePreference === "system")
      applyTheme("system");
  };
  const storageChanged = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null)
      applyTheme(readThemePreference());
  };
  media.addEventListener("change", systemChanged);
  window.addEventListener("storage", storageChanged);
  applyTheme(readThemePreference());
  return () => {
    media.removeEventListener("change", systemChanged);
    window.removeEventListener("storage", storageChanged);
  };
}
/** Trusted static script in the head: resolves preference before the body is painted. */
export const themeInitializationScript = `(function(){var p="system";try{var s=localStorage.getItem("codjingrank-theme");if(s==="light"||s==="dark")p=s;}catch(e){}var d=p==="system"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p;document.documentElement.dataset.theme=d;document.documentElement.dataset.themePreference=p;})();`;
