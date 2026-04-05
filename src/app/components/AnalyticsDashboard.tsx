import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Activity, BarChart3, Globe2, LogIn, Monitor, Timer } from "lucide-react";
import { useI18n } from "../i18n";
import type { AdminLocale } from "../i18n/catalog";
import {
  CMS_PLUGINS_ENABLED_EVENT,
  readNativeAnalyticsPluginEnabled,
} from "../lib/cmsPluginsEvents";

const DEMO_DAILY_LOGINS = [
  { dayKey: "analytics.chart.mon", value: 42 },
  { dayKey: "analytics.chart.tue", value: 58 },
  { dayKey: "analytics.chart.wed", value: 51 },
  { dayKey: "analytics.chart.thu", value: 67 },
  { dayKey: "analytics.chart.fri", value: 73 },
  { dayKey: "analytics.chart.sat", value: 38 },
  { dayKey: "analytics.chart.sun", value: 31 },
];

const DEMO_SESSIONS = [
  {
    ip: "185.92.xxx.xx",
    country: "TR",
    countryLabelKey: "analytics.geo.tr",
    pageKey: "analytics.page.home",
    minutes: 4.2,
  },
  {
    ip: "104.28.xxx.xx",
    country: "DE",
    countryLabelKey: "analytics.geo.de",
    pageKey: "analytics.page.pricing",
    minutes: 2.1,
  },
  {
    ip: "203.0.xxx.x",
    country: "US",
    countryLabelKey: "analytics.geo.us",
    pageKey: "analytics.page.docs",
    minutes: 8.5,
  },
  {
    ip: "178.62.xxx.xx",
    country: "GB",
    countryLabelKey: "analytics.geo.gb",
    pageKey: "analytics.page.blog",
    minutes: 3.7,
  },
  {
    ip: "91.108.xxx.xx",
    country: "FR",
    countryLabelKey: "analytics.geo.fr",
    pageKey: "analytics.page.contact",
    minutes: 1.4,
  },
];

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

function seededUnit(seed: number, i: number): number {
  const x = Math.sin(seed * 9999 + i * 127) * 10000;
  return x - Math.floor(x);
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
        <span className="text-[11px] sm:text-xs font-semibold tabular-nums leading-none text-zinc-200">
          {parts[0]}
        </span>
        <span className="max-w-full px-0.5 text-[9px] sm:text-[10px] leading-tight text-zinc-400">
          {parts[1]}
        </span>
      </span>
    );
  }
  return (
    <span
      className="flex min-h-[3rem] shrink-0 items-start justify-center px-0.5 text-center text-[11px] sm:text-xs font-medium leading-snug text-zinc-300"
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

function buildLoginsSeries(
  range: LoginsRange,
  panelLocale: AdminLocale,
  t: (key: string) => string
): LoginsChartPoint[] {
  const tag = intlLocaleForPanel(panelLocale);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  if (range === "7d") {
    return DEMO_DAILY_LOGINS.map((d, i) => {
      const label = t(d.dayKey);
      return {
        id: `7d-${i}`,
        label,
        value: d.value,
        title: `${label}: ${d.value}`,
      };
    });
  }

  if (range === "1m") {
    const n = 30;
    const out: LoginsChartPoint[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const v = Math.round(25 + seededUnit(1, i) * 55);
      const showLabel = i % 5 === 0 || i === 0 || i === n - 1;
      const label = showLabel ? compactDateLabel(d, tag) : "";
      out.push({
        id: `1m-${i}`,
        label,
        value: v,
        title: `${d.toLocaleDateString(tag, { dateStyle: "medium" })}: ${v}`,
      });
    }
    return out;
  }

  if (range === "3m") {
    const weeks = 13;
    const out: LoginsChartPoint[] = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const d = new Date(today);
      d.setDate(d.getDate() - w * 7);
      const v = Math.round(180 + seededUnit(2, w) * 320);
      const label = compactDateLabel(d, tag);
      out.push({
        id: `3m-${w}`,
        label,
        value: v,
        title: `${d.toLocaleDateString(tag, { dateStyle: "medium" })} — ${v}`,
      });
    }
    return out;
  }

  if (range === "6m") {
    const months = 6;
    const out: LoginsChartPoint[] = [];
    for (let m = months - 1; m >= 0; m--) {
      const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const v = Math.round(800 + seededUnit(3, m) * 1400);
      const label = d.toLocaleDateString(tag, { month: "short" });
      out.push({
        id: `6m-${m}`,
        label,
        value: v,
        title: `${d.toLocaleDateString(tag, { month: "long", year: "numeric" })}: ${v}`,
      });
    }
    return out;
  }

  const months = 12;
  const out: LoginsChartPoint[] = [];
  for (let m = months - 1; m >= 0; m--) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const v = Math.round(1200 + seededUnit(4, m) * 2200);
    const label = d.toLocaleDateString(tag, { month: "short" });
    out.push({
      id: `12m-${m}`,
      label,
      value: v,
      title: `${d.toLocaleDateString(tag, { month: "long", year: "numeric" })}: ${v}`,
    });
  }
  return out;
}

export function AnalyticsDashboard() {
  const { t, locale } = useI18n();
  const [allowed, setAllowed] = useState(() => readNativeAnalyticsPluginEnabled());
  const [liveUsers, setLiveUsers] = useState(17);
  const [loginsRange, setLoginsRange] = useState<LoginsRange>("7d");

  const loginsSeries = useMemo(
    () => buildLoginsSeries(loginsRange, locale, t),
    [loginsRange, locale, t]
  );

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

  useEffect(() => {
    const id = window.setInterval(() => {
      setLiveUsers((n) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.min(42, Math.max(8, n + delta));
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  if (!allowed) {
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-lg mx-auto mt-8 sm:mt-16 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl p-6 sm:p-8 text-center">
          <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-90" />
          <h1 className="text-xl font-semibold text-zinc-100 mb-2">{t("analytics.disabledTitle")}</h1>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">{t("analytics.disabledBody")}</p>
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
              <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100">{t("analytics.title")}</h1>
              <p className="text-sm text-zinc-400 mt-1">{t("analytics.subtitle")}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-1 rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  {t("analytics.liveUsers")}
                </p>
                <p className="text-4xl font-semibold text-zinc-100 tabular-nums mt-2">{liveUsers}</p>
                <p className="text-xs text-zinc-500 mt-2">{t("analytics.liveUsersHint")}</p>
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

          <div className="lg:col-span-2 rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <LogIn className="w-4 h-4 text-blue-400 shrink-0" />
                <h2 className="text-sm font-semibold text-zinc-200">{t("analytics.dailyLogins")}</h2>
                <span className="text-xs text-zinc-500">{t("analytics.demoDataBadge")}</span>
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
                        : "bg-zinc-950/60 border-zinc-700/70 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full pb-1">
              <div className="flex w-full items-end gap-0.5 sm:gap-1">
                {loginsSeries.map((point) => (
                  <div
                    key={point.id}
                    className="flex min-w-0 flex-1 flex-col items-stretch gap-1.5"
                  >
                    <div className="flex h-36 w-full flex-col justify-end rounded-md border border-zinc-800/60 bg-zinc-950/60 overflow-hidden">
                      <div
                        className="w-full rounded-b-sm bg-gradient-to-t from-blue-600/90 to-blue-400/70 transition-all duration-500"
                        style={{
                          height: `${(point.value / maxBar) * 100}%`,
                          minHeight: "8%",
                        }}
                        title={point.title}
                      />
                    </div>
                    <ChartAxisLabel label={point.label} title={point.title} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800/80 flex flex-wrap items-center gap-3">
            <Globe2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <h2 className="text-sm font-semibold text-zinc-200">{t("analytics.sessionsHeading")}</h2>
            <span className="text-xs text-zinc-500">{t("analytics.sessionsSub")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800/80 bg-zinc-950/40">
                  <th className="px-6 py-3 font-medium">{t("analytics.col.ip")}</th>
                  <th className="px-6 py-3 font-medium">{t("analytics.col.country")}</th>
                  <th className="px-6 py-3 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5" />
                      {t("analytics.col.page")}
                    </span>
                  </th>
                  <th className="px-6 py-3 font-medium text-right">
                    <span className="inline-flex items-center gap-1.5 justify-end">
                      <Timer className="w-3.5 h-3.5" />
                      {t("analytics.col.duration")}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {DEMO_SESSIONS.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-zinc-400">{row.ip}</td>
                    <td className="px-6 py-3 text-zinc-200">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-base leading-none">{flagEmoji(row.country)}</span>
                        {t(row.countryLabelKey)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-zinc-300">{t(row.pageKey)}</td>
                    <td className="px-6 py-3 text-right text-zinc-400 tabular-nums">
                      {row.minutes.toFixed(1)} {t("analytics.minutesSuffix")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-6 py-3 text-xs text-zinc-600 border-t border-zinc-800/60 bg-zinc-950/30">
            {t("analytics.tableFootnote")}
          </p>
        </div>
      </div>
    </div>
  );
}

function flagEmoji(code: string): string {
  const map: Record<string, string> = {
    TR: "🇹🇷",
    DE: "🇩🇪",
    US: "🇺🇸",
    GB: "🇬🇧",
    FR: "🇫🇷",
  };
  return map[code] ?? "🌐";
}
