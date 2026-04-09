import { Link } from "react-router";
import { useEffect, useState } from "react";
import { Plus, FileText, Database, Image, Users } from "lucide-react";
import { useI18n } from "../i18n";
import { api } from "../api/client";

export function Dashboard() {
  const { t } = useI18n();
  const [counts, setCounts] = useState({ contentTypes: "—", users: "—", mediaFiles: "—", articles: "—" });

  useEffect(() => {
    void (async () => {
      const [ct, usr, media] = await Promise.allSettled([
        api.contentTypes.list(),
        api.users.list(),
        api.media.files(),
      ]);
      let entryTotal = "—";
      if (ct.status === "fulfilled") {
        const types = ct.value.data as { kind?: string; singularName?: string; uid?: string }[];
        const firstCollection = types.find((t) => t.kind !== "singleType") ?? types[0];
        const slug = firstCollection?.singularName ?? firstCollection?.uid ?? "articles";
        const er = await api.entries.list(slug, { page: 1, pageSize: 1 }).catch(() => null);
        if (er) {
          entryTotal = String((er as { meta: { pagination: { total: number } } }).meta?.pagination?.total ?? "—");
        }
      }
      setCounts({
        contentTypes: ct.status === "fulfilled" ? String((ct.value.data as unknown[]).length) : "—",
        users: usr.status === "fulfilled" ? String((usr.value.data as unknown[]).length) : "—",
        mediaFiles:
          media.status === "fulfilled"
            ? String(
                (media.value as { meta: { pagination: { total: number } } }).meta?.pagination?.total ?? "—",
              )
            : "—",
        articles: entryTotal,
      });
    })();
  }, []);

  const stats = [
    {
      nameKey: "dashboard.stats.contentTypes",
      value: counts.contentTypes,
      icon: Database,
      href: "/content-types",
      color: "blue",
    },
    {
      nameKey: "dashboard.stats.articles",
      value: counts.articles,
      icon: FileText,
      href: "/content-types",
      color: "green",
    },
    {
      nameKey: "dashboard.stats.mediaFiles",
      value: counts.mediaFiles,
      icon: Image,
      href: "/media",
      color: "purple",
    },
    {
      nameKey: "dashboard.stats.users",
      value: counts.users,
      icon: Users,
      href: "/users",
      color: "orange",
    },
  ];

  const colorClasses: Record<string, { bg: string; border: string; icon: string; gradient: string }> = {
    blue: { 
      bg: "bg-blue-500/10", 
      border: "border-blue-500/20", 
      icon: "text-blue-400", 
      gradient: "from-blue-500/10" 
    },
    green: { 
      bg: "bg-green-500/10", 
      border: "border-green-500/20", 
      icon: "text-green-400", 
      gradient: "from-green-500/10" 
    },
    purple: { 
      bg: "bg-purple-500/10", 
      border: "border-purple-500/20", 
      icon: "text-purple-400", 
      gradient: "from-purple-500/10" 
    },
    orange: { 
      bg: "bg-orange-500/10", 
      border: "border-orange-500/20", 
      icon: "text-orange-400", 
      gradient: "from-orange-500/10" 
    },
  };

  const [recentContent, setRecentContent] = useState<{ id: string; title: string; type: string; typeApiId: string; date: string }[]>([]);

  useEffect(() => {
    api.contentTypes.list().then(res => {
      const types = res.data as { singularName?: string; uid?: string; displayName?: string }[];
      if (!types.length) return;
      const promises = types.slice(0, 3).map(ct => {
        const apiId = ct.singularName ?? ct.uid ?? '';
        return api.entries.list(apiId, { pageSize: '2' })
          .then(r => ({ entries: r.data as Record<string, unknown>[], typeLabel: ct.displayName ?? ct.singularName ?? ct.uid ?? '', typeApiId: apiId }))
          .catch(() => ({ entries: [], typeLabel: '', typeApiId: apiId }));
      });
      Promise.all(promises).then(results => {
        const items: { id: string; title: string; type: string; typeApiId: string; date: string }[] = [];
        for (const { entries, typeLabel, typeApiId } of results) {
          for (const entry of entries) {
            const title = String(entry['title'] ?? entry['name'] ?? entry['headline'] ?? `Entry ${entry['id']}`);
            const date = entry['createdAt'] ? new Date(entry['createdAt'] as string).toLocaleDateString() : '';
            items.push({ id: String(entry['id'] ?? ''), title, type: typeLabel, typeApiId, date });
          }
        }
        setRecentContent(items.slice(0, 5));
      });
    }).catch(() => { /* content types may not exist yet */ });
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">{t("dashboard.title")}</h1>
            <p className="text-stone-600 dark:text-zinc-400">{t("dashboard.welcome")}</p>
          </div>
          <Link
            to="/content-types"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-md hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("dashboard.createContentType")}</span>
            <span className="sm:hidden">{t("dashboard.createContentTypeShort")}</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Link
              key={stat.nameKey}
              to={stat.href}
              className={`bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border ${colorClasses[stat.color].border} rounded-lg p-6 hover:border-stone-400 dark:hover:border-zinc-700/50 transition-all hover:scale-[1.02] group relative overflow-hidden`}
            >
              {/* Subtle gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-stone-300/25 dark:from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-stone-200/95 dark:bg-zinc-800/70 backdrop-blur-sm flex items-center justify-center group-hover:bg-stone-300 dark:bg-zinc-700/70 transition-colors">
                    <stat.icon className={`w-6 h-6 ${colorClasses[stat.color].icon}`} />
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </div>
                <p className="text-sm text-stone-600 dark:text-zinc-400 group-hover:text-stone-700 dark:text-zinc-300 transition-colors">
                  {t(stat.nameKey)}
                </p>
                
                {/* Subtle indicator */}
                <div className="mt-3 pt-3 border-t border-stone-200/85 dark:border-zinc-800/50">
                  <span className="text-xs text-stone-500 dark:text-zinc-500 group-hover:text-stone-600 dark:text-zinc-400 transition-colors">
                    {t("dashboard.viewAll")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Content */}
        <div className="bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/85 dark:border-zinc-800/50 rounded-lg">
          <div className="px-6 py-4 border-b border-stone-200/85 dark:border-zinc-800/50">
            <h2 className="text-lg font-semibold">{t("dashboard.recentContent")}</h2>
          </div>
          <div className="divide-y divide-stone-200 dark:divide-zinc-800/50">
            {recentContent.length === 0 ? (
              <div className="px-6 py-8 text-center text-stone-500 dark:text-zinc-500 text-sm">
                {t("dashboard.noRecentContent")}
              </div>
            ) : recentContent.map((item) => (
              <Link
                key={item.id}
                to={`/content/${item.typeApiId ?? item.type}/${item.id}`}
                className="block px-6 py-4 hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                  <div className="min-w-0">
                    <h3 className="font-medium mb-1">{item.title}</h3>
                    <p className="text-sm text-stone-600 dark:text-zinc-400">{item.type}</p>
                  </div>
                  <span className="text-sm text-stone-500 dark:text-zinc-500 shrink-0">{item.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}