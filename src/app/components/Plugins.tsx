import { useEffect, useState } from "react";
import { Cookie, Puzzle, Settings2, Sparkles, KeyRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "../i18n";

const GEMINI_API_KEY_STORAGE = "cms-plugin-gemini-api-key";
const GEMINI_MODEL_STORAGE = "cms-plugin-gemini-model";

interface PluginItem {
  id: string;
  i18nPrefix: string;
  version: string;
  icon: LucideIcon;
  /** Gemini: show API key & model configuration */
  kind?: "standard" | "gemini";
}

const plugins: PluginItem[] = [
  {
    id: "cookie-management",
    i18nPrefix: "plugins.cookie",
    version: "1.0.0",
    icon: Cookie,
    kind: "standard",
  },
  {
    id: "gemini-auto-translate",
    i18nPrefix: "plugins.gemini",
    version: "0.1.0",
    icon: Sparkles,
    kind: "gemini",
  },
];

function readStorage(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function Plugins() {
  const { t } = useI18n();
  const [enabledById, setEnabledById] = useState<Record<string, boolean>>({
    "cookie-management": true,
    "gemini-auto-translate": false,
  });

  const [geminiApiKey, setGeminiApiKey] = useState(() => readStorage(GEMINI_API_KEY_STORAGE));
  const [geminiModel, setGeminiModel] = useState(
    () => readStorage(GEMINI_MODEL_STORAGE) || "gemini-2.0-flash"
  );
  const [geminiSettingsOpen, setGeminiSettingsOpen] = useState(false);
  const [geminiSaveHint, setGeminiSaveHint] = useState(false);

  const geminiEnabled = enabledById["gemini-auto-translate"] ?? false;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cms-plugins-enabled");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        setEnabledById((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cms-plugins-enabled", JSON.stringify(enabledById));
    } catch {
      /* ignore */
    }
  }, [enabledById]);

  const persistGeminiCredentials = () => {
    try {
      localStorage.setItem(GEMINI_API_KEY_STORAGE, geminiApiKey);
      localStorage.setItem(GEMINI_MODEL_STORAGE, geminiModel);
      setGeminiSaveHint(true);
      window.setTimeout(() => setGeminiSaveHint(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const hasGeminiKey = geminiApiKey.trim().length > 0;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-zinc-800/80 border border-zinc-700/50 rounded-lg flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-zinc-300" />
            </div>
            <h1 className="text-3xl font-semibold">{t("plugins.title")}</h1>
          </div>
          <p className="text-zinc-400">{t("plugins.subtitle")}</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-xl font-semibold">{t("plugins.installedHeading")}</h2>
            <p className="text-sm text-zinc-400 mt-1">{t("plugins.installedDescription")}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {plugins.map((plugin) => {
                const Icon = plugin.icon;
                const enabled = enabledById[plugin.id] ?? false;
                const isGemini = plugin.kind === "gemini";

                return (
                  <div
                    key={plugin.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                            isGemini
                              ? "bg-cyan-500/15 border border-cyan-500/25"
                              : "bg-zinc-800"
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${isGemini ? "text-cyan-400" : "text-zinc-400"}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 gap-y-1">
                            <h3 className="font-semibold text-zinc-100">
                              {t(`${plugin.i18nPrefix}.name`)}
                            </h3>
                            <span className="text-xs text-zinc-500 font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800">
                              v{plugin.version}
                            </span>
                            {enabled ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                {t("plugins.active")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-500 border border-zinc-700/50">
                                {t("plugins.inactive")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                            {t(`${plugin.i18nPrefix}.description`)}
                          </p>

                          {isGemini && enabled && !hasGeminiKey && (
                            <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              {t("plugins.gemini.keyMissing")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2 shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => {
                              if (isGemini && !enabled) {
                                setGeminiSettingsOpen(true);
                              }
                              if (isGemini && enabled) {
                                setGeminiSettingsOpen(false);
                              }
                              setEnabledById((prev) => ({
                                ...prev,
                                [plugin.id]: !enabled,
                              }));
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                        <button
                          type="button"
                          disabled={!enabled}
                          onClick={() => {
                            if (isGemini) setGeminiSettingsOpen((o) => !o);
                            else alert("Cookie plugin settings (demo)");
                          }}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                            enabled
                              ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/50"
                              : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                          }`}
                        >
                          <Settings2 className="w-4 h-4" />
                          {t("plugins.configure")}
                        </button>
                      </div>
                    </div>

                    {isGemini && enabled && geminiSettingsOpen && (
                      <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-4">
                        <div>
                          <label
                            htmlFor="gemini-api-key"
                            className="block text-sm font-medium text-zinc-200 mb-2"
                          >
                            {t("plugins.gemini.apiKeyLabel")}
                          </label>
                          <input
                            id="gemini-api-key"
                            type="password"
                            autoComplete="off"
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            placeholder={t("plugins.gemini.apiKeyPlaceholder")}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 font-mono"
                          />
                          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                            {t("plugins.gemini.apiKeyHint")}
                          </p>
                        </div>
                        <div className="max-w-md">
                          <label
                            htmlFor="gemini-model"
                            className="block text-sm font-medium text-zinc-200 mb-2"
                          >
                            {t("plugins.gemini.modelLabel")}
                          </label>
                          <select
                            id="gemini-model"
                            value={geminiModel}
                            onChange={(e) => setGeminiModel(e.target.value)}
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                          >
                            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                            <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                            <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                            <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                          </select>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => persistGeminiCredentials()}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            {t("plugins.gemini.saveKey")}
                          </button>
                          {geminiSaveHint && (
                            <span className="text-xs text-green-400">{t("plugins.gemini.keySaved")}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50 px-4 py-6 text-center">
              <p className="text-sm text-zinc-500">{t("plugins.footer")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
