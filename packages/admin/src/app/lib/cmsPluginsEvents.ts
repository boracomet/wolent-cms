/** Fired when `cms-plugins-enabled` in localStorage changes (same tab + listeners). */
export const CMS_PLUGINS_ENABLED_EVENT = "cms-plugins-enabled-changed";

export function notifyPluginsEnabledChanged(): void {
  window.dispatchEvent(new CustomEvent(CMS_PLUGINS_ENABLED_EVENT));
}

export const NATIVE_ANALYTICS_PLUGIN_ID = "native-analytics";

export function readNativeAnalyticsPluginEnabled(): boolean {
  try {
    const raw = localStorage.getItem("cms-plugins-enabled");
    if (!raw) return false;
    const o = JSON.parse(raw) as Record<string, boolean>;
    return o[NATIVE_ANALYTICS_PLUGIN_ID] === true;
  } catch {
    return false;
  }
}
