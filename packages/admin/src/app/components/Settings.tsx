import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router";
import {
  Globe,
  Lock,
  Bell,
  Palette,
  Database,
  Zap,
  Mail,
  Shield,
  Save,
  Menu,
  Plus,
  GripVertical,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Link2,
  X,
  Check,
  Copy,
  User,
  Archive,
  Server,
  HardDrive,
  Terminal,
  RefreshCw,
  Play,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import { AccountSettings } from "./AccountSettings";
import { BackupSettings } from "./BackupSettings";
import { IconPicker, LucideIconByName } from "./IconPicker";
import { useI18n, type AdminLocale } from "../i18n";
import { api } from "../api/client";
import { ALL_LOCALES } from "../lib/locales";
import { useAuth } from "../api/AuthContext";
import { fetchContentTypes, getAllCachedTypes } from "../lib/contentTypeCache";
import { getMenuItemDisplayLabel } from "../lib/menuNavLabel";
import {
  PANEL_APPEARANCE_LS_KEY,
  dispatchPanelAppearanceChanged,
} from "../lib/panelAppearance";
import type { DemoContentType } from "../data/demoContentTypes";

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  type: "system" | "content-type" | "custom";
  contentTypeUid?: string;
  enabled: boolean;
  order: number;
  roles: string[];
}

export function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { t } = useI18n();
  const { user } = useAuth();
  const isAdmin = Boolean(user && ["super_admin", "admin"].includes(user.role));

  const tabs = useMemo(() => {
    const all = [
      { id: "account", icon: User },
      { id: "general", icon: Globe },
      { id: "i18n", icon: Globe },
      { id: "menu", icon: Menu },
      { id: "page-access", icon: Link2 },
      { id: "security", icon: Lock },
      { id: "notifications", icon: Bell },
      { id: "appearance", icon: Palette },
      { id: "database", icon: Database },
      { id: "integrations", icon: Zap },
      { id: "backup", icon: Archive },
    ];
    if (isAdmin) return all;
    return all.filter((tab) => tab.id !== "security" && tab.id !== "notifications");
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin && (activeTab === "security" || activeTab === "notifications")) {
      setActiveTab("general");
    }
  }, [isAdmin, activeTab]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">{t("settings.title")}</h1>
          <p className="text-stone-600 dark:text-zinc-400">{t("settings.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3">
            <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg overflow-hidden lg:sticky lg:top-4">
              <div className="divide-y divide-stone-200 dark:divide-zinc-800/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      activeTab === tab.id
                        ? "bg-stone-200/95 dark:bg-zinc-800/70 backdrop-blur-sm text-stone-900 dark:text-zinc-100"
                        : "text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 backdrop-blur-sm"
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{t(`settings.tabs.${tab.id}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-9 min-w-0">
            <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg">
              {activeTab === "account" && <AccountSettings />}
              {activeTab === "general" && <GeneralSettings />}
              {activeTab === "i18n" && <I18nSettings />}
              {activeTab === "menu" && <MenuBuilderSettings />}
              {activeTab === "page-access" && <PageAccessSettings />}
              {activeTab === "security" && <SecuritySettings />}
              {activeTab === "notifications" && <NotificationSettings />}
              {activeTab === "appearance" && <AppearanceSettings />}
              {activeTab === "database" && <DatabaseSettings />}
              {activeTab === "integrations" && <IntegrationSettings />}
              {activeTab === "backup" && <BackupSettings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MENU_BUILDER_KEY = "wolent-cms-menu-builder";
export const MENU_CHANGED_EVENT = "wolent-menu-changed";

const ALL_ROLES = ["super_admin", "admin", "editor", "author", "viewer"] as const;
const ADMIN_ROLES = ["super_admin", "admin"];
const ALL_ROLES_ARRAY = [...ALL_ROLES];

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: "LayoutDashboard", type: "system", enabled: true, order: 1, roles: [...ALL_ROLES_ARRAY] },
  { id: "content-types", label: "Content Types", href: "/content-types", icon: "Database", type: "system", enabled: true, order: 2, roles: [...ADMIN_ROLES] },
  { id: "media", label: "Media Library", href: "/media", icon: "Image", type: "system", enabled: true, order: 3, roles: [...ALL_ROLES_ARRAY] },
  { id: "users", label: "Users", href: "/users", icon: "Users", type: "system", enabled: true, order: 4, roles: [...ADMIN_ROLES] },
  { id: "api-permissions", label: "API Permissions", href: "/api-permissions", icon: "Key", type: "system", enabled: true, order: 5, roles: [...ADMIN_ROLES] },
  { id: "plugins", label: "Plugins", href: "/plugins", icon: "Puzzle", type: "system", enabled: true, order: 6, roles: [...ADMIN_ROLES] },
  { id: "audit-logs", label: "Audit Logs", href: "/audit-logs", icon: "ClipboardList", type: "system", enabled: true, order: 7, roles: [...ADMIN_ROLES] },
  { id: "settings", label: "Settings", href: "/settings", icon: "Settings", type: "system", enabled: true, order: 99, roles: [...ADMIN_ROLES] },
];

function MenuBuilderSettings() {
  const { t } = useI18n();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);
  const [contentTypes, setContentTypes] = useState<DemoContentType[]>(() => getAllCachedTypes());
  const [showAddCt, setShowAddCt] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newHref, setNewHref] = useState("");
  const [newIcon, setNewIcon] = useState("FileText");
  const [newRoles, setNewRoles] = useState<string[]>([...ALL_ROLES_ARRAY]);
  const [saved, setSaved] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    fetchContentTypes().then(ct => setContentTypes(ct)).catch(() => {});
  }, []);

  useEffect(() => {
    api.settings.get("menu")
      .then(res => {
        const s = res.data as Record<string, unknown>;
        if (Array.isArray(s.items)) {
          const items = (s.items as MenuItem[]).map(it => ({
            ...it,
            type: it.type || "system" as const,
            roles: Array.isArray(it.roles) ? it.roles : [...ALL_ROLES_ARRAY],
          }));
          setMenuItems(items);
        }
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(MENU_BUILDER_KEY);
          if (raw) setMenuItems(JSON.parse(raw) as MenuItem[]);
        } catch { /* ignore */ }
      });
  }, []);

  const usedCtUids = useMemo(
    () => new Set(menuItems.filter(i => i.type === "content-type").map(i => i.contentTypeUid)),
    [menuItems]
  );
  const availableCts = useMemo(
    () => contentTypes.filter(ct => !usedCtUids.has(ct.apiId)),
    [contentTypes, usedCtUids]
  );

  async function handleSave() {
    const data = { items: menuItems };
    try {
      await api.settings.save("menu", data);
      try { localStorage.setItem(MENU_BUILDER_KEY, JSON.stringify(menuItems)); } catch { /* ignore */ }
      window.dispatchEvent(new Event(MENU_CHANGED_EVENT));
    } catch { /* silent */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addContentType(ct: DemoContentType) {
    const newItem: MenuItem = {
      id: `ct-${ct.apiId}`,
      label: ct.pluralName || ct.name,
      href: `/content/${ct.apiId}`,
      icon: "FileText",
      type: "content-type",
      contentTypeUid: ct.apiId,
      enabled: true,
      order: menuItems.length + 1,
      roles: [...ALL_ROLES_ARRAY],
    };
    setMenuItems(prev => [...prev, newItem]);
    setShowAddCt(false);
  }

  function addCustomItem() {
    if (!newLabel.trim() || !newHref.trim()) return;
    const newItem: MenuItem = {
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      href: newHref.trim(),
      icon: newIcon,
      type: "custom",
      enabled: true,
      order: menuItems.length + 1,
      roles: [...newRoles],
    };
    setMenuItems(prev => [...prev, newItem]);
    setNewLabel(""); setNewHref(""); setNewIcon("FileText"); setNewRoles([...ALL_ROLES_ARRAY]);
    setShowAddCustom(false);
  }

  function updateItem(id: string, patch: Partial<MenuItem>) {
    setMenuItems(prev => prev.map(mi => mi.id === id ? { ...mi, ...patch } : mi));
  }

  function toggleRole(id: string, role: string) {
    setMenuItems(prev => prev.map(mi => {
      if (mi.id !== id) return mi;
      const roles = mi.roles.includes(role) ? mi.roles.filter(r => r !== role) : [...mi.roles, role];
      return { ...mi, roles };
    }));
  }

  function handleDelete(id: string) {
    setMenuItems(prev => prev.filter(mi => mi.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function handleDragStart(id: string) { setDraggedId(id); }
  function handleDragEnd() { setDraggedId(null); }
  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    setMenuItems(prev => {
      const items = [...prev].sort((a, b) => a.order - b.order);
      const fromIdx = items.findIndex(i => i.id === draggedId);
      const toIdx = items.findIndex(i => i.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const reordered = [...items];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      return reordered.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  }

  const typeBadge = (type: string) => {
    const map: Record<string, { bg: string; text: string; labelKey: string }> = {
      system: { bg: "bg-stone-300 dark:bg-zinc-700/50", text: "text-stone-600 dark:text-zinc-400", labelKey: "settings.menuBuilder.badgeSystem" },
      "content-type": { bg: "bg-blue-500/15", text: "text-blue-400", labelKey: "settings.menuBuilder.badgeContentType" },
      custom: { bg: "bg-emerald-500/15", text: "text-emerald-400", labelKey: "settings.menuBuilder.badgeCustom" },
    };
    const s = map[type] ?? map.system;
    return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${s.bg} ${s.text}`}>{t(s.labelKey)}</span>;
  };

  return (
    <>
      <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold">{t("settings.menuBuilder.title")}</h2>
        <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">{t("settings.menuBuilder.subtitle")}</p>
      </div>

      <div className="p-6">
        <div className="bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-stone-600 dark:text-zinc-400">{t("settings.menuBuilder.hint")}</p>
        </div>

        <div className="space-y-2 mb-6">
          {menuItems
            .sort((a, b) => a.order - b.order)
            .map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-stone-100 dark:bg-zinc-950 border rounded-lg transition-colors ${draggedId === item.id ? "border-zinc-500 opacity-50" : "border-stone-200 dark:border-zinc-800 hover:border-stone-400 dark:hover:border-zinc-700"}`}
                >
                  <div className="flex items-center gap-3 p-3">
                    <button className="p-1 text-stone-600 dark:text-zinc-600 hover:text-stone-600 dark:text-zinc-400 cursor-grab" onMouseDown={e => e.preventDefault()}>
                      <GripVertical className="w-4 h-4" />
                    </button>

                    <IconPicker value={item.icon} onChange={(icon) => updateItem(item.id, { icon })} size="sm" />

                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{getMenuItemDisplayLabel(item, t)}</span>
                      {typeBadge(item.type)}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className={`p-1.5 rounded transition-colors ${isExpanded ? "bg-stone-300 dark:bg-zinc-700 text-stone-800 dark:text-zinc-200" : "hover:bg-stone-300 dark:hover:bg-zinc-800 text-stone-500 dark:text-zinc-500"}`}
                        title={t("settings.menuBuilder.editRolesAria")}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={() => updateItem(item.id, { enabled: !item.enabled })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-stone-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                      </label>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors text-stone-500 dark:text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-stone-200/85 dark:border-zinc-800/50 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1">{t("settings.menuBuilder.label")}</label>
                          <input
                            type="text"
                            value={item.label}
                            onChange={e => updateItem(item.id, { label: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-zinc-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1">{t("settings.menuBuilder.path")}</label>
                          <input
                            type="text"
                            value={item.href}
                            onChange={e => updateItem(item.id, { href: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-zinc-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-2">{t("settings.menuBuilder.visibleTo")}</label>
                        <div className="flex flex-wrap gap-2">
                          {ALL_ROLES.map(role => {
                            const active = item.roles.includes(role);
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => toggleRole(item.id, role)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                                  active
                                    ? "border-blue-500/50 bg-blue-500/15 text-blue-400"
                                    : "border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-500 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300"
                                }`}
                              >
                                {role.replace("_", " ")}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="flex gap-3">
          {availableCts.length > 0 && (
            <div className="relative flex-1">
              <button
                onClick={() => { setShowAddCt(o => !o); setShowAddCustom(false); }}
                className="w-full px-4 py-3 bg-stone-100 dark:bg-zinc-950 border-2 border-dashed border-blue-500/30 rounded-lg hover:border-blue-500/50 transition-colors text-blue-400 flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                {t("settings.menuBuilder.addContentType")}
              </button>
              {showAddCt && (
                <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                  {availableCts.map(ct => (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => addContentType(ct)}
                      className="w-full px-4 py-2.5 text-left hover:bg-stone-300 dark:hover:bg-zinc-800 flex items-center gap-3 text-sm transition-colors"
                    >
                      <LucideIconByName name="FileText" className="w-4 h-4 text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-stone-800 dark:text-zinc-200">{ct.pluralName || ct.name}</p>
                        <p className="text-xs text-stone-500 dark:text-zinc-500 truncate">/content/{ct.apiId}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => { setShowAddCustom(true); setShowAddCt(false); }}
            className="flex-1 px-4 py-3 bg-stone-100 dark:bg-zinc-950 border-2 border-dashed border-emerald-500/30 rounded-lg hover:border-emerald-500/50 transition-colors text-emerald-400 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            {t("settings.menuBuilder.addCustomItem")}
          </button>
        </div>

        {showAddCustom && (
          <div className="mt-4 p-4 bg-white/78 dark:bg-zinc-900/50 border border-stone-200 dark:border-zinc-800 rounded-lg space-y-4">
            <div className="grid grid-cols-[auto_1fr_1fr] gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1">{t("settings.menuBuilder.icon")}</label>
                <IconPicker value={newIcon} onChange={setNewIcon} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1">{t("settings.menuBuilder.label")}</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="My Page"
                  className="w-full px-2.5 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-1">{t("settings.menuBuilder.path")}</label>
                <input
                  type="text"
                  value={newHref}
                  onChange={e => setNewHref(e.target.value)}
                  placeholder="/my-page"
                  className="w-full px-2.5 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-zinc-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-zinc-400 mb-2">{t("settings.menuBuilder.visibleTo")}</label>
              <div className="flex flex-wrap gap-2">
                {ALL_ROLES.map(role => {
                  const active = newRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setNewRoles(prev => active ? prev.filter(r => r !== role) : [...prev, role])}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        active
                          ? "border-blue-500/50 bg-blue-500/15 text-blue-400"
                          : "border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-500 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300"
                      }`}
                    >
                      {role.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddCustom(false)} className="px-3 py-1.5 text-sm text-stone-600 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200">Cancel</button>
              <button
                onClick={addCustomItem}
                disabled={!newLabel.trim() || !newHref.trim()}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
              >
                {t("settings.menuBuilder.add")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-stone-200 dark:border-zinc-800 flex justify-end gap-3">
        {saved && <span className="text-xs text-green-400 self-center flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {t("settings.menuBuilder.saved")}</span>}
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium text-sm">
          <Save className="w-4 h-4" />
          {t("settings.menuBuilder.save")}
        </button>
      </div>
    </>
  );
}

const GENERAL_SETTINGS_KEY = "wolent-cms-general-settings";

function GeneralSettings() {
  const { t } = useI18n();
  const [appName, setAppName] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    api.settings.get("general")
      .then(res => {
        const s = res.data as Record<string, string>;
        if (s.appName) setAppName(s.appName);
        if (s.appUrl) setAppUrl(s.appUrl);
        if (s.language) setLanguage(s.language);
        if (s.timezone) setTimezone(s.timezone);
        if (s.description) setDescription(s.description);
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(GENERAL_SETTINGS_KEY);
          if (raw) {
            const s = JSON.parse(raw) as Record<string, string>;
            if (s.appName) setAppName(s.appName);
            if (s.appUrl) setAppUrl(s.appUrl);
            if (s.language) setLanguage(s.language);
            if (s.timezone) setTimezone(s.timezone);
            if (s.description) setDescription(s.description);
          }
        } catch { /* ignore */ }
      });
  }, []);

  async function handleSave() {
    setSaveError(null);
    const data = { appName, appUrl, language, timezone, description };
    try {
      await api.settings.save("general", data);
      try { localStorage.setItem(GENERAL_SETTINGS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    } catch {
      setSaveError("Failed to save settings.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold">{t("settings.general.heading")}</h2>
        <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">{t("settings.general.description")}</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("settings.general.applicationName")}
          </label>
          <input
            type="text"
            value={appName}
            onChange={e => setAppName(e.target.value)}
            placeholder="My CMS"
            className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("settings.general.applicationUrl")}
          </label>
          <input
            type="url"
            value={appUrl}
            onChange={e => setAppUrl(e.target.value)}
            placeholder="https://your-domain.com"
            className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("settings.general.defaultLanguage")}
          </label>
          <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700">
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("settings.general.timezone")}</label>
          <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700">
            <option value="UTC">UTC</option>
            <option value="Europe/Istanbul">Europe/Istanbul</option>
            <option value="America/New_York">America/New York</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("settings.general.descriptionLabel")}</label>
          <textarea
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe your CMS..."
            className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700 resize-none"
          />
        </div>
      </div>

      <div className="px-6 py-4 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-end gap-3">
        {saveError && <span className="text-xs text-red-400 mr-auto">{saveError}</span>}
        {saved && <span className="text-xs text-green-400">Saved.</span>}
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium">
          <Save className="w-4 h-4" />
          {t("settings.general.saveChanges")}
        </button>
      </div>
    </>
  );
}

const I18N_SETTINGS_KEY = "wolent-cms-i18n-settings";

function I18nSettings() {
  const { t } = useI18n();
  const [selectedLocales, setSelectedLocales] = useState<string[]>(["en","tr","de","fr"]);
  const [defaultLocale, setDefaultLocale] = useState("en");
  const [showAddLocale, setShowAddLocale] = useState(false);
  const [localeSwitcherEnabled, setLocaleSwitcherEnabled] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [i18nSaved, setI18nSaved] = useState(false);
  const [i18nError, setI18nError] = useState<string | null>(null);

  useEffect(() => {
    api.settings.get("i18n")
      .then(res => {
        const s = res.data as Record<string, unknown>;
        if (Array.isArray(s.selectedLocales)) setSelectedLocales(s.selectedLocales as string[]);
        if (s.defaultLocale) setDefaultLocale(String(s.defaultLocale));
        if (s.localeSwitcherEnabled !== undefined) setLocaleSwitcherEnabled(Boolean(s.localeSwitcherEnabled));
        if (s.autoTranslate !== undefined) setAutoTranslate(Boolean(s.autoTranslate));
      })
      .catch(() => {
        try {
          const r = localStorage.getItem(I18N_SETTINGS_KEY);
          if (r) {
            const p = JSON.parse(r) as Record<string,unknown>;
            if (Array.isArray(p.selectedLocales)) setSelectedLocales(p.selectedLocales as string[]);
            if (p.defaultLocale) setDefaultLocale(String(p.defaultLocale));
            if (p.localeSwitcherEnabled !== undefined) setLocaleSwitcherEnabled(Boolean(p.localeSwitcherEnabled));
            if (p.autoTranslate !== undefined) setAutoTranslate(Boolean(p.autoTranslate));
          }
        } catch { /* ignore */ }
      });
  }, []);

  async function handleI18nSave() {
    setI18nError(null);
    const data = { selectedLocales, defaultLocale, localeSwitcherEnabled, autoTranslate };
    try {
      await api.settings.save("i18n", data);
      try { localStorage.setItem(I18N_SETTINGS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    } catch {
      setI18nError("Failed to save settings.");
      return;
    }
    setI18nSaved(true);
    setTimeout(() => setI18nSaved(false), 2000);
  }

  const allLocales = ALL_LOCALES;

  const enabledLocales = allLocales.filter((l) => selectedLocales.includes(l.code));
  const availableLocales = allLocales.filter((l) => !selectedLocales.includes(l.code));

  return (
    <>
      <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold">Internationalization Settings</h2>
        <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">
          Manage languages and localization for your content
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Default Language */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Default Language
          </label>
          <select
            value={defaultLocale}
            onChange={(e) => setDefaultLocale(e.target.value)}
            className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
          >
            {enabledLocales.map((locale) => (
              <option key={locale.code} value={locale.code}>
                {locale.flag} {locale.name} ({locale.nativeName})
              </option>
            ))}
          </select>
          <p className="text-xs text-stone-500 dark:text-zinc-500 mt-2">
            This will be the fallback language for all content
          </p>
        </div>

        {/* Enabled Languages */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium">
              Enabled Languages ({enabledLocales.length})
            </label>
            <button
              onClick={() => setShowAddLocale(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 active:bg-stone-400/90 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 rounded-md transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Language
            </button>
          </div>

          <div className="space-y-2">
            {enabledLocales.map((locale) => (
              <div
                key={locale.code}
                className="flex items-center justify-between p-4 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{locale.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{locale.name}</span>
                      {locale.code === defaultLocale && (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-600 dark:text-zinc-400">
                      {locale.nativeName} • {locale.code}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {locale.code === defaultLocale ? (
                    <span className="text-sm text-stone-500 dark:text-zinc-500">Cannot remove default</span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedLocales(selectedLocales.filter((c) => c !== locale.code));
                      }}
                      className="p-2 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* i18n Features */}
        <div className="pt-6 border-t border-stone-200 dark:border-zinc-800">
          <h3 className="text-sm font-medium mb-3">Features</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-sm">Locale Switcher in Editor</p>
                <p className="text-xs text-stone-500 dark:text-zinc-500">
                  Show language selector when editing content
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={localeSwitcherEnabled} onChange={e => setLocaleSwitcherEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-stone-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.08] via-stone-100 dark:via-zinc-950 to-stone-100 dark:to-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-400/25 bg-violet-500/15">
                  <Sparkles className="h-5 w-5 text-violet-300" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-stone-900 dark:text-zinc-100">
                      {t("settings.i18nGemini.autoTranslateTitle")}
                    </p>
                    <span className="rounded border border-violet-400/35 bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                      {t("settings.i18nGemini.pluginBadge")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-violet-200/80">{t("settings.i18nGemini.pluginTagline")}</p>
                  <p className="mt-1 text-xs text-stone-500 dark:text-zinc-500">{t("settings.i18nGemini.autoTranslateDescription")}</p>
                  <Link
                    to="/plugins"
                    className="mt-2 inline-flex text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
                  >
                    {t("settings.i18nGemini.openPlugins")} →
                  </Link>
                </div>
              </div>
              <label className="relative inline-flex shrink-0 cursor-pointer items-center self-end sm:self-center">
                <input type="checkbox" checked={autoTranslate} onChange={e => setAutoTranslate(e.target.checked)} className="peer sr-only" />
                <div className="relative h-6 w-11 rounded-full bg-stone-300 dark:bg-zinc-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500/40" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Add Locale Modal */}
      {showAddLocale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/96 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-stone-200/85 dark:border-zinc-800/50">
              <div>
                <h2 className="text-xl font-semibold">Add Language</h2>
                <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">
                  Select languages to enable for your content
                </p>
              </div>
              <button
                onClick={() => setShowAddLocale(false)}
                className="p-2 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableLocales.map((locale) => (
                  <button
                    key={locale.code}
                    onClick={() => {
                      setSelectedLocales([...selectedLocales, locale.code]);
                      setShowAddLocale(false);
                    }}
                    className="flex items-center gap-3 p-4 bg-white/75 dark:bg-zinc-950/50 border border-stone-200/85 dark:border-zinc-800/50 rounded-lg hover:border-stone-400 dark:hover:border-zinc-700/50 hover:bg-stone-300 dark:hover:bg-zinc-800/30 transition-colors text-left"
                  >
                    <span className="text-2xl">{locale.flag}</span>
                    <div>
                      <p className="font-medium">{locale.name}</p>
                      <p className="text-sm text-stone-600 dark:text-zinc-400">
                        {locale.nativeName} • {locale.code}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200/85 dark:border-zinc-800/50">
              <button
                onClick={() => setShowAddLocale(false)}
                className="px-4 py-2 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-4 border-t border-stone-200 dark:border-zinc-800 flex justify-end gap-3">
        {i18nError && <span className="text-xs text-red-400 mr-auto self-center">{i18nError}</span>}
        {i18nSaved && <span className="text-xs text-green-400 self-center">Saved!</span>}
        <button onClick={handleI18nSave} className="flex items-center gap-2 px-6 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </>
  );
}

const PAGE_ACCESS_SETTINGS_KEY = "wolent-cms-page-access-settings";

function PageAccessSettings() {
  const [dashboard, setDashboard] = useState(true);
  const [contentTypes, setContentTypes] = useState(true);
  const [contentManager, setContentManager] = useState(true);
  const [mediaLibrary, setMediaLibrary] = useState(true);
  const [users, setUsers] = useState(true);
  const [apiPermissions, setApiPermissions] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.settings.get("page-access")
      .then(res => {
        const s = res.data as Record<string, unknown>;
        if (s.dashboard !== undefined) setDashboard(Boolean(s.dashboard));
        if (s.contentTypes !== undefined) setContentTypes(Boolean(s.contentTypes));
        if (s.contentManager !== undefined) setContentManager(Boolean(s.contentManager));
        if (s.mediaLibrary !== undefined) setMediaLibrary(Boolean(s.mediaLibrary));
        if (s.users !== undefined) setUsers(Boolean(s.users));
        if (s.apiPermissions !== undefined) setApiPermissions(Boolean(s.apiPermissions));
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(PAGE_ACCESS_SETTINGS_KEY);
          if (raw) {
            const s = JSON.parse(raw) as Record<string, unknown>;
            if (s.dashboard !== undefined) setDashboard(Boolean(s.dashboard));
            if (s.contentTypes !== undefined) setContentTypes(Boolean(s.contentTypes));
            if (s.contentManager !== undefined) setContentManager(Boolean(s.contentManager));
            if (s.mediaLibrary !== undefined) setMediaLibrary(Boolean(s.mediaLibrary));
            if (s.users !== undefined) setUsers(Boolean(s.users));
            if (s.apiPermissions !== undefined) setApiPermissions(Boolean(s.apiPermissions));
          }
        } catch {}
      });
  }, []);

  async function handleSave() {
    const data = { dashboard, contentTypes, contentManager, mediaLibrary, users, apiPermissions };
    try {
      await api.settings.save("page-access", data);
      try { localStorage.setItem(PAGE_ACCESS_SETTINGS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    } catch { /* silent — UI already works from local state */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const toggleClass = "w-11 h-6 bg-stone-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600";

  return (
    <>
      <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold">Page Access Settings</h2>
        <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">
          Configure access permissions for different pages
        </p>
      </div>

      <div className="p-6 space-y-6">
        {([
          { label: "Dashboard", desc: "Access to the main dashboard", value: dashboard, set: setDashboard },
          { label: "Content Types", desc: "Access to content type management", value: contentTypes, set: setContentTypes },
          { label: "Content Manager", desc: "Access to content management", value: contentManager, set: setContentManager },
          { label: "Media Library", desc: "Access to media library management", value: mediaLibrary, set: setMediaLibrary },
          { label: "Users", desc: "Access to user management", value: users, set: setUsers },
          { label: "API Permissions", desc: "Access to API permission management", value: apiPermissions, set: setApiPermissions },
        ] as { label: string; desc: string; value: boolean; set: (v: boolean) => void }[]).map(({ label, desc, value, set }) => (
          <div key={label} className="bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium">{label}</h3>
                <p className="text-sm text-stone-600 dark:text-zinc-400">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={value} onChange={e => set(e.target.checked)} className="sr-only peer" />
                <div className={toggleClass}></div>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-stone-200 dark:border-zinc-800 flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium">
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </>
  );
}

const SECURITY_SETTINGS_KEY = "wolent-cms-security-settings";

function SecuritySettings() {
  const [require2fa, setRequire2fa] = useState(false);
  const [rateLimit, setRateLimit] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [minLength, setMinLength] = useState(true);
  const [requireUpper, setRequireUpper] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [requireSpecial, setRequireSpecial] = useState(false);
  const [corsOrigins, setCorsOrigins] = useState("");
  const [notifEmail, setNotifEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.settings.get("security")
      .then(res => {
        const s = res.data as Record<string, unknown>;
        if (s.require2fa !== undefined) setRequire2fa(Boolean(s.require2fa));
        if (s.rateLimit !== undefined) setRateLimit(Boolean(s.rateLimit));
        if (s.sessionTimeout) setSessionTimeout(String(s.sessionTimeout));
        if (s.minLength !== undefined) setMinLength(Boolean(s.minLength));
        if (s.requireUpper !== undefined) setRequireUpper(Boolean(s.requireUpper));
        if (s.requireNumbers !== undefined) setRequireNumbers(Boolean(s.requireNumbers));
        if (s.requireSpecial !== undefined) setRequireSpecial(Boolean(s.requireSpecial));
        if (s.corsOrigins) setCorsOrigins(String(s.corsOrigins));
        if (s.notifEmail) setNotifEmail(String(s.notifEmail));
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(SECURITY_SETTINGS_KEY);
          if (raw) {
            const s = JSON.parse(raw) as Record<string, unknown>;
            if (s.require2fa !== undefined) setRequire2fa(Boolean(s.require2fa));
            if (s.rateLimit !== undefined) setRateLimit(Boolean(s.rateLimit));
            if (s.sessionTimeout) setSessionTimeout(String(s.sessionTimeout));
            if (s.minLength !== undefined) setMinLength(Boolean(s.minLength));
            if (s.requireUpper !== undefined) setRequireUpper(Boolean(s.requireUpper));
            if (s.requireNumbers !== undefined) setRequireNumbers(Boolean(s.requireNumbers));
            if (s.requireSpecial !== undefined) setRequireSpecial(Boolean(s.requireSpecial));
            if (s.corsOrigins) setCorsOrigins(String(s.corsOrigins));
            if (s.notifEmail) setNotifEmail(String(s.notifEmail));
          }
        } catch { /* ignore */ }
      });
  }, []);

  async function handleSave() {
    const data = { require2fa, rateLimit, sessionTimeout, minLength, requireUpper, requireNumbers, requireSpecial, corsOrigins, notifEmail };
    try {
      await api.settings.save("security", data);
      try { localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    } catch { /* silent */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold">Security Settings</h2>
        <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">
          Manage authentication and security options
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-stone-600 dark:text-zinc-400">Require 2FA for all users</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={require2fa} onChange={e => setRequire2fa(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-stone-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium">API Rate Limiting</h3>
              <p className="text-sm text-stone-600 dark:text-zinc-400">Enable rate limiting for API requests</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={rateLimit} onChange={e => setRateLimit(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-stone-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
          <input
            type="number"
            value={sessionTimeout}
            onChange={e => setSessionTimeout(e.target.value)}
            className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password Policy</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={minLength} onChange={e => setMinLength(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm">Minimum 8 characters</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={requireUpper} onChange={e => setRequireUpper(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm">Require uppercase letters</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={requireNumbers} onChange={e => setRequireNumbers(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm">Require numbers</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={requireSpecial} onChange={e => setRequireSpecial(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm">Require special characters</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Allowed Origins (CORS)</label>
          <textarea
            rows={4}
            value={corsOrigins}
            onChange={e => setCorsOrigins(e.target.value)}
            placeholder="https://your-app.com"
            className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700 resize-none font-mono text-sm"
          />
          <p className="text-xs text-stone-500 dark:text-zinc-500 mt-2">One origin per line. Leave empty to allow all origins.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Notification Email</label>
          <input
            type="email"
            value={notifEmail}
            onChange={e => setNotifEmail(e.target.value)}
            placeholder="admin@your-domain.com"
            className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
          />
        </div>
      </div>

      <div className="px-6 py-4 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-green-400">Saved.</span>}
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </>
  );
}

const NOTIF_SETTINGS_KEY = "wolent-cms-notif-settings";

function NotificationSettings() {
  const [newUser, setNewUser] = useState(true);
  const [published, setPublished] = useState(true);
  const [apiErrors, setApiErrors] = useState(true);
  const [sysUpdates, setSysUpdates] = useState(false);
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.settings.get("notifications")
      .then(res => {
        const s = res.data as Record<string, unknown>;
        if (s.newUser !== undefined) setNewUser(Boolean(s.newUser));
        if (s.published !== undefined) setPublished(Boolean(s.published));
        if (s.apiErrors !== undefined) setApiErrors(Boolean(s.apiErrors));
        if (s.sysUpdates !== undefined) setSysUpdates(Boolean(s.sysUpdates));
        if (s.email) setEmail(String(s.email));
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(NOTIF_SETTINGS_KEY);
          if (raw) {
            const s = JSON.parse(raw) as Record<string, unknown>;
            if (s.newUser !== undefined) setNewUser(Boolean(s.newUser));
            if (s.published !== undefined) setPublished(Boolean(s.published));
            if (s.apiErrors !== undefined) setApiErrors(Boolean(s.apiErrors));
            if (s.sysUpdates !== undefined) setSysUpdates(Boolean(s.sysUpdates));
            if (s.email) setEmail(String(s.email));
          }
        } catch { /* ignore */ }
      });
  }, []);

  async function handleSave() {
    const data = { newUser, published, apiErrors, sysUpdates, email };
    try {
      await api.settings.save("notifications", data);
      try { localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    } catch { /* silent */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold">Notification Settings</h2>
        <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">Configure how and when you receive notifications</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="font-medium mb-4">Email Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-sm">New User Registration</p>
                <p className="text-xs text-stone-500 dark:text-zinc-500">Get notified when new users sign up</p>
              </div>
              <input type="checkbox" checked={newUser} onChange={e => setNewUser(e.target.checked)} className="w-4 h-4" />
            </label>
            <label className="flex items-center justify-between p-3 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-sm">Content Published</p>
                <p className="text-xs text-stone-500 dark:text-zinc-500">Get notified when content is published</p>
              </div>
              <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="w-4 h-4" />
            </label>
            <label className="flex items-center justify-between p-3 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-sm">API Errors</p>
                <p className="text-xs text-stone-500 dark:text-zinc-500">Get notified about API errors</p>
              </div>
              <input type="checkbox" checked={apiErrors} onChange={e => setApiErrors(e.target.checked)} className="w-4 h-4" />
            </label>
            <label className="flex items-center justify-between p-3 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-sm">System Updates</p>
                <p className="text-xs text-stone-500 dark:text-zinc-500">Get notified about system updates</p>
              </div>
              <input type="checkbox" checked={sysUpdates} onChange={e => setSysUpdates(e.target.checked)} className="w-4 h-4" />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Notification Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@your-domain.com"
            className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
          />
        </div>
      </div>

      <div className="px-6 py-4 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-green-400">Saved.</span>}
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </>
  );
}

function AppearanceSettings() {
  const { t, locale, setLocale, panelLanguageOptions } = useI18n();
  const [accentColor, setAccentColor] = useState("#3b82f6");
  const { theme: activeTheme, setTheme: applyTheme } = useTheme();
  const [theme, setTheme] = useState("dark");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [panelTitle, setPanelTitle] = useState("");
  const [panelSubtitle, setPanelSubtitle] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  function applyAppearancePayload(s: Record<string, unknown>) {
    if (s.accentColor && typeof s.accentColor === "string") setAccentColor(s.accentColor);
    if (s.theme && typeof s.theme === "string") setTheme(s.theme);
    if (typeof s.logoUrl === "string") setLogoUrl(s.logoUrl.trim() ? s.logoUrl : null);
    setPanelTitle(typeof s.panelTitle === "string" ? s.panelTitle : "");
    setPanelSubtitle(typeof s.panelSubtitle === "string" ? s.panelSubtitle : "");
  }

  useEffect(() => {
    api.settings.get("appearance")
      .then(res => {
        applyAppearancePayload(res.data as Record<string, unknown>);
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(PANEL_APPEARANCE_LS_KEY);
          if (raw) applyAppearancePayload(JSON.parse(raw) as Record<string, unknown>);
        } catch { /* ignore */ }
      });
  }, []);

  function appearancePayload() {
    return {
      accentColor,
      theme,
      logoUrl: logoUrl ?? "",
      panelTitle: panelTitle.trim(),
      panelSubtitle: panelSubtitle.trim(),
    };
  }

  async function persistAppearance(partial?: Partial<ReturnType<typeof appearancePayload>>) {
    const data = { ...appearancePayload(), ...partial };
    try {
      await api.settings.save("appearance", data);
      try { localStorage.setItem(PANEL_APPEARANCE_LS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    } catch { /* silent */ }
    dispatchPanelAppearanceChanged();
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const res = await api.media.upload(file);
      const uploaded = res.data as Record<string, unknown>;
      const url = String(uploaded.url ?? "");
      if (url) {
        setLogoUrl(url);
        await persistAppearance({ logoUrl: url });
      }
    } catch { /* silent */ } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  async function handleSave() {
    await persistAppearance();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold">{t("settings.appearance.heading")}</h2>
        <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">{t("settings.appearance.description")}</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="rounded-lg border border-stone-200/90 dark:border-zinc-800/80 bg-stone-100/92 dark:bg-zinc-950/40 p-4">
          <p className="text-sm font-medium text-stone-800 dark:text-zinc-200 mb-3">{t("settings.appearance.brandingSection")}</p>
          <p className="text-xs text-stone-500 dark:text-zinc-500 mb-4">{t("settings.appearance.brandingHint")}</p>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="shrink-0 flex flex-col items-center sm:items-start gap-2">
              <label className="text-xs font-medium text-stone-500 dark:text-zinc-500">{t("settings.appearance.logo")}</label>
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-stone-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center overflow-hidden border border-stone-200 dark:border-zinc-800">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Layers className="w-10 h-10 text-white dark:text-zinc-950 opacity-80" />
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="px-3 py-1.5 bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 active:bg-stone-400/90 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 disabled:opacity-50 rounded-md transition-colors text-xs"
                >
                  {logoUploading ? t("settings.appearance.uploadingLogo") : t("settings.appearance.uploadLogo")}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={async () => {
                      setLogoUrl(null);
                      await persistAppearance({ logoUrl: "" });
                    }}
                    className="px-2 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    {t("settings.appearance.removeLogo")}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-stone-600 dark:text-zinc-600 text-center sm:text-left max-w-[10rem]">{t("settings.appearance.logoHint")}</p>
            </div>
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("settings.appearance.panelTitle")}</label>
                <input
                  type="text"
                  value={panelTitle}
                  onChange={(e) => setPanelTitle(e.target.value)}
                  placeholder={t("settings.appearance.panelTitlePlaceholder")}
                  className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("settings.appearance.panelSubtitle")}</label>
                <input
                  type="text"
                  value={panelSubtitle}
                  onChange={(e) => setPanelSubtitle(e.target.value)}
                  placeholder={t("settings.appearance.panelSubtitlePlaceholder")}
                  className="w-full px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("settings.appearance.panelLanguage")}
          </label>
          <div className="relative w-full max-w-md">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as AdminLocale)}
              className="h-10 w-full cursor-pointer appearance-none rounded-md border border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-950 py-2 pl-3 pr-10 text-sm text-stone-900 dark:text-zinc-100 focus:border-stone-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
            >
              {panelLanguageOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-600 dark:text-zinc-400"
              aria-hidden
            />
          </div>
          <p className="text-xs text-stone-500 dark:text-zinc-500 mt-2 max-w-2xl leading-relaxed">
            {t("settings.appearance.panelLanguageHint")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("settings.appearance.theme")}</label>
          <div className="grid grid-cols-3 gap-4">
            {([
              { value: "system", Icon: Monitor, label: t("settings.appearance.autoMode"), sub: t("settings.appearance.autoModeSub") },
              { value: "dark",   Icon: Moon,    label: t("settings.appearance.darkMode"),  sub: t("settings.appearance.darkModeSub") },
              { value: "light",  Icon: Sun,     label: t("settings.appearance.lightMode"), sub: t("settings.appearance.lightModeSub") },
            ] as const).map(({ value, Icon, label, sub }) => (
              <label key={value} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={(activeTheme ?? theme) === value}
                  onChange={() => { setTheme(value); applyTheme(value); }}
                  className="sr-only peer"
                />
                <div className="flex flex-col items-center gap-2 p-4 border-2 border-stone-200 dark:border-zinc-800 rounded-lg peer-checked:border-stone-400 dark:peer-checked:border-zinc-100 transition-colors text-center">
                  <div className="w-full h-24 rounded mb-1 flex items-center justify-center bg-stone-100 dark:bg-zinc-900/60">
                    <Icon className="w-8 h-8 text-stone-400 dark:text-zinc-500" />
                  </div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-stone-500 dark:text-zinc-500 leading-relaxed">{sub}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("settings.appearance.accentColor")}</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              className="w-12 h-12 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded cursor-pointer"
            />
            <input
              type="text"
              value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              className="flex-1 px-3 py-2 bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700 font-mono"
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-green-400">{t("settings.appearance.saved")}</span>}
        <button type="button" onClick={() => void handleSave()} className="flex items-center gap-2 px-6 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium">
          <Save className="w-4 h-4" />
          {t("settings.appearance.saveChanges")}
        </button>
      </div>
    </>
  );
}

type DbDriver = "sqlite" | "postgres";

type MigrationRow = {
  id: string;
  name: string;
  status: "applied" | "pending";
  appliedAt: string | null;
};

function DatabaseSettings() {
  const { t } = useI18n();
  const [driver, setDriver] = useState<DbDriver>("sqlite");
  const [sqlitePath, setSqlitePath] = useState("");
  const [pgHost, setPgHost] = useState("");
  const [pgPort, setPgPort] = useState("5432");
  const [pgDatabase, setPgDatabase] = useState("");
  const [pgUser, setPgUser] = useState("");
  const [pgPassword, setPgPassword] = useState("");
  const [pgSsl, setPgSsl] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [migrations, setMigrations] = useState<MigrationRow[]>([]);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [cliCopied, setCliCopied] = useState(false);
  const [dbTestFlash, setDbTestFlash] = useState(false);
  const [dbSaveFlash, setDbSaveFlash] = useState(false);

  useEffect(() => {
    api.dbInfo.get().then(res => {
      const d = res.data as Record<string, unknown>;
      if (d.driver === 'postgres') {
        setDriver('postgres');
        setPgHost(String(d.host ?? ''));
        setPgPort(String(d.port ?? '5432'));
        setPgDatabase(String(d.database ?? ''));
        setPgUser(String(d.user ?? ''));
        setPgSsl(Boolean(d.ssl));
      } else if (d.driver === 'sqlite') {
        setDriver('sqlite');
        setSqlitePath(String(d.path ?? ''));
      }
      setConnected(Boolean(d.connected));
    }).catch(() => {});
  }, []);

  const cliExample =
    driver === "sqlite"
      ? "npx prisma migrate deploy --schema=./prisma/schema.sqlite.prisma"
      : "npx prisma migrate deploy";

  const pendingCount = migrations.filter((m) => m.status === "pending").length;

  const handleTestConnection = () => {
    api.dbInfo.get().then(res => {
      const d = res.data as Record<string, unknown>;
      setConnected(Boolean(d.connected));
      setDbTestFlash(true);
      window.setTimeout(() => setDbTestFlash(false), 2500);
    }).catch(() => { setConnected(false); });
  };

  const handleSave = async () => {
    const data =
      driver === "postgres"
        ? { driver, host: pgHost, port: pgPort, database: pgDatabase, user: pgUser, ssl: pgSsl }
        : { driver, path: sqlitePath };
    try {
      await api.settings.save("database", data);
    } catch { /* silent — DB_URL is read-only server-side; save is best-effort */ }
    setDbSaveFlash(true);
    window.setTimeout(() => setDbSaveFlash(false), 2500);
  };

  const loadMigrations = () => {
    api.dbInfo.migrations()
      .then(res => setMigrations(res.data))
      .catch(() => setMigrations([]));
  };

  useEffect(() => { loadMigrations(); }, []);

  const handleRunMigrations = async () => {
    if (pendingCount === 0) return;
    setMigrationBusy(true);
    try {
      await api.dbInfo.migrate();
      await api.dbInfo.migrations().then(res => setMigrations(res.data)).catch(() => {});
    } catch {
      // silent — migration may still have run
    } finally {
      setMigrationBusy(false);
    }
  };

  const copyCli = () => {
    void navigator.clipboard.writeText(cliExample);
    setCliCopied(true);
    window.setTimeout(() => setCliCopied(false), 2000);
  };

  return (
    <>
      <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold">{t("settings.database.heading")}</h2>
        <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">{t("settings.database.description")}</p>
      </div>

      <div className="p-6 space-y-8">
        <div className="rounded-lg border border-stone-300 dark:border-zinc-700/60 bg-white/88 dark:bg-zinc-950/80 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Terminal className="mt-0.5 h-5 w-5 shrink-0 text-stone-500 dark:text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-zinc-200">
                  {t("settings.database.bannerTitle")}
                </p>
                <p className="mt-1 text-sm text-stone-500 dark:text-zinc-500">{t("settings.database.bannerBody")}</p>
              </div>
            </div>
            {connected !== null && (
              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-stone-700 dark:text-zinc-300">
            {t("settings.database.driverLabel")}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setDriver("sqlite")}
              className={`rounded-lg border p-4 text-left transition-colors ${
                driver === "sqlite"
                  ? "border-stone-300/90 dark:border-stone-300 dark:border-zinc-100/90 bg-stone-200/75 dark:bg-zinc-800/40 ring-1 ring-stone-400 dark:ring-zinc-600/80"
                  : "border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-950 hover:border-stone-400 dark:hover:border-zinc-700"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-200 dark:bg-zinc-800">
                  <HardDrive className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="font-semibold text-stone-900 dark:text-zinc-100">{t("settings.database.sqlite")}</span>
              </div>
              <p className="text-sm text-stone-500 dark:text-zinc-500">{t("settings.database.sqliteDesc")}</p>
            </button>
            <button
              type="button"
              onClick={() => setDriver("postgres")}
              className={`rounded-lg border p-4 text-left transition-colors ${
                driver === "postgres"
                  ? "border-stone-300/90 dark:border-stone-300 dark:border-zinc-100/90 bg-stone-200/75 dark:bg-zinc-800/40 ring-1 ring-stone-400 dark:ring-zinc-600/80"
                  : "border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-950 hover:border-stone-400 dark:hover:border-zinc-700"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-200 dark:bg-zinc-800">
                  <Server className="h-5 w-5 text-sky-400" />
                </div>
                <span className="font-semibold text-stone-900 dark:text-zinc-100">{t("settings.database.postgres")}</span>
              </div>
              <p className="text-sm text-stone-500 dark:text-zinc-500">{t("settings.database.postgresDesc")}</p>
            </button>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-medium text-stone-700 dark:text-zinc-300">
            {t("settings.database.connectionHeading")}
          </h3>
          {driver === "sqlite" ? (
            <div className="space-y-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-950 p-4">
              <label className="block text-sm font-medium">{t("settings.database.sqlitePath")}</label>
              <input
                type="text"
                value={sqlitePath}
                onChange={(e) => setSqlitePath(e.target.value)}
                className="w-full rounded-md border border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-950 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
              />
              <p className="text-xs text-stone-500 dark:text-zinc-500">{t("settings.database.sqlitePathHint")}</p>
            </div>
          ) : (
            <div className="grid gap-4 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-950 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">{t("settings.database.pgHost")}</label>
                <input
                  type="text"
                  value={pgHost}
                  onChange={(e) => setPgHost(e.target.value)}
                  className="w-full rounded-md border border-stone-200 dark:border-zinc-800 bg-white/88 dark:bg-zinc-950/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t("settings.database.pgPort")}</label>
                <input
                  type="text"
                  value={pgPort}
                  onChange={(e) => setPgPort(e.target.value)}
                  className="w-full rounded-md border border-stone-200 dark:border-zinc-800 bg-white/88 dark:bg-zinc-950/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t("settings.database.pgDatabase")}
                </label>
                <input
                  type="text"
                  value={pgDatabase}
                  onChange={(e) => setPgDatabase(e.target.value)}
                  className="w-full rounded-md border border-stone-200 dark:border-zinc-800 bg-white/88 dark:bg-zinc-950/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t("settings.database.pgUser")}</label>
                <input
                  type="text"
                  value={pgUser}
                  onChange={(e) => setPgUser(e.target.value)}
                  className="w-full rounded-md border border-stone-200 dark:border-zinc-800 bg-white/88 dark:bg-zinc-950/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {t("settings.database.pgPassword")}
                </label>
                <input
                  type="password"
                  value={pgPassword}
                  onChange={(e) => setPgPassword(e.target.value)}
                  autoComplete="off"
                  className="w-full rounded-md border border-stone-200 dark:border-zinc-800 bg-white/88 dark:bg-zinc-950/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-zinc-700"
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-stone-200/90 dark:border-zinc-800/80 bg-stone-50/92 dark:bg-zinc-900/40 px-4 py-3 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">{t("settings.database.pgSsl")}</p>
                  <p className="text-xs text-stone-500 dark:text-zinc-500">{t("settings.database.pgSslSub")}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={pgSsl}
                    onChange={() => setPgSsl((v) => !v)}
                    className="sr-only peer"
                  />
                  <div className="h-6 w-11 rounded-full bg-stone-300 dark:bg-zinc-700 peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 after:content-['']" />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-stone-200 dark:border-zinc-800 pt-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-stone-900 dark:text-zinc-100">
                {t("settings.database.migrationsHeading")}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-zinc-500">
                {t("settings.database.migrationsDescription")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { handleTestConnection(); loadMigrations(); }}
                className="inline-flex items-center gap-2 rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-stone-800 dark:text-zinc-200 transition-colors hover:bg-stone-300 dark:hover:bg-zinc-800"
              >
                <RefreshCw className="h-4 w-4" />
                {t("settings.database.refreshStatus")}
              </button>
              <button
                type="button"
                disabled={pendingCount === 0 || migrationBusy}
                onClick={() => void handleRunMigrations()}
                className="inline-flex items-center gap-2 rounded-md bg-stone-900 dark:bg-zinc-100 px-3 py-2 text-sm font-medium text-white dark:text-zinc-950 transition-colors hover:bg-stone-800 dark:hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {migrationBusy ? "…" : t("settings.database.runMigrations")}
              </button>
            </div>
          </div>

          <p className="mb-4 text-xs text-stone-500 dark:text-zinc-500">{t("settings.database.runMigrationsSub")}</p>

          <div className="overflow-hidden rounded-lg border border-stone-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 dark:border-zinc-800 bg-white/92 dark:bg-zinc-950/90">
                <tr>
                  <th className="px-4 py-3 font-medium text-stone-600 dark:text-zinc-400">
                    {t("settings.database.colRevision")}
                  </th>
                  <th className="px-4 py-3 font-medium text-stone-600 dark:text-zinc-400">{t("settings.database.colName")}</th>
                  <th className="px-4 py-3 font-medium text-stone-600 dark:text-zinc-400">
                    {t("settings.database.colApplied")}
                  </th>
                  <th className="w-36 px-4 py-3 text-right font-medium text-stone-600 dark:text-zinc-400">
                    {t("settings.database.colStatus")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
                {migrations.map((row) => (
                  <tr key={row.id} className="bg-white/75 dark:bg-zinc-950/50 hover:bg-stone-100 dark:hover:bg-zinc-900/40">
                    <td className="px-4 py-3 font-mono text-xs text-stone-600 dark:text-zinc-400">{row.id}</td>
                    <td className="px-4 py-3 text-stone-800 dark:text-zinc-200">{row.name}</td>
                    <td className="px-4 py-3 text-stone-500 dark:text-zinc-500">
                      {row.appliedAt ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          row.status === "applied"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-amber-500/15 text-amber-400"
                        }`}
                      >
                        {row.status === "applied"
                          ? t("settings.database.statusApplied")
                          : t("settings.database.statusPending")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Terminal className="h-4 w-4 shrink-0 text-stone-500 dark:text-zinc-500" />
              <code className="truncate text-xs text-stone-600 dark:text-zinc-400">{cliExample}</code>
            </div>
            <button
              type="button"
              onClick={copyCli}
              className="inline-flex shrink-0 items-center gap-2 rounded-md border border-stone-300 dark:border-zinc-700 px-3 py-1.5 text-xs text-stone-700 dark:text-zinc-300 hover:bg-stone-300 dark:hover:bg-zinc-800"
            >
              <Copy className="h-3.5 w-3.5" />
              {cliCopied ? t("settings.database.cliCopied") : t("settings.database.cliCopy")}
            </button>
          </div>
          <p className="mt-2 text-xs text-stone-600 dark:text-zinc-600">{t("settings.database.cliHint")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-stone-200 dark:border-zinc-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
        {dbTestFlash && <span className="text-xs text-green-400 sm:mr-auto">{t("settings.database.testDemo")}</span>}
        {dbSaveFlash && <span className="text-xs text-green-400 sm:mr-auto">{t("settings.database.savedDemo")}</span>}
        <button
          type="button"
          onClick={handleTestConnection}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-2 text-sm text-stone-800 dark:text-zinc-200 transition-colors hover:bg-stone-300 dark:hover:bg-zinc-800 sm:order-1"
        >
          <Database className="h-4 w-4" />
          {t("settings.database.testConnection")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-900 dark:bg-zinc-100 px-6 py-2 text-sm font-medium text-white dark:text-zinc-950 transition-colors hover:bg-stone-800 dark:hover:bg-zinc-200"
        >
          <Save className="h-4 w-4" />
          {t("settings.database.saveChanges")}
        </button>
      </div>
    </>
  );
}

function IntegrationSettings() {
  const { t } = useI18n();
  return (
    <>
      <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold">{t("settings.integrations.heading")}</h2>
        <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">{t("settings.integrations.description")}</p>
      </div>
      <div className="p-6">
        <div className="bg-stone-100 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg p-6 text-center">
          <p className="text-stone-700 dark:text-zinc-300 mb-2 font-medium">{t("settings.integrations.bodyTitle")}</p>
          <p className="text-sm text-stone-500 dark:text-zinc-500 mb-4">{t("settings.integrations.bodyText")}</p>
          <Link to="/plugins" className="inline-flex items-center gap-2 px-5 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium text-sm">
            <Zap className="w-4 h-4" />
            {t("settings.integrations.goToPlugins")}
          </Link>
        </div>
      </div>
    </>
  );
}