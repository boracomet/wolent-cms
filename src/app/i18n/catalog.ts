import en from "../../locales/en.json";
import tr from "../../locales/tr.json";
import de from "../../locales/de.json";

export const ADMIN_LOCALE_STORAGE_KEY = "cms-admin-panel-locale";

/** Default UI locale — must exist in catalogs */
export const DEFAULT_ADMIN_LOCALE = "en" as const;

export const ADMIN_LOCALES = ["en", "tr", "de"] as const;

export type AdminLocale = (typeof ADMIN_LOCALES)[number];

export const catalogs: Record<AdminLocale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  tr: tr as Record<string, unknown>,
  de: de as Record<string, unknown>,
};

/** Shown in the panel language select (native names; not translated) */
export const PANEL_LANGUAGE_OPTIONS: { code: AdminLocale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
  { code: "de", label: "Deutsch" },
];

export function isAdminLocale(value: string): value is AdminLocale {
  return (ADMIN_LOCALES as readonly string[]).includes(value);
}
