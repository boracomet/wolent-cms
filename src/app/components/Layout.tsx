import { Link, useLocation, Outlet } from "react-router";
import { LayoutDashboard, Database, Image, Users, Key, Settings, Layers, Menu, X, Puzzle, Palette } from "lucide-react";
import { useState } from "react";
import { useI18n } from "../i18n";

export function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useI18n();

  const navigation = [
    { labelKey: "layout.nav.dashboard", href: "/", icon: LayoutDashboard },
    { labelKey: "layout.nav.contentTypes", href: "/content-types", icon: Database },
    { labelKey: "layout.nav.mediaLibrary", href: "/media", icon: Image },
    { labelKey: "layout.nav.users", href: "/users", icon: Users },
    { labelKey: "layout.nav.apiPermissions", href: "/api-permissions", icon: Key },
    { labelKey: "layout.nav.plugins", href: "/plugins", icon: Puzzle },
    { labelKey: "layout.nav.featureGaps", href: "/feature-gaps", icon: Palette },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 border-r border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl flex flex-col transition-transform duration-300 ${
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
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 backdrop-blur-sm transition-colors"
          >
            <Settings className="w-5 h-5" />
            {t("layout.nav.settings")}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}