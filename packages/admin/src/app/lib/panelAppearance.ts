/** API + yerel önbellek ile panel markası (logo, başlık, alt başlık) senkronu */
export const PANEL_APPEARANCE_LS_KEY = "wolent-cms-appearance-settings";
export const PANEL_APPEARANCE_CHANGED_EVENT = "wolent-panel-appearance-changed";

export type PanelAppearancePayload = {
  accentColor?: string;
  theme?: string;
  logoUrl?: string;
  panelTitle?: string;
  panelSubtitle?: string;
};

export function dispatchPanelAppearanceChanged(): void {
  window.dispatchEvent(new Event(PANEL_APPEARANCE_CHANGED_EVENT));
}
