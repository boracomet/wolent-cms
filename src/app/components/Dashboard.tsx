import { Link } from "react-router";
import { Plus, FileText, Database, Image, Users } from "lucide-react";
import { useI18n } from "../i18n";

export function Dashboard() {
  const { t } = useI18n();

  const stats = [
    {
      nameKey: "dashboard.stats.contentTypes",
      value: "6",
      icon: Database,
      href: "/content-types",
      color: "blue",
    },
    {
      nameKey: "dashboard.stats.articles",
      value: "24",
      icon: FileText,
      href: "/content/articles",
      color: "green",
    },
    {
      nameKey: "dashboard.stats.mediaFiles",
      value: "156",
      icon: Image,
      href: "/media",
      color: "purple",
    },
    {
      nameKey: "dashboard.stats.users",
      value: "8",
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

  const recentContent = [
    { id: 1, title: "Getting Started with Headless CMS", type: "Article", date: "2 hours ago" },
    { id: 2, title: "Best Practices for Content Modeling", type: "Article", date: "5 hours ago" },
    { id: 3, title: "API Documentation", type: "Page", date: "1 day ago" },
    { id: 4, title: "Team Member Profile: John Doe", type: "Team", date: "2 days ago" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">{t("dashboard.title")}</h1>
            <p className="text-zinc-400">{t("dashboard.welcome")}</p>
          </div>
          <Link
            to="/content-types"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors font-medium"
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
              className={`bg-zinc-900/50 backdrop-blur-xl border ${colorClasses[stat.color].border} rounded-lg p-6 hover:border-zinc-700/50 transition-all hover:scale-[1.02] group relative overflow-hidden`}
            >
              {/* Subtle gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-zinc-800/70 backdrop-blur-sm flex items-center justify-center group-hover:bg-zinc-700/70 transition-colors">
                    <stat.icon className={`w-6 h-6 ${colorClasses[stat.color].icon}`} />
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </div>
                <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  {t(stat.nameKey)}
                </p>
                
                {/* Subtle indicator */}
                <div className="mt-3 pt-3 border-t border-zinc-800/50">
                  <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    {t("dashboard.viewAll")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Content */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-lg">
          <div className="px-6 py-4 border-b border-zinc-800/50">
            <h2 className="text-lg font-semibold">{t("dashboard.recentContent")}</h2>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {recentContent.map((item) => (
              <div
                key={item.id}
                className="px-6 py-4 hover:bg-zinc-800/50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                  <div className="min-w-0">
                    <h3 className="font-medium mb-1">{item.title}</h3>
                    <p className="text-sm text-zinc-400">{item.type}</p>
                  </div>
                  <span className="text-sm text-zinc-500 shrink-0">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}