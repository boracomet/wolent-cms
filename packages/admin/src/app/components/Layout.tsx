import { Link, useLocation, Outlet, Navigate } from "react-router";
import {
  LayoutDashboard,
  Database,
  Image,
  Users,
  Key,
  Settings,
  Layers,
  Menu,
  X,
  Puzzle,
  Palette,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import {
  CMS_PLUGINS_ENABLED_EVENT,
  readNativeAnalyticsPluginEnabled,
} from "../lib/cmsPluginsEvents";
import { useAuth } from "../api/AuthContext";

export function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analyticsNav, setAnalyticsNav] = useState(() => readNativeAnalyticsPluginEnabled());
  const { user, loading, logout } = useAuth();
  const { t } = useI18n();

  // All hooks must be called before any early return
  useEffect(() => {
    const sync = () => setAnalyticsNav(readNativeAnalyticsPluginEnabled());
    window.addEventListener(CMS_PLUGINS_ENABLED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CMS_PLUGINS_ENABLED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const navigation = useMemo(() => {
    const base = [
      { labelKey: "layout.nav.dashboard", href: "/", icon: LayoutDashboard },
      { labelKey: "layout.nav.contentTypes", href: "/content-types", icon: Database },
      { labelKey: "layout.nav.mediaLibrary", href: "/media", icon: Image },
      { labelKey: "layout.nav.users", href: "/users", icon: Users },
      { labelKey: "layout.nav.apiPermissions", href: "/api-permissions", icon: Key },
      { labelKey: "layout.nav.plugins", href: "/plugins", icon: Puzzle },
    ];
    if (analyticsNav) {
      base.push({ labelKey: "layout.nav.analytics", href: "/analytics", icon: BarChart3 });
    }
    base.push(
      { labelKey: "layout.nav.settings", href: "/settings", icon: Settings },
      { labelKey: "layout.nav.featureGaps", href: "/feature-gaps", icon: Palette }
    );
    return base;
  }, [analyticsNav]);

  // Auth guard — redirect to /login if not authenticated (after all hooks)
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-100" />
      </div>
    );
  }

  const mobileChromeTop = "calc(3.5rem + env(safe-area-inset-top, 0px))";

  return (
    <div className="flex min-h-[100dvh] min-h-screen bg-zinc-950 text-zinc-100">
      {/* Mobil: logo solda, menü sağda — lg+ gizli */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center border-b border-zinc-800/50 bg-zinc-950/95 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)] lg:hidden">
        <div className="flex h-14 w-full items-center justify-between gap-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex min-w-0 max-w-[70%] items-center gap-2.5 rounded-lg py-1 pr-2 outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
              <Layers className="h-5 w-5 text-zinc-950" />
            </div>
            <span className="truncate font-semibold text-zinc-100">{t("layout.brand.title")}</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="shrink-0 rounded-lg border border-zinc-800/50 bg-zinc-900/90 p-2 backdrop-blur-xl"
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? t("layout.a11y.closeMenu") : t("layout.a11y.openMenu")}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Overlay — üst barın altından; blur yok */}
      {sidebarOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 bg-zinc-950/55 lg:hidden"
          style={{ top: mobileChromeTop }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — mobilde üst barın altında açılır */}
      <aside
        className={`fixed left-0 z-40 flex w-64 max-w-[min(16rem,100vw-2rem)] flex-col border-r border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl transition-transform duration-300 max-lg:bottom-0 max-lg:top-[calc(3.5rem+env(safe-area-inset-top,0px))] max-lg:pb-[env(safe-area-inset-bottom,0px)] lg:static lg:min-h-0 lg:pb-[env(safe-area-inset-bottom,0px)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center">
              <Layers className="w-6 h-6 text-zinc-950" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">{t("layout.brand.title")}</h1>
              <p className="text-xs text-zinc-500">{t("layout.brand.subtitle")}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
                           (item.href !== "/" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-zinc-800/70 backdrop-blur-sm text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 backdrop-blur-sm"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          {user && (
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {user.firstName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-zinc-500 truncate">{user.role}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={async () => { await logout(); setSidebarOpen(false); }}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 backdrop-blur-sm transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t("layout.nav.logout")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto pb-[env(safe-area-inset-bottom,0px)] pt-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}