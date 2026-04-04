import { useState } from "react";
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
} from "lucide-react";
import { AccountSettings } from "./AccountSettings";
import { BackupSettings } from "./BackupSettings";
import { useI18n, type AdminLocale } from "../i18n";

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { t } = useI18n();

  const tabs = [
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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold mb-2">{t("settings.title")}</h1>
          <p className="text-zinc-400">{t("settings.subtitle")}</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Tabs */}
          <div className="col-span-3">
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg overflow-hidden">
              <div className="divide-y divide-zinc-800/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      activeTab === tab.id
                        ? "bg-zinc-800/70 backdrop-blur-sm text-zinc-100"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 backdrop-blur-sm"
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
          <div className="col-span-9">
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg">
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

function MenuBuilderSettings() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: "1", label: "Dashboard", href: "/", icon: "LayoutDashboard", enabled: true, order: 1 },
    { id: "2", label: "Content Types", href: "/content-types", icon: "Database", enabled: true, order: 2 },
    { id: "3", label: "Content Manager", href: "/content/articles", icon: "FileText", enabled: true, order: 3 },
    { id: "4", label: "Media Library", href: "/media", icon: "Image", enabled: true, order: 4 },
    { id: "5", label: "Users", href: "/users", icon: "Users", enabled: true, order: 5 },
    { id: "6", label: "API Permissions", href: "/api-permissions", icon: "Key", enabled: true, order: 6 },
  ]);

  const [showAddItem, setShowAddItem] = useState(false);

  const iconOptions = [
    "LayoutDashboard", "Database", "FileText", "Image", "Users", "Key",
    "Settings", "Layers", "Bell", "Globe", "Lock", "Palette", "Zap", "Mail"
  ];

  return (
    <>
      <div className="px-6 py-4 border-b border-zinc-800">
        <h2 className="text-xl font-semibold">Admin Menu Builder</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Customize the navigation menu of your admin panel
        </p>
      </div>

      <div className="p-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-zinc-400">
            ℹ️ Drag items to reorder. Toggle visibility to show/hide menu items. Changes will be reflected in the sidebar after saving.
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {menuItems
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <div
                key={item.id}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button className="p-1 text-zinc-600 hover:text-zinc-400 cursor-grab">
                    <GripVertical className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center">
                      <span className="text-xs text-zinc-400">{item.icon.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.label}</p>
                      <p className="text-sm text-zinc-500 truncate">{item.href}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => {
                          setMenuItems(
                            menuItems.map((mi) =>
                              mi.id === item.id ? { ...mi, enabled: !mi.enabled } : mi
                            )
                          );
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <button className="p-2 hover:bg-zinc-800 rounded transition-colors">
                      <Edit className="w-4 h-4 text-zinc-400" />
                    </button>
                    <button className="p-2 hover:bg-zinc-800 rounded transition-colors">
                      <Trash2 className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <button
          onClick={() => setShowAddItem(true)}
          className="w-full px-4 py-3 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors text-zinc-400 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Custom Menu Item
        </button>

        {showAddItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-2xl">
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <h2 className="text-xl font-semibold">Add Menu Item</h2>
                <button
                  onClick={() => setShowAddItem(false)}
                  className="p-2 hover:bg-zinc-800 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="My Custom Page"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    URL Path <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="/my-custom-page"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Icon</label>
                  <select className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700">
                    {iconOptions.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Enabled</p>
                    <p className="text-xs text-zinc-500">Show this item in the menu</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800">
                <button
                  onClick={() => setShowAddItem(false)}
                  className="px-4 py-2 text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium">
                  Add Menu Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
        <button className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium">
          <Save className="w-4 h-4" />
          Save Menu
        </button>
      </div>
    </>
  );
}

function GeneralSettings() {
  const { t } = useI18n();
  return (
    <>
      <div className="px-6 py-4 border-b border-zinc-800">
        <h2 className="text-xl font-semibold">{t("settings.general.heading")}</h2>
        <p className="text-sm text-zinc-400 mt-1">{t("settings.general.description")}</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("settings.general.applicationName")}
          </label>
          <input
            type="text"
            defaultValue="Headless CMS"
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("settings.general.applicationUrl")}
          </label>
          <input
            type="url"
            defaultValue="https://cms.example.com"
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("settings.general.defaultLanguage")}
          </label>
          <select className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700">
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("settings.general.timezone")}</label>
          <select className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700">
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
            defaultValue="A modern headless CMS for managing content"
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-none"
          />
        </div>
      </div>

      <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
        <button className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium">
          <Save className="w-4 h-4" />
          {t("settings.general.saveChanges")}
        </button>
      </div>
    </>
  );
}

function I18nSettings() {
  const [selectedLocales, setSelectedLocales] = useState(["en", "tr", "de", "fr"]);
  const [defaultLocale, setDefaultLocale] = useState("en");
  const [showAddLocale, setShowAddLocale] = useState(false);

  // Comprehensive world languages list
  const allLocales = [
    { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
    { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
    { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
    { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
    { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
    { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
    { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
    { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
    { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
    { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
    { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
    { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
    { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
    { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
    { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
    { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
    { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
    { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
    { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
    { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
    { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
    { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
    { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺" },
    { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
    { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱" },
    { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷" },
    { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
    { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪" },
  ];

  const enabledLocales = allLocales.filter((l) => selectedLocales.includes(l.code));
  const availableLocales = allLocales.filter((l) => !selectedLocales.includes(l.code));

  return (
    <>
      <div className="px-6 py-4 border-b border-zinc-800">
        <h2 className="text-xl font-semibold">Internationalization Settings</h2>
        <p className="text-sm text-zinc-400 mt-1">
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
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
          >
            {enabledLocales.map((locale) => (
              <option key={locale.code} value={locale.code}>
                {locale.flag} {locale.name} ({locale.nativeName})
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500 mt-2">
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
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Language
            </button>
          </div>

          <div className="space-y-2">
            {enabledLocales.map((locale) => (
              <div
                key={locale.code}
                className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
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
                    <p className="text-sm text-zinc-400">
                      {locale.nativeName} • {locale.code}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {locale.code === defaultLocale ? (
                    <span className="text-sm text-zinc-500">Cannot remove default</span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedLocales(selectedLocales.filter((c) => c !== locale.code));
                      }}
                      className="p-2 hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-zinc-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* i18n Features */}
        <div className="pt-6 border-t border-zinc-800">
          <h3 className="text-sm font-medium mb-3">Features</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-sm">Locale Switcher in Editor</p>
                <p className="text-xs text-zinc-500">
                  Show language selector when editing content
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-sm">Auto-translate</p>
                <p className="text-xs text-zinc-500">
                  Suggest translations when creating new locales
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Add Locale Modal */}
      {showAddLocale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
              <div>
                <h2 className="text-xl font-semibold">Add Language</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Select languages to enable for your content
                </p>
              </div>
              <button
                onClick={() => setShowAddLocale(false)}
                className="p-2 hover:bg-zinc-800/50 rounded transition-colors"
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
                    className="flex items-center gap-3 p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-lg hover:border-zinc-700/50 hover:bg-zinc-800/30 transition-colors text-left"
                  >
                    <span className="text-2xl">{locale.flag}</span>
                    <div>
                      <p className="font-medium">{locale.name}</p>
                      <p className="text-sm text-zinc-400">
                        {locale.nativeName} • {locale.code}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800/50">
              <button
                onClick={() => setShowAddLocale(false)}
                className="px-4 py-2 text-zinc-300 hover:text-zinc-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
        <button className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </>
  );
}

function PageAccessSettings() {
  return (
    <>
      <div className="px-6 py-4 border-b border-zinc-800">
        <h2 className="text-xl font-semibold">Page Access Settings</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Configure access permissions for different pages
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium">Dashboard</h3>
              <p className="text-sm text-zinc-400">
                Access to the main dashboard
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium">Content Types</h3>
              <p className="text-sm text-zinc-400">
                Access to content type management
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium">Content Manager</h3>
              <p className="text-sm text-zinc-400">
                Access to content management
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium">Media Library</h3>
              <p className="text-sm text-zinc-400">
                Access to media library management
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium">Users</h3>
              <p className="text-sm text-zinc-400">
                Access to user management
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium">API Permissions</h3>
              <p className="text-sm text-zinc-400">
                Access to API permission management
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
        <button className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </>
  );
}

function SecuritySettings() {
  return (
    <>
      <div className="px-6 py-4 border-b border-zinc-800">
        <h2 className="text-xl font-semibold">Security Settings</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Manage authentication and security options
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-zinc-400">
                Require 2FA for all users
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium">API Rate Limiting</h3>
              <p className="text-sm text-zinc-400">
                Enable rate limiting for API requests
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            defaultValue="60"
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Password Policy
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm">Minimum 8 characters</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm">Require uppercase letters</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm">Require numbers</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm">Require special characters</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Allowed Origins (CORS)
          </label>
          <textarea
            rows={4}
            placeholder="https://example.com&#10;https://app.example.com"
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-none font-mono text-sm"
          />
          <p className="text-xs text-zinc-500 mt-2">
            One origin per line. Leave empty to allow all origins.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
        <button className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </>
  );
}

function NotificationSettings() {
  return (
    <>
      <div className="px-6 py-4 border-b border-zinc-800">
        <h2 className="text-xl font-semibold">Notification Settings</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Configure how and when you receive notifications
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="font-medium mb-4">Email Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-sm">New User Registration</p>
                <p className="text-xs text-zinc-500">
                  Get notified when new users sign up
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </label>

            <label className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-sm">Content Published</p>
                <p className="text-xs text-zinc-500">
                  Get notified when content is published
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </label>

            <label className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-sm">API Errors</p>
                <p className="text-xs text-zinc-500">
                  Get notified about API errors
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </label>

            <label className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div>
                <p className="font-medium text-sm">System Updates</p>
                <p className="text-xs text-zinc-500">
                  Get notified about system updates
                </p>
              </div>
              <input type="checkbox" className="w-4 h-4" />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Notification Email
          </label>
          <input
            type="email"
            defaultValue="admin@example.com"
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700"
          />
        </div>
      </div>

      <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
        <button className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </>
  );
}

function AppearanceSettings() {
  const { t, locale, setLocale, panelLanguageOptions } = useI18n();
  return (
    <>
      <div className="px-6 py-4 border-b border-zinc-800">
        <h2 className="text-xl font-semibold">{t("settings.appearance.heading")}</h2>
        <p className="text-sm text-zinc-400 mt-1">{t("settings.appearance.description")}</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("settings.appearance.panelLanguage")}
          </label>
          <div className="relative w-full max-w-md">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as AdminLocale)}
              className="h-10 w-full cursor-pointer appearance-none rounded-md border border-zinc-800 bg-zinc-950 py-2 pl-3 pr-10 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700"
            >
              {panelLanguageOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
          </div>
          <p className="text-xs text-zinc-500 mt-2 max-w-2xl leading-relaxed">
            {t("settings.appearance.panelLanguageHint")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("settings.appearance.theme")}</label>
          <div className="grid grid-cols-2 gap-4">
            <label className="relative cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="dark"
                defaultChecked
                className="sr-only peer"
              />
              <div className="p-4 border-2 border-zinc-800 rounded-lg peer-checked:border-zinc-100 transition-colors">
                <div className="w-full h-32 bg-zinc-950 rounded mb-3"></div>
                <p className="font-medium">{t("settings.appearance.darkMode")}</p>
                <p className="text-sm text-zinc-400">{t("settings.appearance.darkModeSub")}</p>
              </div>
            </label>

            <label className="relative cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="light"
                className="sr-only peer"
              />
              <div className="p-4 border-2 border-zinc-800 rounded-lg peer-checked:border-zinc-100 transition-colors">
                <div className="w-full h-32 bg-zinc-100 rounded mb-3"></div>
                <p className="font-medium">{t("settings.appearance.lightMode")}</p>
                <p className="text-sm text-zinc-400">{t("settings.appearance.lightModeSub")}</p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("settings.appearance.logo")}</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎨</span>
            </div>
            <div>
              <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm">
                {t("settings.appearance.uploadLogo")}
              </button>
              <p className="text-xs text-zinc-500 mt-2">{t("settings.appearance.logoHint")}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t("settings.appearance.accentColor")}</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              defaultValue="#ffffff"
              className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded cursor-pointer"
            />
            <input
              type="text"
              defaultValue="#ffffff"
              className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700 font-mono"
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
        <button className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium">
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
  const [driver, setDriver] = useState<DbDriver>("postgres");
  const [sqlitePath, setSqlitePath] = useState("./data/cms.sqlite");
  const [pgHost, setPgHost] = useState("localhost");
  const [pgPort, setPgPort] = useState("5432");
  const [pgDatabase, setPgDatabase] = useState("wolent_cms");
  const [pgUser, setPgUser] = useState("cms");
  const [pgPassword, setPgPassword] = useState("");
  const [pgSsl, setPgSsl] = useState(true);
  const [migrations, setMigrations] = useState<MigrationRow[]>([
    {
      id: "20260301000000",
      name: "init_core_tables",
      status: "applied",
      appliedAt: "2026-03-01",
    },
    {
      id: "20260315120000",
      name: "add_locale_columns",
      status: "applied",
      appliedAt: "2026-03-15",
    },
    {
      id: "20260404000000",
      name: "media_folder_indexes",
      status: "pending",
      appliedAt: null,
    },
  ]);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [cliCopied, setCliCopied] = useState(false);

  const cliExample =
    driver === "sqlite"
      ? "npx prisma migrate deploy --schema=./prisma/schema.sqlite.prisma"
      : "npx prisma migrate deploy";

  const pendingCount = migrations.filter((m) => m.status === "pending").length;

  const handleSave = () => {
    window.alert(t("settings.database.savedDemo"));
  };

  const handleTestConnection = () => {
    window.alert(t("settings.database.testDemo"));
  };

  const handleRunMigrations = () => {
    if (pendingCount === 0) return;
    setMigrationBusy(true);
    window.setTimeout(() => {
      setMigrations((prev) =>
        prev.map((m) =>
          m.status === "pending"
            ? {
                ...m,
                status: "applied" as const,
                appliedAt: new Date().toISOString().split("T")[0],
              }
            : m
        )
      );
      setMigrationBusy(false);
      window.alert(t("settings.database.migrateDemoDone"));
    }, 800);
  };

  const copyCli = () => {
    void navigator.clipboard.writeText(cliExample);
    setCliCopied(true);
    window.setTimeout(() => setCliCopied(false), 2000);
  };

  return (
    <>
      <div className="px-6 py-4 border-b border-zinc-800">
        <h2 className="text-xl font-semibold">{t("settings.database.heading")}</h2>
        <p className="text-sm text-zinc-400 mt-1">{t("settings.database.description")}</p>
      </div>

      <div className="p-6 space-y-8">
        <div className="rounded-lg border border-zinc-700/60 bg-zinc-950/80 p-4">
          <div className="flex items-start gap-3">
            <Terminal className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" />
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {t("settings.database.bannerTitle")}
              </p>
              <p className="mt-1 text-sm text-zinc-500">{t("settings.database.bannerBody")}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-zinc-300">
            {t("settings.database.driverLabel")}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setDriver("sqlite")}
              className={`rounded-lg border p-4 text-left transition-colors ${
                driver === "sqlite"
                  ? "border-zinc-100/90 bg-zinc-800/40 ring-1 ring-zinc-600/80"
                  : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                  <HardDrive className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="font-semibold text-zinc-100">{t("settings.database.sqlite")}</span>
              </div>
              <p className="text-sm text-zinc-500">{t("settings.database.sqliteDesc")}</p>
            </button>
            <button
              type="button"
              onClick={() => setDriver("postgres")}
              className={`rounded-lg border p-4 text-left transition-colors ${
                driver === "postgres"
                  ? "border-zinc-100/90 bg-zinc-800/40 ring-1 ring-zinc-600/80"
                  : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                  <Server className="h-5 w-5 text-sky-400" />
                </div>
                <span className="font-semibold text-zinc-100">{t("settings.database.postgres")}</span>
              </div>
              <p className="text-sm text-zinc-500">{t("settings.database.postgresDesc")}</p>
            </button>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-medium text-zinc-300">
            {t("settings.database.connectionHeading")}
          </h3>
          {driver === "sqlite" ? (
            <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <label className="block text-sm font-medium">{t("settings.database.sqlitePath")}</label>
              <input
                type="text"
                value={sqlitePath}
                onChange={(e) => setSqlitePath(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
              <p className="text-xs text-zinc-500">{t("settings.database.sqlitePathHint")}</p>
            </div>
          ) : (
            <div className="grid gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">{t("settings.database.pgHost")}</label>
                <input
                  type="text"
                  value={pgHost}
                  onChange={(e) => setPgHost(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t("settings.database.pgPort")}</label>
                <input
                  type="text"
                  value={pgPort}
                  onChange={(e) => setPgPort(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-700"
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
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t("settings.database.pgUser")}</label>
                <input
                  type="text"
                  value={pgUser}
                  onChange={(e) => setPgUser(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-700"
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
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">{t("settings.database.pgSsl")}</p>
                  <p className="text-xs text-zinc-500">{t("settings.database.pgSslSub")}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={pgSsl}
                    onChange={() => setPgSsl((v) => !v)}
                    className="sr-only peer"
                  />
                  <div className="h-6 w-11 rounded-full bg-zinc-700 peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 after:content-['']" />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800 pt-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">
                {t("settings.database.migrationsHeading")}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-zinc-500">
                {t("settings.database.migrationsDescription")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMigrations((m) => [...m])}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
              >
                <RefreshCw className="h-4 w-4" />
                {t("settings.database.refreshStatus")}
              </button>
              <button
                type="button"
                disabled={pendingCount === 0 || migrationBusy}
                onClick={handleRunMigrations}
                className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {migrationBusy ? "…" : t("settings.database.runMigrations")}
              </button>
            </div>
          </div>

          <p className="mb-4 text-xs text-zinc-500">{t("settings.database.runMigrationsSub")}</p>

          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/90">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-400">
                    {t("settings.database.colRevision")}
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-400">{t("settings.database.colName")}</th>
                  <th className="px-4 py-3 font-medium text-zinc-400">
                    {t("settings.database.colApplied")}
                  </th>
                  <th className="w-36 px-4 py-3 text-right font-medium text-zinc-400">
                    {t("settings.database.colStatus")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {migrations.map((row) => (
                  <tr key={row.id} className="bg-zinc-950/50 hover:bg-zinc-900/40">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{row.id}</td>
                    <td className="px-4 py-3 text-zinc-200">{row.name}</td>
                    <td className="px-4 py-3 text-zinc-500">
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

          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Terminal className="h-4 w-4 shrink-0 text-zinc-500" />
              <code className="truncate text-xs text-zinc-400">{cliExample}</code>
            </div>
            <button
              type="button"
              onClick={copyCli}
              className="inline-flex shrink-0 items-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              <Copy className="h-3.5 w-3.5" />
              {cliCopied ? t("settings.database.cliCopied") : t("settings.database.cliCopy")}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-600">{t("settings.database.cliHint")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-800 px-6 py-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleTestConnection}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-5 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 sm:order-1"
        >
          <Database className="h-4 w-4" />
          {t("settings.database.testConnection")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-100 px-6 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          <Save className="h-4 w-4" />
          {t("settings.database.saveChanges")}
        </button>
      </div>
    </>
  );
}

function IntegrationSettings() {
  const integrations = [
    {
      name: "Webhooks",
      description: "Send data to external services",
      icon: Zap,
      connected: true,
    },
    {
      name: "Email Service",
      description: "SMTP configuration for emails",
      icon: Mail,
      connected: true,
    },
    {
      name: "Cloud Storage",
      description: "Amazon S3, Google Cloud Storage",
      icon: Database,
      connected: false,
    },
    {
      name: "Authentication",
      description: "OAuth providers (Google, GitHub)",
      icon: Shield,
      connected: false,
    },
  ];

  return (
    <>
      <div className="px-6 py-4 border-b border-zinc-800">
        <h2 className="text-xl font-semibold">Integrations</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Connect external services and tools
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center">
                    <integration.icon className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{integration.name}</h3>
                    <p className="text-sm text-zinc-400">
                      {integration.description}
                    </p>
                    {integration.connected && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 mt-2">
                        Connected
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className={`px-4 py-2 rounded-md text-sm transition-colors ${
                    integration.connected
                      ? "bg-zinc-800 hover:bg-zinc-700"
                      : "bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                  }`}
                >
                  {integration.connected ? "Configure" : "Connect"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}