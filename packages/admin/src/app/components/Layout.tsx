import { Link, useLocation, Outlet, Navigate } from "react-router";
import { Layers, Menu, X, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { icons, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { useAuth } from "../api/AuthContext";
import { api } from "../api/client";
import { DEFAULT_MENU_ITEMS, MENU_CHANGED_EVENT, type MenuItem } from "./Settings";
import { getMenuItemDisplayLabel } from "../lib/menuNavLabel";
import {
  PANEL_APPEARANCE_LS_KEY,
  PANEL_APPEARANCE_CHANGED_EVENT,
} from "../lib/panelAppearance";

function formatRoleLabel(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function getIcon(name: string): LucideIcon | null {
  return (icons as Record<string, LucideIcon>)[name] ?? null;
}

const MENU_STORAGE_KEY = "wolent-cms-menu-builder";

export function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);
  const [panelBrand, setPanelBrand] = useState<{
    logoUrl: string | null;
    title: string;
    subtitle: string;
  }>({ logoUrl: null, title: "", subtitle: "" });
  const { user, loading, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [themeReady, setThemeReady] = useState(false);
  useEffect(() => {
    setThemeReady(true);
  }, []);
  const { t } = useI18n();

  const themePreference = theme === "light" || theme === "dark" ? theme : "system";

  const cyclePanelTheme = () => {
    if (themePreference === "system") setTheme("light");
    else if (themePreference === "light") setTheme("dark");
    else setTheme("system");
  };

  const themeSidebarLabel =
    themePreference === "system"
      ? t("layout.theme.useAuto")
      : themePreference === "light"
        ? t("layout.theme.useLight")
        : t("layout.theme.useDark");

  useEffect(() => {
    const loadPanelAppearance = () => {
      api.settings
        .get("appearance")
        .then((res) => {
          const s = res.data as Record<string, unknown>;
          const logo =
            typeof s.logoUrl === "string" && s.logoUrl.trim() ? s.logoUrl : null;
          setPanelBrand({
            logoUrl: logo,
            title: typeof s.panelTitle === "string" ? s.panelTitle : "",
            subtitle: typeof s.panelSubtitle === "string" ? s.panelSubtitle : "",
          });
        })
        .catch(() => {
          try {
            const raw = localStorage.getItem(PANEL_APPEARANCE_LS_KEY);
            if (!raw) return;
            const s = JSON.parse(raw) as Record<string, unknown>;
            const logo =
              typeof s.logoUrl === "string" && s.logoUrl.trim() ? s.logoUrl : null;
            setPanelBrand({
              logoUrl: logo,
              title: typeof s.panelTitle === "string" ? s.panelTitle : "",
              subtitle: typeof s.panelSubtitle === "string" ? s.panelSubtitle : "",
            });
          } catch {
            /* ignore */
          }
        });
    };
    loadPanelAppearance();
    const onBrandChange = () => loadPanelAppearance();
    window.addEventListener(PANEL_APPEARANCE_CHANGED_EVENT, onBrandChange);
    return () => window.removeEventListener(PANEL_APPEARANCE_CHANGED_EVENT, onBrandChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.settings.get("menu")
      .then(res => {
        if (cancelled) return;
        const s = res.data as Record<string, unknown>;
        if (Array.isArray(s.items)) {
          setMenuItems((s.items as MenuItem[]).map(it => ({
            ...it,
            type: it.type || "system",
            roles: Array.isArray(it.roles) ? it.roles : ["super_admin", "admin", "editor", "author", "viewer"],
          })));
        }
      })
      .catch(() => {
        if (cancelled) return;
        try {
          const raw = localStorage.getItem(MENU_STORAGE_KEY);
          if (raw) setMenuItems(JSON.parse(raw) as MenuItem[]);
        } catch { /* ignore */ }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const reload = () => {
      api.settings.get("menu")
        .then(res => {
          const s = res.data as Record<string, unknown>;
          if (Array.isArray(s.items)) {
            setMenuItems((s.items as MenuItem[]).map(it => ({
              ...it,
              type: it.type || "system",
              roles: Array.isArray(it.roles) ? it.roles : ["super_admin", "admin", "editor", "author", "viewer"],
            })));
          }
        })
        .catch(() => {});
    };
    window.addEventListener(MENU_CHANGED_EVENT, reload);
    return () => window.removeEventListener(MENU_CHANGED_EVENT, reload);
  }, []);

  const navigation = useMemo(() => {
    if (!user) return [];
    return menuItems
      .filter(it => it.enabled && it.roles.includes(user.role))
      .sort((a, b) => a.order - b.order);
  }, [menuItems, user]);

  // Auth guard — redirect to /login if not authenticated (after all hooks)
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 dark:border-zinc-700 border-t-zinc-100" />
      </div>
    );
  }

  const mobileChromeTop = "calc(3.5rem + env(safe-area-inset-top, 0px))";
  const brandTitle = panelBrand.title.trim() || t("layout.brand.title");
  const brandSubtitle = panelBrand.subtitle.trim() || t("layout.brand.subtitle");

  return (
    <div className="flex min-h-[100dvh] min-h-screen bg-stone-100 dark:bg-zinc-950 text-stone-900 dark:text-zinc-100">
      {/* Mobil: logo solda, menü sağda — lg+ gizli */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center border-b border-stone-200/85 dark:border-zinc-800/50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)] lg:hidden">
        <div className="flex h-14 w-full items-center justify-between gap-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex min-w-0 max-w-[70%] items-center gap-2.5 rounded-lg py-1 pr-2 outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:focus-visible:ring-zinc-600"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-transparent dark:bg-zinc-100">
              {panelBrand.logoUrl ? (
                <img src={panelBrand.logoUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <Layers className="h-5 w-5 text-stone-800 dark:text-zinc-950" />
              )}
            </div>
            <div className="min-w-0">
              <span className="block truncate font-semibold text-stone-900 dark:text-zinc-100">{brandTitle}</span>
              <span className="block truncate text-xs text-stone-500 dark:text-zinc-500">{brandSubtitle}</span>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {themeReady && (
              <button
                type="button"
                onClick={cyclePanelTheme}
                className="rounded-lg border border-stone-200/85 dark:border-zinc-800/50 bg-white/94 dark:bg-zinc-900/90 p-2 backdrop-blur-xl text-stone-700 dark:text-zinc-200 hover:bg-stone-100/90 active:bg-stone-200/90 dark:hover:bg-zinc-800/80 dark:active:bg-zinc-800"
                aria-label={t("layout.theme.cycleA11y")}
                title={themeSidebarLabel}
              >
                {themePreference === "system" ? (
                  <Monitor className="h-5 w-5" />
                ) : resolvedTheme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="rounded-lg border border-stone-200/85 dark:border-zinc-800/50 bg-white/94 dark:bg-zinc-900/90 p-2 backdrop-blur-xl"
              aria-expanded={sidebarOpen}
              aria-label={sidebarOpen ? t("layout.a11y.closeMenu") : t("layout.a11y.openMenu")}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Overlay — üst barın altından; blur yok */}
      {sidebarOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 bg-stone-100 dark:bg-zinc-950/55 lg:hidden"
          style={{ top: mobileChromeTop }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — mobilde üst barın altında açılır */}
      <aside
        className={`fixed left-0 z-40 flex w-64 max-w-[min(16rem,100vw-2rem)] flex-col border-r border-stone-200/85 dark:border-zinc-800/50 bg-white/78 dark:bg-zinc-900/50 backdrop-blur-xl transition-transform duration-300 max-lg:bottom-0 max-lg:top-[calc(3.5rem+env(safe-area-inset-top,0px))] max-lg:pb-[env(safe-area-inset-bottom,0px)] lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:pb-[env(safe-area-inset-bottom,0px)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-stone-200/85 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-stone-200 bg-white dark:border-transparent dark:bg-zinc-100">
              {panelBrand.logoUrl ? (
                <img src={panelBrand.logoUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <Layers className="h-6 w-6 text-stone-800 dark:text-zinc-950" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-semibold text-lg">{brandTitle}</h1>
              <p className="truncate text-xs text-stone-500 dark:text-zinc-500">{brandSubtitle}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
                           (item.href !== "/" && location.pathname.startsWith(item.href));
            const Icon = getIcon(item.icon);
            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-stone-200/95 dark:bg-zinc-800/70 backdrop-blur-sm text-stone-900 dark:text-zinc-100"
                    : "text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-200/90 active:bg-stone-300/70 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/70 backdrop-blur-sm"
                }`}
              >
                {Icon ? <Icon className="w-5 h-5 shrink-0" /> : <div className="w-5 h-5 shrink-0" />}
                <span className="flex-1 truncate">{getMenuItemDisplayLabel(item, t)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-stone-200/85 dark:border-zinc-800/50">
          {user && (
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-stone-300 dark:bg-zinc-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {user.firstName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-stone-800 dark:text-zinc-200 truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-stone-500 dark:text-zinc-500 truncate">{formatRoleLabel(user.role)}</p>
              </div>
              {themeReady && (
                <button
                  type="button"
                  onClick={cyclePanelTheme}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-stone-500 dark:text-zinc-400 hover:bg-stone-200/90 active:bg-stone-300/70 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/70 hover:text-stone-800 dark:hover:text-zinc-200 transition-colors"
                  aria-label={t("layout.theme.cycleA11y")}
                  title={themeSidebarLabel}
                >
                  {themePreference === "system" ? (
                    <Monitor className="w-4 h-4" />
                  ) : themePreference === "dark" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          )}
          <div
            className={
              user
                ? "border-t border-stone-200/85 dark:border-zinc-800/50 mt-2.5 pt-2.5 -mx-4 px-4"
                : ""
            }
          >
            <button
              type="button"
              onClick={async () => { await logout(); setSidebarOpen(false); }}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-200/90 active:bg-stone-300/70 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/70 backdrop-blur-sm transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {t("layout.nav.logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto pb-[env(safe-area-inset-bottom,0px)] pt-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}