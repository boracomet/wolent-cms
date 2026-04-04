import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ContentTypes } from "./components/ContentTypes";
import { ContentBuilder } from "./components/ContentBuilder";
import { ContentList } from "./components/ContentList";
import { ContentEditor } from "./components/ContentEditor";
import { MediaLibrary } from "./components/MediaLibrary";
import { UserManagement } from "./components/UserManagement";
import { ApiPermissions } from "./components/ApiPermissions";
import { Settings } from "./components/Settings";
import { Plugins } from "./components/Plugins";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { FeatureGapsShowcase } from "./components/FeatureGapsShowcase";
import { LoginPage } from "./components/LoginPage";

export const router = createBrowserRouter([
  { path: "/login", Component: LoginPage },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "content-types", Component: ContentTypes },
      { path: "content-types/:id/builder", Component: ContentBuilder },
      { path: "content/:type", Component: ContentList },
      { path: "content/:type/create", Component: ContentEditor },
      { path: "content/:type/:id", Component: ContentEditor },
      { path: "media", Component: MediaLibrary },
      { path: "users", Component: UserManagement },
      { path: "api-permissions", Component: ApiPermissions },
      { path: "plugins", Component: Plugins },
      { path: "analytics", Component: AnalyticsDashboard },
      { path: "feature-gaps", Component: FeatureGapsShowcase },
      { path: "settings", Component: Settings },
    ],
  },
]);