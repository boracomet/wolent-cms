import { useNavigate } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
import { useI18n } from "../i18n";

export function NotFound() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center select-none">
      {/* Glitch-style 404 number */}
      <div className="relative mb-6">
        <span className="text-[10rem] sm:text-[12rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-stone-400 dark:from-zinc-700 to-stone-200 dark:to-zinc-900">
          404
        </span>
        <span className="absolute inset-0 text-[10rem] sm:text-[12rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-500/20 to-transparent blur-sm">
          404
        </span>
      </div>

      <h1 className="text-2xl font-semibold text-stone-900 dark:text-zinc-100 mb-2">
        {t("common.notFound.title")}
      </h1>
      <p className="text-sm text-stone-500 dark:text-zinc-500 max-w-sm mb-8 leading-relaxed">
        {t("common.notFound.description")}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg hover:bg-stone-300 dark:hover:bg-zinc-800 hover:border-stone-400 dark:hover:border-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.notFound.back")}
        </button>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-950 bg-stone-900 dark:bg-zinc-100 rounded-lg hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors"
        >
          <Home className="w-4 h-4" />
          {t("common.notFound.home")}
        </button>
      </div>

      {/* Decorative grid dots */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>
    </div>
  );
}
