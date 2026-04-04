import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Languages, Save } from "lucide-react";

export type TranslateLocaleOption = {
  code: string;
  name: string;
  flag: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  locales: TranslateLocaleOption[];
  /** Şu an düzenlenen locale — referans varsayılanı */
  defaultSourceCode?: string;
  /** İkinci alan (özet) gösterilsin mi — şemada yalnızca tek metin alanı varsa false */
  showSummaryField?: boolean;
  /** Düzenlenen çeviriyi hedef locale’e yaz */
  onSave?: (payload: { targetLocale: string; title: string; summary: string }) => void;
};

type Phase = "idle" | "loading" | "done";

const MOCK_BY_TARGET: Record<
  string,
  { title: string; excerpt: string }
> = {
  en: {
    title: "Getting Started with Headless CMS",
    excerpt:
      "This guide walks you through the core concepts and helps you ship localized content faster.",
  },
  tr: {
    title: "Headless CMS ile başlarken",
    excerpt:
      "Bu rehber temel kavramları özetler ve yerelleştirilmiş içeriği daha hızlı yayınlamanıza yardımcı olur.",
  },
  de: {
    title: "Erste Schritte mit Headless CMS",
    excerpt:
      "Dieser Leitfaden führt durch die Grundlagen und beschleunigt mehrsprachige Inhalte.",
  },
  fr: {
    title: "Premiers pas avec un CMS headless",
    excerpt:
      "Ce guide présente les concepts clés et accélère la publication de contenus localisés.",
  },
  es: {
    title: "Primeros pasos con CMS headless",
    excerpt:
      "Esta guía repasa los conceptos básicos y agiliza la publicación de contenido localizado.",
  },
};

export function GeminiLogo({ className }: { className?: string }) {
  const gid = useId().replace(/:/g, "");
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={`g-${gid}`} x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4E8FFF" />
          <stop offset="0.45" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#E879F9" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#g-${gid})`}
        d="M12 1.5l2.4 6.9L22 12l-7.6 3.6L12 22l-2.4-6.9L2 12l7.6-3.6L12 1.5z"
      />
    </svg>
  );
}

export function AiTranslateModal({
  open,
  onClose,
  locales,
  defaultSourceCode = "en",
  showSummaryField = true,
  onSave,
}: Props) {
  const [source, setSource] = useState(defaultSourceCode);
  const [target, setTarget] = useState(
    () => locales.find((l) => l.code !== defaultSourceCode)?.code ?? "tr"
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [saveFlash, setSaveFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setPhase("idle");
      setProgress(0);
      setEditedTitle("");
      setEditedSummary("");
      setSaveFlash(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setPhase("idle");
      setProgress(0);
      setSource(defaultSourceCode);
      const other = locales.find((l) => l.code !== defaultSourceCode);
      setTarget(other?.code ?? locales[0]?.code ?? "tr");
    }
  }, [open, defaultSourceCode, locales]);

  useEffect(() => {
    if (phase !== "loading") return;
    setProgress(0);
    const start = Date.now();
    const duration = 2200;
    timerRef.current = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      setProgress(Math.round(t * 100));
      if (t >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setPhase("done");
      }
    }, 50);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  const mock =
    MOCK_BY_TARGET[target] ?? {
      title: `Translated preview (${target})`,
      excerpt: "Örnek çeviri metni — gerçek API bağlantısı yok, demo çıktısı.",
    };

  useEffect(() => {
    if (phase !== "done") return;
    setEditedTitle(mock.title);
    setEditedSummary(mock.excerpt);
  }, [phase, mock.title, mock.excerpt]);

  const canRun =
    source !== target && locales.some((l) => l.code === source) && locales.some((l) => l.code === target);

  const startMockTranslate = () => {
    if (!canRun || phase === "loading") return;
    setPhase("loading");
  };

  const handleSaveTranslation = () => {
    if (!onSave) return;
    onSave({
      targetLocale: target,
      title: editedTitle,
      summary: showSummaryField ? editedSummary : editedTitle,
    });
    setSaveFlash(true);
    window.setTimeout(() => setSaveFlash(false), 2200);
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[310] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/55"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-translate-title"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-zinc-700/90 bg-zinc-950 shadow-2xl shadow-black/80 ring-1 ring-white/10"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <GeminiLogo className="w-9 h-9 shrink-0" />
            <div className="min-w-0">
              <h2 id="ai-translate-title" className="text-base font-semibold text-zinc-100">
                AI Translate
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Gemini Auto Convert (demo)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors shrink-0"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Referans dili</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={phase === "loading"}
                className="w-full px-3 py-2 text-sm bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
              >
                {locales.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Hedef dil</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={phase === "loading"}
                className="w-full px-3 py-2 text-sm bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50"
              >
                {locales.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {source === target && (
            <p className="text-xs text-amber-400/90">Kaynak ve hedef dil farklı olmalı.</p>
          )}

          <button
            type="button"
            onClick={startMockTranslate}
            disabled={!canRun || phase === "loading"}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <Languages className="w-4 h-4" />
            Çeviriyi başlat
          </button>

          {phase === "loading" && (
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Gemini ile çevriliyor…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-[width] duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
              <p className="text-xs font-medium text-violet-400 uppercase tracking-wide">
                Çeviri çıktısı (düzenlenebilir)
              </p>
              <div>
                <label
                  htmlFor="ai-translate-title"
                  className="block text-[10px] text-zinc-500 uppercase mb-1"
                >
                  Başlık
                </label>
                <input
                  id="ai-translate-title"
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>
              {showSummaryField && (
                <div>
                  <label
                    htmlFor="ai-translate-summary"
                    className="block text-[10px] text-zinc-500 uppercase mb-1"
                  >
                    Özet
                  </label>
                  <textarea
                    id="ai-translate-summary"
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-y min-h-[88px] leading-relaxed"
                  />
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveTranslation}
                  disabled={!onSave || !editedTitle.trim()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Hedef dile kaydet
                </button>
                {saveFlash && (
                  <span className="text-xs text-green-400 sm:ml-1">
                    Kayıt forma uygulandı — üst çubuktan dil değiştirerek görebilirsiniz.
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-600 pt-1">
                Bu panel yalnızca arayüz demosudur; gerçek çeviri için Gemini API bağlanabilir.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function AiTranslateSidebarButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-lg border border-violet-500/35 bg-gradient-to-r from-violet-950/50 to-blue-950/40 hover:from-violet-900/50 hover:to-blue-900/40 text-sm font-medium text-zinc-100 transition-colors shadow-sm shadow-violet-950/20"
    >
      <GeminiLogo className="w-5 h-5 shrink-0" />
      AI Translate
    </button>
  );
}
