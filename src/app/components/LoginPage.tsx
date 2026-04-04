import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Layers, Eye, EyeOff } from "lucide-react";
import { useI18n } from "../i18n";
import { PANEL_LANGUAGE_OPTIONS, type AdminLocale } from "../i18n/catalog";

/** Karlı kış manzarası — Ryan Le / Unsplash */
const LOGIN_HERO_UNSPLASH =
  "https://images.unsplash.com/photo-1768580269873-9c9c25d0af6a?auto=format&fit=crop&w=1600&q=80";
const LOGIN_HERO_UNSPLASH_PAGE =
  "https://unsplash.com/photos/winter-landscape-with-snow-covered-trees-and-mountains-aAPzDLk82tg?utm_source=wolent-cms&utm_medium=referral&utm_campaign=api-credit";

export function LoginPage() {
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate("/");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-950 text-zinc-100">
      {/* Sol: Unsplash kış görseli + mockup (~%50) */}
      <div className="relative w-full md:w-1/2 min-h-[280px] md:min-h-screen overflow-hidden border-b md:border-b-0 md:border-r border-zinc-800/60">
        <img
          src={LOGIN_HERO_UNSPLASH}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/65 to-zinc-950/35" />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/40 via-transparent to-zinc-950/50" />

        <div className="relative z-10 h-full flex flex-col justify-center px-8 py-10 md:px-14 md:py-16">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-6">
            {t("login.mockupLabel")}
          </p>
          <div
            className="mx-auto w-full max-w-lg"
            style={{ perspective: "1200px" }}
          >
            <div
              className="rounded-xl border border-zinc-700/50 bg-zinc-900/40 backdrop-blur-sm shadow-2xl shadow-black/50 overflow-hidden transform-gpu transition-transform md:hover:scale-[1.01]"
              style={{ transform: "rotateY(-5deg)" }}
            >
              {/* Tarayıcı çubuğu */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-900/90 border-b border-zinc-800/80">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="h-6 max-w-[200px] w-full rounded-md bg-zinc-800/80 border border-zinc-700/50 text-[10px] text-zinc-500 flex items-center justify-center font-mono truncate px-2">
                    app.ornek.com/admin
                  </div>
                </div>
                <div className="w-14" />
              </div>
              {/* Sahte panel içi */}
              <div className="flex min-h-[200px] md:min-h-[280px]">
                <aside className="w-[22%] min-w-[72px] border-r border-zinc-800/80 bg-zinc-950/60 p-2 space-y-1.5">
                  <div className="h-2 w-8 rounded bg-zinc-700/80 mb-2" />
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-6 rounded-md ${i === 1 ? "bg-zinc-100/15 border border-zinc-600/40" : "bg-zinc-800/40"}`}
                    />
                  ))}
                </aside>
                <div className="flex-1 p-3 md:p-4 space-y-3 bg-zinc-950/40">
                  <div className="h-4 w-1/3 rounded bg-zinc-700/60" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-16 rounded-lg bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-800/60" />
                    <div className="h-16 rounded-lg bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-800/60" />
                  </div>
                  <div className="h-24 rounded-lg bg-zinc-900/70 border border-zinc-800/50 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-end gap-1 px-2 pb-2">
                      {[40, 65, 45, 80, 55, 70].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-zinc-600/50"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-8 text-sm text-zinc-400 max-w-md mx-auto text-center md:text-left md:mx-0 drop-shadow-sm">
            {t("login.mockupCaption")}
          </p>
          <p className="mt-3 text-[11px] text-zinc-500 max-w-md mx-auto text-center md:text-left md:mx-0">
            <a
              href={LOGIN_HERO_UNSPLASH_PAGE}
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2 hover:text-zinc-300"
            >
              {t("login.unsplashAttribution")}
            </a>
          </p>
        </div>
      </div>

      {/* Sağ: form (~%50) */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-12 md:px-14 lg:px-20 bg-zinc-950">
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
            <div className="flex flex-col gap-4">
              <label htmlFor="email" className="text-sm font-medium text-zinc-300">
                {t("login.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t("login.emailPlaceholder")}
                className="w-full h-11 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/50 focus:border-zinc-600"
              />
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="password" className="text-sm font-medium text-zinc-300">
                  {t("login.password")}
                </label>
                <button
                  type="button"
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {t("login.forgot")}
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
            <button
              type="submit"
              className="w-full h-11 rounded-lg bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors"
            >
              {t("login.submit")}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-600">
            {t("login.demoHint")}{" "}
            <Link to="/" className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2">
              {t("login.skipToPanel")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
