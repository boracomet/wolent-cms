/**
 * Menü öğesi API’de İngilizce `label` ile saklanabilir; arayüzde panel diline göre
 * sistem rotaları için layout.nav.* çevirileri kullanılır.
 */
const SYSTEM_ID_TO_I18N: Record<string, string> = {
  dashboard: "layout.nav.dashboard",
  "content-types": "layout.nav.contentTypes",
  media: "layout.nav.mediaLibrary",
  users: "layout.nav.users",
  "api-permissions": "layout.nav.apiPermissions",
  plugins: "layout.nav.plugins",
  "audit-logs": "layout.nav.auditLogs",
  settings: "layout.nav.settings",
  analytics: "layout.nav.analytics",
};

export function getMenuItemDisplayLabel(
  item: { id: string; label: string; type: string },
  t: (key: string) => string
): string {
  const i18nKey = SYSTEM_ID_TO_I18N[item.id];
  if (item.type === "system" && i18nKey) {
    const translated = t(i18nKey);
    if (translated !== i18nKey) return translated;
  }
  return item.label;
}
