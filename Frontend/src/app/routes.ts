import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { CodeReview } from "./pages/CodeReview";
import { SecurityInsights } from "./pages/SecurityInsights";
import { ProjectHistory } from "./pages/ProjectHistory";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/app",
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "review", Component: CodeReview },
      { path: "security", Component: SecurityInsights },
      { path: "history", Component: ProjectHistory },
      { path: "settings", Component: Settings },
    ],
  },
]);
