import { useState } from "react";
import { useNavigate } from "react-router";
import { Layers, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useI18n } from "../i18n";
import { PANEL_LANGUAGE_OPTIONS, type AdminLocale } from "../i18n/catalog";
import { useAuth } from "../api/AuthContext";
import { ApiClientError } from "../api/client";

/** Karlı kış manzarası — Ryan Le / Unsplash */
const LOGIN_HERO_UNSPLASH =
  "https://images.unsplash.com/photo-1768580269873-9c9c25d0af6a?auto=format&fit=crop&w=1600&q=80";

export function LoginPage() {
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password, requiresTwoFactor ? totpCode : undefined);
      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
      } else {
        navigate("/");
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] min-h-screen flex flex-col md:flex-row bg-zinc-950 text-zinc-100">
      {/* Sol: yalnızca görsel */}
      <div className="relative w-full md:w-1/2 min-h-[240px] md:min-h-screen overflow-hidden border-b md:border-b-0 md:border-r border-zinc-800/60">
        <img
          src={LOGIN_HERO_UNSPLASH}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
      </div>

      {/* Sağ: form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-6 md:px-14 lg:px-20 bg-zinc-950 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))] md:py-12">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                <Layers className="w-6 h-6 text-zinc-950" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-zinc-100">{t("login.title")}</h1>
                <p className="text-sm text-zinc-500 mt-0.5">{t("login.subtitle")}</p>
              </div>
            </div>
            <label className="sr-only" htmlFor="login-locale">
              {t("login.language")}
            </label>
            <select
              id="login-locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value as AdminLocale)}
              className="text-xs rounded-md border border-zinc-800 bg-zinc-900/80 text-zinc-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-600 shrink-0"
            >
              {PANEL_LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {!requiresTwoFactor ? (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-zinc-300">
                    {t("login.email")}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("login.emailPlaceholder")}
                    className="w-full h-11 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/50 focus:border-zinc-600"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="password" className="text-sm font-medium text-zinc-300">
                      {t("login.password")}
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("login.passwordPlaceholder")}
                      className="w-full h-11 rounded-lg border border-zinc-800 bg-zinc-900/60 pl-3.5 pr-11 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/50 focus:border-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60"
                      aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <label htmlFor="totp" className="text-sm font-medium text-zinc-300">
                  Two-factor authentication code
                </label>
                <p className="text-xs text-zinc-500">Enter the 6-digit code from your authenticator app.</p>
                <input
                  id="totp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoFocus
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full h-11 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/50 focus:border-zinc-600 tracking-widest text-center text-lg font-mono"
                />
                <button
                  type="button"
                  onClick={() => setRequiresTwoFactor(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-left mt-1"
                >
                  ← Back to login
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {requiresTwoFactor ? "Verify" : t("login.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
