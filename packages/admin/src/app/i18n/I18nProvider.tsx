import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ADMIN_LOCALE_STORAGE_KEY,
  catalogs,
  DEFAULT_ADMIN_LOCALE,
  isAdminLocale,
  PANEL_LANGUAGE_OPTIONS,
  type AdminLocale,
} from "./catalog";

function getByPath(obj: unknown, path: string): string | undefined {
  const keys = path.split(".");
  let cur: unknown = obj;
  for (const k of keys) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  );
}

export type I18nContextValue = {
  locale: AdminLocale;
  setLocale: (locale: AdminLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  panelLanguageOptions: typeof PANEL_LANGUAGE_OPTIONS;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): AdminLocale {
  try {
    const raw = localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY);
    if (raw && isAdminLocale(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_ADMIN_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AdminLocale>(() =>
    typeof window !== "undefined" ? readStoredLocale() : DEFAULT_ADMIN_LOCALE
  );

  const setLocale = useCallback((next: AdminLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const fromCurrent = getByPath(catalogs[locale], key);
      const raw =
        fromCurrent !== undefined
          ? fromCurrent
          : (getByPath(catalogs[DEFAULT_ADMIN_LOCALE], key) ?? key);
      return interpolate(raw, vars);
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      panelLanguageOptions: PANEL_LANGUAGE_OPTIONS,
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
