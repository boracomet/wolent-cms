/**
 * First-run Setup Wizard — 5-step onboarding.
 * Steps: database → welcome → admin → settings → security → done
 * Shown automatically when /api/setup/status returns { required: true }.
 */
import { useState } from "react";
import {
  Layers,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  QrCode,
  Copy,
  Download,
  Globe,
  BarChart3,
  Image,
  Map,
  Bot,
  Puzzle,
  Bell,
  Lock,
  ChevronRight,
  Languages,
  Clock,
  FileText,
  Database,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetupInput {
  // Step 1 — Site
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  language: string;
  timezone: string;
  // Step 2 — Admin
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FeatureToggle {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  defaultEnabled: boolean;
  recommended?: boolean;
}

interface Props {
  onComplete: () => void;
}

type Step = "database" | "welcome" | "admin" | "settings" | "security" | "done";

// ─── Feature list ─────────────────────────────────────────────────────────────

const FEATURES: FeatureToggle[] = [
  {
    id: "native-analytics",
    label: "Native Analytics",
    description: "Track page views and visitor sessions within your CMS.",
    icon: BarChart3,
    defaultEnabled: true,
    recommended: true,
  },
  {
    id: "sitemap-xml",
    label: "Sitemap XML",
    description: "Auto-generate /sitemap.xml for search engine indexing.",
    icon: Map,
    defaultEnabled: true,
    recommended: true,
  },
  {
    id: "robots-txt",
    label: "Robots.txt",
    description: "Editable robots.txt served from your CMS domain.",
    icon: Globe,
    defaultEnabled: true,
  },
  {
    id: "image-optimization",
    label: "Image Optimization",
    description: "Auto-convert uploads to WebP and generate responsive srcset.",
    icon: Image,
    defaultEnabled: true,
    recommended: true,
  },
  {
    id: "cookie-management",
    label: "Cookie Consent Banner",
    description: "GDPR-compliant cookie consent widget for your frontend.",
    icon: Bell,
    defaultEnabled: true,
  },
  {
    id: "gemini-auto-translate",
    label: "AI Auto-Translate",
    description: "Use Google Gemini to translate content between locales.",
    icon: Bot,
    defaultEnabled: false,
  },
  {
    id: "outbound-webhook",
    label: "Outbound Webhooks",
    description: "Push content lifecycle events to external services.",
    icon: Puzzle,
    defaultEnabled: false,
  },
];

// ─── Locale & Timezone options ────────────────────────────────────────────────

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "nl", label: "Nederlands" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
];

const TIMEZONES = [
  "UTC",
  "Europe/Istanbul",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

// Default content locales for i18n settings step
const CONTENT_LOCALES = [
  { code: "en", label: "English 🇬🇧" },
  { code: "tr", label: "Türkçe 🇹🇷" },
  { code: "de", label: "Deutsch 🇩🇪" },
  { code: "fr", label: "Français 🇫🇷" },
  { code: "es", label: "Español 🇪🇸" },
  { code: "it", label: "Italiano 🇮🇹" },
  { code: "pt", label: "Português 🇵🇹" },
  { code: "nl", label: "Nederlands 🇳🇱" },
  { code: "ru", label: "Русский 🇷🇺" },
  { code: "ar", label: "العربية 🇸🇦" },
  { code: "ja", label: "日本語 🇯🇵" },
  { code: "zh", label: "中文 🇨🇳" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState<Step>("database");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [databaseProvider, setDatabaseProvider] = useState<"sqlite" | "postgresql">("sqlite");
  const [databaseUrl, setDatabaseUrl] = useState("file:./dev.db");
  const [dbCheckLoading, setDbCheckLoading] = useState(false);
  const [dbTestOk, setDbTestOk] = useState(false);
  const [restartRecommended, setRestartRecommended] = useState(false);

  // Step 1 — site info (auto-detect timezone + siteUrl from browser)
  const [input, setInput] = useState<SetupInput>(() => {
    const detectedTz = (() => {
      try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; }
    })();
    const knownTz = TIMEZONES.includes(detectedTz) ? detectedTz : "UTC";
    const detectedUrl = (() => {
      try {
        const o = window.location.origin;
        // Skip localhost/127 — not useful as a real site URL
        return o.includes("localhost") || o.includes("127.0.0.1") ? "" : o;
      } catch { return ""; }
    })();
    return {
      siteName: "My Wolent CMS",
      siteUrl: detectedUrl,
      siteDescription: "",
      language: "en",
      timezone: knownTz,
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
  });

  // Step 3 — features
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>(
    Object.fromEntries(FEATURES.map((f) => [f.id, f.defaultEnabled]))
  );

  // Step 3 — content locales
  const [contentLocales, setContentLocales] = useState<string[]>(["en", "tr"]);

  // Step 4 — MFA (optional)
  const [mfaSkipped, setMfaSkipped] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaBackupVisible, setMfaBackupVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_adminUserId, setAdminUserId] = useState<string | null>(null);

  function update(field: keyof SetupInput, value: string) {
    setInput((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function normalizeDatabaseUrl(): string {
    const t = databaseUrl.trim();
    if (databaseProvider === "sqlite") {
      if (t.startsWith("file:")) return t;
      if (t.startsWith("/")) return `file:${t}`;
      return `file:${t.startsWith("./") ? t : `./${t}`}`;
    }
    return t;
  }

  function setProvider(next: "sqlite" | "postgresql") {
    setDatabaseProvider(next);
    setDbTestOk(false);
    setError(null);
    if (next === "sqlite") setDatabaseUrl("file:./dev.db");
    else setDatabaseUrl("");
  }

  async function runDatabaseCheck(): Promise<boolean> {
    const url = normalizeDatabaseUrl();
    if (databaseProvider === "postgresql" && !url) {
      setError("PostgreSQL connection string is required.");
      return false;
    }
    const res = await fetch("/api/setup/check-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ databaseUrl: url, provider: databaseProvider }),
    });
    const json = await res.json() as { data?: { ok: boolean }; error?: { message: string } };
    if (!res.ok) {
      setError(json.error?.message ?? "Database connection failed.");
      return false;
    }
    setError(null);
    return true;
  }

  async function handleTestDatabase() {
    setDbCheckLoading(true);
    setError(null);
    setDbTestOk(false);
    try {
      const ok = await runDatabaseCheck();
      if (ok) setDbTestOk(true);
    } catch {
      setError("Cannot reach the server. Make sure the API is running.");
    } finally {
      setDbCheckLoading(false);
    }
  }

  async function handleDatabaseContinue() {
    setLoading(true);
    setError(null);
    setDbTestOk(false);
    try {
      const ok = await runDatabaseCheck();
      if (!ok) return;
      setDbTestOk(true);
      setStep("welcome");
    } catch {
      setError("Cannot reach the server. Make sure the API is running.");
    } finally {
      setLoading(false);
    }
  }

  function toggleFeature(id: string) {
    setEnabledFeatures((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleLocale(code: string) {
    setContentLocales((prev) =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter((c) => c !== code) : prev // always keep at least 1
        : [...prev, code]
    );
  }

  // Step 1 → Step 2: save general settings, proceed
  async function handleWelcomeContinue() {
    if (!input.siteName.trim()) return setError("Site name is required");
    setError(null);
    // Save general settings async (non-critical)
    const token = localStorage.getItem("wolent_access_token") ?? "";
    if (token) {
      fetch("/api/admin/settings/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Wolent-Tenant": "default" },
        body: JSON.stringify({ appName: input.siteName, appUrl: input.siteUrl, description: input.siteDescription, language: input.language, timezone: input.timezone }),
      }).catch(() => {/* non-critical */});
    }
    setStep("admin");
  }

  // Step 2 → Step 3: create admin account
  async function handleAdminContinue() {
    if (!input.firstName.trim()) return setError("First name is required");
    if (!input.lastName.trim()) return setError("Last name is required");
    if (!input.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      return setError("Valid email address is required");
    }
    if (input.password.length < 8) return setError("Password must be at least 8 characters");
    if (!/[A-Z]/.test(input.password)) return setError("Password must contain at least one uppercase letter");
    if (!/[0-9]/.test(input.password)) return setError("Password must contain at least one number");
    if (input.password !== input.confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: input.siteName || "My CMS",
          siteUrl: input.siteUrl || undefined,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          password: input.password,
          databaseProvider,
          databaseUrl: normalizeDatabaseUrl(),
        }),
      });

      const json = await res.json() as {
        data?: { ok: boolean; userId?: string; accessToken?: string; restartRecommended?: boolean };
        error?: { message: string };
      };

      if (res.status === 403) {
        // Setup already completed (e.g. ?setup=1 forced wizard) — skip account
        // creation, go straight to settings using the existing token.
        setStep("settings");
        return;
      }

      if (!res.ok) {
        setError(json.error?.message ?? "Setup failed. Please try again.");
        return;
      }

      if (json.data?.userId) setAdminUserId(json.data.userId);
      if (json.data?.accessToken) {
        localStorage.setItem("wolent_access_token", json.data.accessToken);
      }
      setRestartRecommended(!!json.data?.restartRecommended);
      setStep("settings");
    } catch {
      setError("Cannot reach the server. Make sure the API is running on port 3000.");
    } finally {
      setLoading(false);
    }
  }

  // Step 3 → Step 4: save plugin toggles + i18n settings
  async function handleSettingsContinue() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("wolent_access_token") ?? "";
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Wolent-Tenant": "default",
      };

      // Save plugin toggles
      await Promise.allSettled(
        Object.entries(enabledFeatures).map(([pluginId, enabled]) =>
          fetch(`/api/admin/plugins/${pluginId}/toggle`, {
            method: "POST",
            headers,
            body: JSON.stringify({ enabled }),
          })
        )
      );

      // Save general settings (site name, language, timezone)
      await fetch("/api/admin/settings/general", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          appName: input.siteName,
          appUrl: input.siteUrl || undefined,
          description: input.siteDescription || undefined,
          language: input.language,
          timezone: input.timezone,
        }),
      }).catch(() => {/* non-critical */});

      // Save i18n locale list
      await fetch("/api/admin/settings/i18n", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          selectedLocales: contentLocales,
          defaultLocale: contentLocales[0] ?? "en",
          localeSwitcherEnabled: contentLocales.length > 1,
        }),
      }).catch(() => {/* non-critical */});

    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
    setStep("security");
  }

  // Step 4: Start MFA setup
  async function handleStartMfa() {
    setMfaLoading(true);
    setMfaError(null);
    try {
      const token = localStorage.getItem("wolent_access_token") ?? "";
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "X-Wolent-Tenant": "default" },
      });
      const json = await res.json() as {
        data?: { secret: string; qrCode: string; backupCodes: string[] };
        error?: { message: string };
      };
      if (!res.ok) throw new Error(json.error?.message ?? "MFA setup failed");
      setMfaSetupData(json.data ?? null);
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : "MFA setup failed");
    } finally {
      setMfaLoading(false);
    }
  }

  // Step 4: Confirm MFA with TOTP code
  async function handleConfirmMfa() {
    if (mfaCode.length !== 6) return setMfaError("Enter the 6-digit code from your authenticator app");
    setMfaLoading(true);
    setMfaError(null);
    try {
      const token = localStorage.getItem("wolent_access_token") ?? "";
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Wolent-Tenant": "default" },
        body: JSON.stringify({ totpCode: mfaCode }),
      });
      const json = await res.json() as { data?: { backupCodes?: string[] }; error?: { message: string } };
      if (!res.ok) throw new Error(json.error?.message ?? "Invalid code");
      if (json.data?.backupCodes) {
        setMfaSetupData(prev => prev ? { ...prev, backupCodes: json.data!.backupCodes! } : prev);
      }
      setMfaEnabled(true);
      setMfaBackupVisible(true);
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setMfaLoading(false);
    }
  }

  function downloadBackupCodes() {
    if (!mfaSetupData?.backupCodes?.length) return;
    const blob = new Blob([mfaSetupData.backupCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wolent-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const fieldClass =
    "w-full h-11 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/50 focus:border-zinc-600 transition-colors";
  const selectClass =
    "w-full h-11 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600/50 focus:border-zinc-600 transition-colors";
  const labelClass = "block text-sm font-medium text-zinc-300 mb-1.5";

  const STEPS: Step[] = ["database", "welcome", "admin", "settings", "security"];
  const stepIndex = STEPS.indexOf(step);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Wolent CMS</h1>
            <p className="text-xs text-zinc-500">Setup Wizard</p>
          </div>
        </div>

        {/* ── Step: Database ─────────────────────────────────────────────── */}
        {step === "database" && (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-medium">1</span>
                <span>Step 1 of 5</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-7 h-7 text-sky-400" />
                <h2 className="text-2xl font-semibold">Choose your database</h2>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                SQLite is ideal for local development. PostgreSQL is recommended for production. The connection is checked on this server before continuing.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {dbTestOk && !error && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-400">
                <Check className="w-4 h-4 shrink-0" />
                Connection successful. You can continue.
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider("sqlite")}
                  className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                    databaseProvider === "sqlite"
                      ? "border-sky-500/50 bg-sky-500/10 text-zinc-100"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  <span className="font-medium block">SQLite</span>
                  <span className="text-xs text-zinc-500 mt-1 block">Single file, no server</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProvider("postgresql")}
                  className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                    databaseProvider === "postgresql"
                      ? "border-sky-500/50 bg-sky-500/10 text-zinc-100"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  <span className="font-medium block">PostgreSQL</span>
                  <span className="text-xs text-zinc-500 mt-1 block">Server database</span>
                </button>
              </div>

              <div>
                <label className={labelClass}>
                  {databaseProvider === "sqlite" ? "SQLite path (Prisma file: URL)" : "Connection string"}
                </label>
                <input
                  type="text"
                  className={`${fieldClass} font-mono text-xs`}
                  placeholder={
                    databaseProvider === "sqlite"
                      ? "file:./dev.db"
                      : "postgresql://user:pass@localhost:5432/wolent_cms?schema=public"
                  }
                  value={databaseUrl}
                  onChange={(e) => {
                    setDatabaseUrl(e.target.value);
                    setDbTestOk(false);
                    setError(null);
                  }}
                  autoFocus
                />
                {databaseProvider === "sqlite" && (
                  <p className="text-xs text-zinc-600 mt-2">
                    Paths are relative to <code className="text-zinc-500">packages/database/prisma/</code> unless you use an absolute <code className="text-zinc-500">file:/…</code> URL.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleTestDatabase}
                  disabled={dbCheckLoading}
                  className="h-10 px-4 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {dbCheckLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Test connection
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDatabaseContinue}
              disabled={loading}
              className="w-full h-11 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Verifying…" : "Continue"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* ── Step: Welcome / Site Info ──────────────────────────────────── */}
        {step === "welcome" && (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-medium">2</span>
                <span>Step 2 of 5</span>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to Wolent CMS 👋</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Let's configure your CMS. This takes about 2 minutes.
              </p>
            </div>

            {/* Step overview cards */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { step: "1", label: "Database", icon: Database, active: false },
                { step: "2", label: "Site info", icon: Globe, active: true },
                { step: "3", label: "Admin account", icon: Lock, active: false },
                { step: "4", label: "Features & locales", icon: Puzzle, active: false },
                { step: "5", label: "Security (2FA)", icon: Shield, active: false },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.step} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${s.active ? "bg-zinc-800/80 text-zinc-200" : "bg-zinc-900/50 text-zinc-500"}`}>
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${s.active ? "text-zinc-300" : "text-zinc-600"}`} />
                    {s.label}
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  Site Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className={fieldClass}
                  placeholder="My Awesome Site"
                  value={input.siteName}
                  onChange={(e) => update("siteName", e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className={labelClass}>
                  Site URL <span className="text-zinc-600 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  className={fieldClass}
                  placeholder="https://example.com"
                  value={input.siteUrl}
                  onChange={(e) => update("siteUrl", e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Site Description <span className="text-zinc-600 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  className={fieldClass}
                  placeholder="A brief description of your site"
                  value={input.siteDescription}
                  onChange={(e) => update("siteDescription", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> Panel Language</span>
                  </label>
                  <select
                    className={selectClass}
                    value={input.language}
                    onChange={(e) => update("language", e.target.value)}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Timezone</span>
                  </label>
                  <select
                    className={selectClass}
                    value={input.timezone}
                    onChange={(e) => update("timezone", e.target.value)}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("database")}
                className="h-11 px-5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleWelcomeContinue}
                className="flex-1 h-11 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Admin account ────────────────────────────────────────── */}
        {step === "admin" && (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-medium">3</span>
                <span>Step 3 of 5</span>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Create Admin Account</h2>
              <p className="text-zinc-400 text-sm">This will be your super admin account.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input
                    type="text"
                    className={fieldClass}
                    placeholder="John"
                    value={input.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    type="text"
                    className={fieldClass}
                    placeholder="Doe"
                    value={input.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  className={fieldClass}
                  placeholder="admin@example.com"
                  value={input.email}
                  onChange={(e) => update("email", e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${fieldClass} pr-11`}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={input.password}
                    onChange={(e) => update("password", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {input.password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[
                        input.password.length >= 8,
                        /[A-Z]/.test(input.password),
                        /[0-9]/.test(input.password),
                        /[^A-Za-z0-9]/.test(input.password),
                      ].map((ok, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${ok ? "bg-emerald-500" : "bg-zinc-700"}`} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {[
                        { label: "8+ chars", ok: input.password.length >= 8 },
                        { label: "Uppercase", ok: /[A-Z]/.test(input.password) },
                        { label: "Number", ok: /[0-9]/.test(input.password) },
                        { label: "Special", ok: /[^A-Za-z0-9]/.test(input.password) },
                      ].map(({ label, ok }) => (
                        <span key={label} className={`text-[11px] flex items-center gap-1 ${ok ? "text-emerald-400" : "text-zinc-600"}`}>
                          <span>{ok ? "✓" : "○"}</span>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Confirm Password</label>
                <input
                  type="password"
                  className={`${fieldClass} ${input.confirmPassword && input.confirmPassword !== input.password ? "border-red-500/50" : ""}`}
                  placeholder="Repeat password"
                  value={input.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                />
                {input.confirmPassword && input.confirmPassword !== input.password && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("welcome")}
                className="h-11 px-5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleAdminContinue}
                disabled={loading}
                className="flex-1 h-11 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Setting up…" : "Continue"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Features & Locales ───────────────────────────────────── */}
        {step === "settings" && (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-medium">4</span>
                <span>Step 4 of 5</span>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Features & Locales</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Enable built-in features and choose which content languages to support. You can change these anytime.
              </p>
            </div>

            {/* ── Built-in features ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
                  <Puzzle className="w-4 h-4 text-zinc-500" /> Built-in features
                </p>
                <div className="flex gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setEnabledFeatures(Object.fromEntries(FEATURES.map(f => [f.id, true])))}
                    className="text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Select all
                  </button>
                  <span className="text-zinc-700">·</span>
                  <button
                    type="button"
                    onClick={() => setEnabledFeatures(Object.fromEntries(FEATURES.map(f => [f.id, false])))}
                    className="text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Clear
                  </button>
                  <span className="text-zinc-600">
                    {Object.values(enabledFeatures).filter(Boolean).length}/{FEATURES.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {FEATURES.map((f) => {
                  const Icon = f.icon;
                  const enabled = enabledFeatures[f.id] ?? f.defaultEnabled;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFeature(f.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                        enabled ? "border-zinc-700/60 bg-zinc-800/50" : "border-zinc-800/40 bg-zinc-900/30 opacity-60 hover:opacity-80"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded shrink-0 flex items-center justify-center border transition-colors ${enabled ? "bg-zinc-100 border-zinc-100" : "bg-transparent border-zinc-600"}`}>
                        {enabled && <Check className="w-3.5 h-3.5 text-zinc-950" />}
                      </div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${enabled ? "bg-zinc-700/80" : "bg-zinc-800/60"}`}>
                        <Icon className={`w-4 h-4 ${enabled ? "text-zinc-200" : "text-zinc-500"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-200">{f.label}</span>
                          {f.recommended && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{f.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Content locales ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-zinc-500" /> Content languages
                </p>
                <span className="text-xs text-zinc-600">{contentLocales.length} selected</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {CONTENT_LOCALES.map((loc) => {
                  const active = contentLocales.includes(loc.code);
                  return (
                    <button
                      key={loc.code}
                      type="button"
                      onClick={() => toggleLocale(loc.code)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                        active ? "border-zinc-700/60 bg-zinc-800/50 text-zinc-200" : "border-zinc-800/40 bg-zinc-900/20 text-zinc-500 hover:border-zinc-700/40 hover:text-zinc-400"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors ${active ? "bg-zinc-100 border-zinc-100" : "bg-transparent border-zinc-600"}`}>
                        {active && <Check className="w-2.5 h-2.5 text-zinc-950" />}
                      </div>
                      <span className="text-xs">{loc.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-zinc-600 mt-2">
                The first selected language will be the default. You can add more in Settings → i18n.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("admin")}
                className="h-11 px-5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSettingsContinue}
                disabled={loading}
                className="flex-1 h-11 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Saving…" : "Continue"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Security / MFA ───────────────────────────────────────── */}
        {step === "security" && (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-medium">5</span>
                <span>Step 5 of 5</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-semibold">Two-Factor Authentication</h2>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Secure your admin account with an authenticator app.{" "}
                <span className="text-amber-400 font-medium">Strongly recommended</span>
                {" "}— you can skip and enable later in Account Settings.
              </p>
            </div>

            {/* Not yet started */}
            {!mfaSetupData && !mfaEnabled && (
              <div className="space-y-4">
                {/* How it works info */}
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-blue-300 flex items-center gap-2">
                    <QrCode className="w-4 h-4" /> How 2FA works
                  </p>
                  <ol className="space-y-1.5 text-sm text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[11px] flex items-center justify-center shrink-0 mt-0.5 font-medium">1</span>
                      Tap <strong className="text-zinc-200">"Set up 2FA"</strong> to generate a QR code
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[11px] flex items-center justify-center shrink-0 mt-0.5 font-medium">2</span>
                      Scan with <strong className="text-zinc-200">Google Authenticator, Authy</strong> or any TOTP app
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[11px] flex items-center justify-center shrink-0 mt-0.5 font-medium">3</span>
                      Enter the 6-digit code to confirm and activate
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[11px] flex items-center justify-center shrink-0 mt-0.5 font-medium">4</span>
                      Download <strong className="text-zinc-200">backup codes</strong> to a safe place
                    </li>
                  </ol>
                </div>

                {mfaError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {mfaError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setMfaSkipped(true); setStep("done"); }}
                    className="flex-1 h-11 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors text-sm"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={handleStartMfa}
                    disabled={mfaLoading}
                    className="flex-1 h-11 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {mfaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                    Set up 2FA
                  </button>
                </div>
              </div>
            )}

            {/* QR Code shown, awaiting confirmation */}
            {mfaSetupData && !mfaEnabled && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-400 mb-3">
                    Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
                  </p>
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-white rounded-xl">
                      <img src={mfaSetupData.qrCode} alt="MFA QR code" className="w-44 h-44" />
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/50 px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500 font-mono break-all">{mfaSetupData.secret}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(mfaSetupData.secret)}
                      className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Copy secret"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {mfaError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {mfaError}
                  </div>
                )}

                <div>
                  <label className={labelClass}>Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className={fieldClass + " tracking-widest text-center text-lg font-mono"}
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, "")); setMfaError(null); }}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setMfaSetupData(null); setMfaCode(""); setMfaError(null); }}
                    className="h-11 px-5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmMfa}
                    disabled={mfaLoading || mfaCode.length !== 6}
                    className="flex-1 h-11 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {mfaLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm & Enable 2FA
                  </button>
                </div>
              </div>
            )}

            {/* MFA enabled — show backup codes */}
            {mfaEnabled && mfaSetupData && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3.5 py-3 text-sm text-green-400">
                  <Check className="w-4 h-4 shrink-0" />
                  Two-factor authentication is now active on your account.
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelClass + " mb-0"}>
                      <FileText className="w-4 h-4 inline mr-1.5 text-amber-400" />
                      Backup Codes
                    </label>
                    <button
                      type="button"
                      onClick={() => setMfaBackupVisible((v) => !v)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {mfaBackupVisible ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">
                    Save these backup codes in a safe place. Each can be used once to recover access if you lose your authenticator.
                  </p>
                  {mfaBackupVisible && mfaSetupData.backupCodes?.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 mb-3">
                      {mfaSetupData.backupCodes.map((code) => (
                        <div key={code} className="font-mono text-xs text-zinc-300 bg-zinc-800/60 rounded px-2.5 py-1.5 border border-zinc-700/40">
                          {code}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={downloadBackupCodes}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-400 hover:bg-amber-500/15 transition-colors w-full justify-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download backup codes (recommended)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setStep("done")}
                  className="w-full h-11 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors flex items-center justify-center gap-2"
                >
                  Finish Setup
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step: Done ────────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">You're all set! 🎉</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Your Wolent CMS is ready.{" "}
                {mfaSkipped && (
                  <span className="text-amber-400">You skipped 2FA — enable it anytime in Account Settings.</span>
                )}
                {mfaEnabled && (
                  <span className="text-green-400">2FA is active on your account.</span>
                )}
              </p>
              {restartRecommended && (
                <p className="text-amber-400/90 text-sm mt-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-left">
                  You chose PostgreSQL: restart the API process so it picks up the new <code className="text-amber-200/90">DATABASE_URL</code> and regenerated Prisma client.
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="text-left space-y-2">
              {[
                { label: `Site: ${input.siteName}`, done: true },
                { label: "Admin account created", done: true },
                { label: `${Object.values(enabledFeatures).filter(Boolean).length} features enabled`, done: true },
                { label: `${contentLocales.length} content language${contentLocales.length > 1 ? "s" : ""} configured`, done: true },
                { label: mfaEnabled ? "2FA enabled ✓" : "2FA skipped", done: mfaEnabled, warning: !mfaEnabled },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 text-sm">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    item.done ? "bg-green-500/20 text-green-400" : item.warning ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {item.done ? <Check className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                  </div>
                  <span className={item.done ? "text-zinc-300" : "text-zinc-500"}>{item.label}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onComplete}
              className="w-full h-11 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors flex items-center justify-center gap-2"
            >
              {localStorage.getItem("wolent_access_token") ? "Enter Dashboard" : "Go to Login"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Progress dots */}
        {step !== "done" && (
          <div className="flex justify-center gap-2 mt-6">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex ? "w-6 bg-zinc-100" : i < stepIndex ? "w-3 bg-zinc-500" : "w-3 bg-zinc-800"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
