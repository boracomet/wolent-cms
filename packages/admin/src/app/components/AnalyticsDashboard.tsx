import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Activity, BarChart3, Globe2, LogIn, Monitor } from "lucide-react";
import { useI18n } from "../i18n";
import type { AdminLocale } from "../i18n/catalog";
import {
  CMS_PLUGINS_ENABLED_EVENT,
  readNativeAnalyticsPluginEnabled,
} from "../lib/cmsPluginsEvents";



type LoginsRange = "7d" | "1m" | "3m" | "6m" | "12m";

const RANGE_OPTIONS: { id: LoginsRange; labelKey: string }[] = [
  { id: "7d", labelKey: "analytics.range.week" },
  { id: "1m", labelKey: "analytics.range.1m" },
  { id: "3m", labelKey: "analytics.range.3m" },
  { id: "6m", labelKey: "analytics.range.6m" },
  { id: "12m", labelKey: "analytics.range.12m" },
];

function intlLocaleForPanel(locale: AdminLocale): string {
  switch (locale) {
    case "tr":
      return "tr-TR";
    case "de":
      return "de-DE";
    default:
      return "en-US";
  }
}

/** Dar sütunlar için: üstte gün, altta kısa ay (truncate olmadan okunur) */
function compactDateLabel(d: Date, tag: string): string {
  const day = String(d.getDate());
  const mon = d.toLocaleDateString(tag, { month: "short" });
  return `${day}\n${mon}`;
}

function ChartAxisLabel({ label, title }: { label: string; title: string }) {
  const trimmed = label.trim();
  if (!trimmed) {
    return (
      <span className="min-h-[3rem] shrink-0" aria-hidden>
        &nbsp;
      </span>
    );
  }
  const parts = trimmed.split("\n");
  if (parts.length >= 2) {
    return (
      <span
        className="flex min-h-[3rem] shrink-0 flex-col items-center justify-start gap-0.5 text-center"
        title={title}
      >
        <span className="text-[11px] sm:text-xs font-semibold tabular-nums leading-none text-stone-800 dark:text-zinc-200">
          {parts[0]}
        </span>
        <span className="max-w-full px-0.5 text-[9px] sm:text-[10px] leading-tight text-stone-600 dark:text-zinc-400">
          {parts[1]}
        </span>
      </span>
    );
  }
  return (
    <span
      className="flex min-h-[3rem] shrink-0 items-start justify-center px-0.5 text-center text-[11px] sm:text-xs font-medium leading-snug text-stone-700 dark:text-zinc-300"
      title={title}
    >
      {trimmed}
    </span>
  );
}

type LoginsChartPoint = {
  id: string;
  label: string;
  value: number;
  title: string;
};

/** Build empty placeholder series (all zeros) for the given range. Used when API has no data. */
function buildEmptySeries(
  range: LoginsRange,
  panelLocale: AdminLocale,
  t: (key: string) => string
): LoginsChartPoint[] {
  const tag = intlLocaleForPanel(panelLocale);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  if (range === "7d") {
    const days = [
      "analytics.chart.mon",
      "analytics.chart.tue",
      "analytics.chart.wed",
      "analytics.chart.thu",
      "analytics.chart.fri",
      "analytics.chart.sat",
      "analytics.chart.sun",
    ];
    return days.map((dayKey, i) => {
      const label = t(dayKey);
      return { id: `7d-${i}`, label, value: 0, title: label };
    });
  }

  if (range === "1m") {
    const n = 30;
    const out: LoginsChartPoint[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const showLabel = i % 5 === 0 || i === 0 || i === n - 1;
      const label = showLabel ? compactDateLabel(d, tag) : "";
      out.push({ id: `1m-${i}`, label, value: 0, title: d.toLocaleDateString(tag, { dateStyle: "medium" }) });
    }
    return out;
  }

  if (range === "3m") {
    const out: LoginsChartPoint[] = [];
    for (let w = 12; w >= 0; w--) {
      const d = new Date(today);
      d.setDate(d.getDate() - w * 7);
      const showLabel = w % 2 === 0;
      out.push({
        id: `3m-${w}`,
        label: showLabel ? compactDateLabel(d, tag) : "",
        value: 0,
        title: d.toLocaleDateString(tag, { dateStyle: "medium" }),
      });
    }
    return out;
  }

  const months = range === "6m" ? 6 : 12;
  const out: LoginsChartPoint[] = [];
  for (let m = months - 1; m >= 0; m--) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
    out.push({
      id: `${range}-${m}`,
      label: d.toLocaleDateString(tag, { month: "short" }),
      value: 0,
      title: d.toLocaleDateString(tag, { month: "long", year: "numeric" }),
    });
  }
  return out;
}

export function AnalyticsDashboard() {
  const { t, locale } = useI18n();
  const [allowed, setAllowed] = useState(() => readNativeAnalyticsPluginEnabled());
  const [liveUsers, setLiveUsers] = useState(0);
  const [loginsRange, setLoginsRange] = useState<LoginsRange>("7d");
  const [apiStats, setApiStats] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  // Fetch real analytics stats from backend
  useEffect(() => {
    if (!allowed) return;
    setApiLoading(true);
    import("../api/plugins").then(({ fetchAnalyticsStats }) =>
      fetchAnalyticsStats(loginsRange)
        .then(data => setApiStats(data))
        .catch(() => setApiStats(null))
        .finally(() => setApiLoading(false))
    );
  }, [allowed, loginsRange]);

  const loginsSeries = useMemo(() => {
    const tag = intlLocaleForPanel(locale);

    if (!apiStats?.dailySeries?.length) {
      return buildEmptySeries(loginsRange, locale, t);
    }

    const raw: { date: string; views: number }[] = apiStats.dailySeries;

    if (loginsRange === "7d") {
      const last7 = raw.slice(-7);
      return last7.map((d, i) => {
        const dt = new Date(d.date + "T12:00:00");
        return {
          id: `7d-${i}`,
          label: dt.toLocaleDateString(tag, { weekday: "short" }),
          value: d.views,
          title: dt.toLocaleDateString(tag, { dateStyle: "medium" }),
        };
      });
    }

    if (loginsRange === "1m") {
      const last30 = raw.slice(-30);
      return last30.map((d, i) => {
        const dt = new Date(d.date + "T12:00:00");
        const showLabel = i % 5 === 0 || i === last30.length - 1;
        return {
          id: `1m-${i}`,
          label: showLabel ? compactDateLabel(dt, tag) : "",
          value: d.views,
          title: dt.toLocaleDateString(tag, { dateStyle: "medium" }),
        };
      });
    }

    if (loginsRange === "3m") {
      const buckets = new Map<string, { sum: number; start: Date }>();
      for (const d of raw) {
        const dt = new Date(d.date + "T12:00:00");
        const weekStart = new Date(dt);
        weekStart.setDate(dt.getDate() - dt.getDay() + 1);
        const key = weekStart.toISOString().slice(0, 10);
        const prev = buckets.get(key);
        buckets.set(key, { sum: (prev?.sum ?? 0) + d.views, start: prev?.start ?? weekStart });
      }
      const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
      return sorted.map(([key, { sum, start }], i) => ({
        id: `3m-${key}`,
        label: i % 2 === 0 ? compactDateLabel(start, tag) : "",
        value: sum,
        title: `${start.toLocaleDateString(tag, { dateStyle: "medium" })} — ${sum}`,
      }));
    }

    // 6m and 12m: monthly buckets
    const buckets = new Map<string, { sum: number; date: Date }>();
    for (const d of raw) {
      const dt = new Date(d.date + "T12:00:00");
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const prev = buckets.get(key);
      buckets.set(key, { sum: (prev?.sum ?? 0) + d.views, date: prev?.date ?? dt });
    }
    const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([key, { sum, date }]) => ({
      id: `${loginsRange}-${key}`,
      label: date.toLocaleDateString(tag, { month: "short" }),
      value: sum,
      title: `${date.toLocaleDateString(tag, { month: "long", year: "numeric" })} — ${sum}`,
    }));
  }, [apiStats, loginsRange, locale, t]);

  const maxBar = useMemo(
    () => Math.max(...loginsSeries.map((d) => d.value), 1),
    [loginsSeries]
  );

  useEffect(() => {
    const sync = () => setAllowed(readNativeAnalyticsPluginEnabled());
    window.addEventListener(CMS_PLUGINS_ENABLED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CMS_PLUGINS_ENABLED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // liveUsers is set from API stats when available
  useEffect(() => {
    if (apiStats?.liveUsers !== undefined) {
      setLiveUsers(apiStats.liveUsers as number);
    }
  }, [apiStats]);

  if (!allowed) {
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-lg mx-auto mt-8 sm:mt-16 rounded-xl border border-stone-200/90 dark:border-zinc-800/80 bg-stone-50/92 dark:bg-zinc-900/40 backdrop-blur-xl p-6 sm:p-8 text-center">
          <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-90" />
          <h1 className="text-xl font-semibold text-stone-900 dark:text-zinc-100 mb-2">{t("analytics.disabledTitle")}</h1>
          <p className="text-sm text-stone-600 dark:text-zinc-400 mb-6 leading-relaxed">{t("analytics.disabledBody")}</p>
          <Link
            to="/plugins"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            {t("analytics.goToPlugins")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-zinc-100">{t("analytics.title")}</h1>
              <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1">{t("analytics.subtitle")}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-1 rounded-xl border border-stone-200/90 dark:border-zinc-800/80 bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-stone-500 dark:text-zinc-500 uppercase tracking-wide">
                  {t("analytics.liveUsers")}
                </p>
                <p className="text-4xl font-semibold text-stone-900 dark:text-zinc-100 tabular-nums mt-2">{liveUsers}</p>
                <p className="text-xs text-stone-500 dark:text-zinc-500 mt-2">{t("analytics.liveUsersHint")}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Activity className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <span className="absolute top-4 right-4 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-stone-200/90 dark:border-zinc-800/80 bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <LogIn className="w-4 h-4 text-blue-400 shrink-0" />
                <h2 className="text-sm font-semibold text-stone-800 dark:text-zinc-200">{t("analytics.dailyLogins")}</h2>
                {!apiStats?.dailySeries?.length && <span className="text-xs text-stone-500 dark:text-zinc-500">{t("analytics.noData")}</span>}
              </div>
              <div
                className="flex flex-wrap items-center gap-1.5 shrink-0"
                role="group"
                aria-label={t("analytics.dailyLogins")}
              >
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLoginsRange(opt.id)}
                    aria-pressed={loginsRange === opt.id}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      loginsRange === opt.id
                        ? "bg-blue-500/20 border-blue-500/45 text-blue-200"
                        : "bg-white/78 dark:bg-zinc-950/60 border-stone-300 dark:border-zinc-700/70 text-stone-600 dark:text-zinc-400 hover:border-stone-400 dark:hover:border-zinc-600 hover:text-stone-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full pb-1">
              {apiLoading ? (
                <div className="flex h-36 items-center justify-center text-stone-500 dark:text-zinc-500 text-sm gap-2">
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  {t("analytics.loading")}
                </div>
              ) : !apiStats?.dailySeries?.length ? (
                <div className="flex h-36 items-center justify-center rounded-lg border border-stone-200/88 dark:border-zinc-800/60 bg-stone-100/92 dark:bg-zinc-950/40 text-stone-500 dark:text-zinc-500 text-sm">
                  {t("analytics.noData")}
                </div>
              ) : (
                <div className="flex w-full items-end gap-px sm:gap-0.5">
                  {loginsSeries.map((point) => (
                    <div
                      key={point.id}
                      className="flex min-w-0 flex-1 flex-col items-stretch gap-1"
                    >
                      <div className="flex h-36 w-full flex-col justify-end rounded-sm border border-stone-200/88 dark:border-zinc-800/60 bg-white/78 dark:bg-zinc-950/60 overflow-hidden">
                        <div
                          className="w-full bg-gradient-to-t from-blue-600/90 to-blue-400/70 transition-all duration-500"
                          style={{
                            height: `${(point.value / maxBar) * 100}%`,
                            minHeight: point.value > 0 ? "8%" : "2%",
                          }}
                          title={point.title}
                        />
                      </div>
                      {point.label ? (
                        <ChartAxisLabel label={point.label} title={point.title} />
                      ) : (
                        <span className="min-h-[2rem]" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200/90 dark:border-zinc-800/80 bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200/90 dark:border-zinc-800/80 flex flex-wrap items-center gap-3">
            <Globe2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <h2 className="text-sm font-semibold text-stone-800 dark:text-zinc-200">{t("analytics.topPagesHeading")}</h2>
            <span className="text-xs text-stone-500 dark:text-zinc-500">{t("analytics.sessionsSub")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-stone-500 dark:text-zinc-500 border-b border-stone-200/90 dark:border-zinc-800/80 bg-stone-100/92 dark:bg-zinc-950/40">
                  <th className="px-6 py-3 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5" />
                      {t("analytics.col.page")}
                    </span>
                  </th>
                  <th className="px-6 py-3 font-medium text-right">{t("analytics.col.views")}</th>
                </tr>
              </thead>
              <tbody>
                {apiStats?.topPages?.length ? (
                  (apiStats.topPages as { url: string; views: number }[]).map((row, i) => (
                    <tr key={i} className="border-b border-stone-200/85 dark:border-zinc-800/50 hover:bg-stone-300 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-stone-700 dark:text-zinc-300 max-w-xs truncate" title={row.url}>{row.url}</td>
                      <td className="px-6 py-3 text-right text-stone-600 dark:text-zinc-400 tabular-nums">{row.views}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-stone-500 dark:text-zinc-500 text-sm">
                      {apiLoading ? t("analytics.loading") : t("analytics.noData")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

