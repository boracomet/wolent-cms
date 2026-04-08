import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { AdminOnly } from "./components/AdminOnly";
import { LoginPage } from "./components/LoginPage";

const Dashboard = lazy(() =>
  import("./components/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const ContentTypes = lazy(() =>
  import("./components/ContentTypes").then((m) => ({ default: m.ContentTypes })),
);
const ContentBuilder = lazy(() =>
  import("./components/ContentBuilder").then((m) => ({ default: m.ContentBuilder })),
);
const ContentList = lazy(() =>
  import("./components/ContentList").then((m) => ({ default: m.ContentList })),
);
const ContentEditor = lazy(() =>
  import("./components/ContentEditor").then((m) => ({ default: m.ContentEditor })),
);
const MediaLibrary = lazy(() =>
  import("./components/MediaLibrary").then((m) => ({ default: m.MediaLibrary })),
);
const UserManagement = lazy(() =>
  import("./components/UserManagement").then((m) => ({ default: m.UserManagement })),
);
const ApiPermissions = lazy(() =>
  import("./components/ApiPermissions").then((m) => ({ default: m.ApiPermissions })),
);
const Settings = lazy(() =>
  import("./components/Settings").then((m) => ({ default: m.Settings })),
);
const Plugins = lazy(() =>
  import("./components/Plugins").then((m) => ({ default: m.Plugins })),
);
const AnalyticsDashboard = lazy(() =>
  import("./components/AnalyticsDashboard").then((m) => ({ default: m.AnalyticsDashboard })),
);
const AuditLogs = lazy(() =>
  import("./components/AuditLogs").then((m) => ({ default: m.AuditLogs })),
);

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-zinc-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-100" />
    </div>
  );
}

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<PageFallback />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  { path: "/login", element: withSuspense(<LoginPage />) },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: withSuspense(<Dashboard />) },
      { path: "content-types", element: withSuspense(<ContentTypes />) },
      { path: "content-types/:id/builder", element: withSuspense(<ContentBuilder />) },
      { path: "content/:type", element: withSuspense(<ContentList />) },
      { path: "content/:type/create", element: withSuspense(<ContentEditor />) },
      { path: "content/:type/:id", element: withSuspense(<ContentEditor />) },
      { path: "media", element: withSuspense(<MediaLibrary />) },
      {
        path: "users",
        element: withSuspense(
          <AdminOnly>
            <UserManagement />
          </AdminOnly>,
        ),
      },
      {
        path: "api-permissions",
        element: withSuspense(
          <AdminOnly>
            <ApiPermissions />
          </AdminOnly>,
        ),
      },
      {
        path: "plugins",
        element: withSuspense(
          <AdminOnly>
            <Plugins />
          </AdminOnly>,
        ),
      },
      { path: "analytics", element: withSuspense(<AnalyticsDashboard />) },
      {
        path: "audit-logs",
        element: withSuspense(
          <AdminOnly>
            <AuditLogs />
          </AdminOnly>,
        ),
      },
      { path: "settings", element: withSuspense(<Settings />) },
    ],
  },
]);
