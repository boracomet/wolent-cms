import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Layers, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useI18n } from "../i18n";
import { useAuth } from "../api/AuthContext";
import { ApiClientError } from "../api/client";

/** Lago di Como / İtalya gölleri — Unsplash (hotlink, Unsplash License) */
const LOGIN_HERO_COMO_IMAGES: { slug: string; alt: string }[] = [
  { slug: "photo-1523906834657-45e3ad2514fc", alt: "Lake Como, Italy — boats and mountains" },
  { slug: "photo-1586500036706-5e90e35cd6a3", alt: "Lake Como shoreline and hills" },
  { slug: "photo-1623936892098-2ab0f15af231", alt: "Lake Como waterfront view" },
  { slug: "photo-1570077513849-4f68f59dadb1", alt: "Italian lake at dusk" },
  { slug: "photo-1515542622106-78bda8ba0e5b", alt: "Villa above an alpine lake, Italy" },
  { slug: "photo-1502920917128-1aa500764cbd", alt: "Lake and village, Italian lakes" },
  { slug: "photo-1476514525535-07fb3b4aae5f", alt: "Mountain lake and forest, Italy" },
];

function unsplashComoUrl(slug: string, w = 1920): string {
  return `https://images.unsplash.com/${slug}?auto=format&fit=crop&w=${w}&q=80`;
}

/** Espri tagline’ları — girişte rastgele başlar, birkaç saniyede bir değişir */
const LOGIN_HERO_TAGLINES = [
  "wolent.com — headless CMS for you.",
  "Your content, your API, our Como-calm vibes.",
  "Lake views optional. A solid CMS included.",
  "Headless, not helpless.",
  "APIs so tidy you could row a boat on them.",
  "Less CMS drama, more lakeside clarity.",
  "Structured content, unstructured daydreams.",
  "JSON in the front, prosecco in the back (optional).",
  "Ship faster than a ferry to Bellagio.",
];

function pickRandomIndex(length: number, avoid?: number): number {
  if (length <= 1) return 0;
  let i = Math.floor(Math.random() * length);
  let guard = 0;
  while (i === avoid && guard++ < 12) {
    i = Math.floor(Math.random() * length);
  }
  return i;
}

export function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [heroImageIndex] = useState(() => pickRandomIndex(LOGIN_HERO_COMO_IMAGES.length));
  const [taglineIndex, setTaglineIndex] = useState(() => pickRandomIndex(LOGIN_HERO_TAGLINES.length));

  const hero = LOGIN_HERO_COMO_IMAGES[heroImageIndex] ?? LOGIN_HERO_COMO_IMAGES[0]!;

  useEffect(() => {
    const ms = 8500 + Math.floor(Math.random() * 4000);
    const id = window.setInterval(() => {
      setTaglineIndex((prev) => pickRandomIndex(LOGIN_HERO_TAGLINES.length, prev));
    }, ms);
    return () => window.clearInterval(id);
  }, []);

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
    <div className="min-h-[100dvh] min-h-screen flex flex-col md:flex-row bg-stone-100 dark:bg-zinc-950 text-stone-900 dark:text-zinc-100">
      {/* Sol: Lago di Como görselleri + hafif karartma + marka */}
      <div className="relative w-full md:w-1/2 min-h-[240px] md:min-h-screen overflow-hidden border-b md:border-b-0 md:border-r border-stone-200/88 dark:border-zinc-800/60">
        <img
          src={unsplashComoUrl(hero.slug)}
          alt={hero.alt}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.28)_30%,rgba(0,0,0,0.06)_48%,transparent_65%)]"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 pb-8 md:pb-12 pointer-events-none">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70 mb-2">
            Wolent
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight drop-shadow-sm">
            Wolent Headless CMS
          </h2>
          <p
            key={taglineIndex}
            className="mt-3 max-w-md text-sm md:text-base text-white/88 leading-relaxed animate-in fade-in-0 duration-500"
          >
            {LOGIN_HERO_TAGLINES[taglineIndex]}
          </p>
        </div>
        <a
          href="https://unsplash.com/?utm_source=wolent&utm_medium=referral"
          target="_blank"
          rel="noreferrer noopener"
          className="absolute bottom-2 right-3 text-[10px] text-white/45 hover:text-white/70 transition-colors pointer-events-auto"
        >
          Photos · Unsplash
        </a>
      </div>

      {/* Sağ: form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-6 md:px-14 lg:px-20 bg-stone-100 dark:bg-zinc-950 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))] md:py-12">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg border border-stone-200 bg-white dark:border-transparent dark:bg-zinc-100 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6 text-stone-800 dark:text-zinc-950" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-900 dark:text-zinc-100">{t("login.title")}</h1>
              <p className="text-sm text-stone-500 dark:text-zinc-500 mt-0.5">{t("login.subtitle")}</p>
            </div>
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
                  <label htmlFor="email" className="text-sm font-medium text-stone-700 dark:text-zinc-300">
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
                    className="w-full h-11 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white/82 dark:bg-zinc-900/60 px-3.5 text-sm text-stone-900 dark:text-zinc-100 placeholder:text-stone-500 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-stone-400/60 dark:focus:ring-zinc-600/50 focus:border-stone-400 dark:focus:border-zinc-600"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="password" className="text-sm font-medium text-stone-700 dark:text-zinc-300">
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
                      className="w-full h-11 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white/82 dark:bg-zinc-900/60 pl-3.5 pr-11 text-sm text-stone-900 dark:text-zinc-100 placeholder:text-stone-500 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-stone-400/60 dark:focus:ring-zinc-600/50 focus:border-stone-400 dark:focus:border-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-stone-500 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 hover:bg-stone-300 dark:hover:bg-zinc-800/60"
                      aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <label htmlFor="totp" className="text-sm font-medium text-stone-700 dark:text-zinc-300">
                  {t("login.totpLabel")}
                </label>
                <p className="text-xs text-stone-500 dark:text-zinc-500">{t("login.totpHint")}</p>
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
                  placeholder={t("login.totpPlaceholder")}
                  className="w-full h-11 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white/82 dark:bg-zinc-900/60 px-3.5 text-sm text-stone-900 dark:text-zinc-100 placeholder:text-stone-500 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-stone-400/60 dark:focus:ring-zinc-600/50 focus:border-stone-400 dark:focus:border-zinc-600 tracking-widest text-center text-lg font-mono"
                />
                <button
                  type="button"
                  onClick={() => setRequiresTwoFactor(false)}
                  className="text-xs text-stone-500 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 transition-colors text-left mt-1"
                >
                  {t("login.backToLogin")}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-semibold hover:bg-stone-800 active:bg-stone-950 dark:hover:bg-zinc-200 dark:active:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {requiresTwoFactor ? t("login.verifyMfa") : t("login.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
