import { createBrowserRouter, Navigate } from "react-router-dom";

import { Landing } from "./pages/Landing";
import { AuthLayout } from "./pages/AuthLayout";
import { Gateway } from "./pages/Gateway";
import RequireAuth from "../app/components/guards/RequireAuth";
import RequireUnAuth from "../app/components/guards/RequireUnAuth";

import { Dashboard as PlayerDashboard } from "./pages/Player/Dashboard";
import { Team as PlayerTeam } from "./pages/Player/Team";
import { Submit as PlayerSubmit } from "./pages/Player/Submit";
import { PlayerLayout } from "./pages/Player/PlayerLayout";

import { AdminLayout } from "../app/components/adminPage/AdminLayout";
import { AdminViolationsPage } from "./pages/Admin/AdminViolationsPage";
import { ManageUsersAndAssign } from "./pages/Admin/ManageUsersAndAssign";
import { CreateEvents } from "./pages/Admin/CreateEvents";
import { Dashboard as AdminDashboard } from "./pages/Admin/Dashboard";
import { EventDetailsPage } from "./pages/Admin/EventDetailsPage";
import { EventHistoryPage } from "./pages/Admin/EventHistoryPage";
import { ProfilePage as AdminProfile } from "./pages/Admin/ProfilePage";
import { AdminPrizesPage } from "./pages/Admin/AdminPrizesPage";
import { AdminLeaderboardPage } from "./pages/Admin/AdminLeaderboardPage";

import { JudgeDashboard } from "./pages/Judge/JudgeDashboard";
import { ProfilePage as JudgeProfile } from "./pages/Judge/ProfilePage";
import { ScoringPage } from "./pages/Judge/ScoringPage";

export const router = createBrowserRouter([
  // 1. PUBLIC ZONE (Ai vào cũng được, log in rồi vẫn xem được Landing Page)
  { path: "/", element: <Landing /> },

  // 2. UN-AUTH ZONE (Chỉ dành cho người CHƯA đăng nhập)
  {
    element: <RequireUnAuth />,
    children: [{ path: "/login", element: <AuthLayout /> }],
  },

  // 3. AUTH ZONE (Bảo mật: Check kỹ Role ở bên trong)
  {
    element: <RequireAuth />,
    children: [
      // Gateway dùng cho Player vừa login xong để chọn Create/Join Team
      { path: "/gateway", element: <Gateway /> },

      // --- Khu vực của Admin ---
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "users", element: <ManageUsersAndAssign /> },
          { path: "violations", element: <AdminViolationsPage /> },
          { path: "events/create", element: <CreateEvents /> },
          { path: "events", element: <EventHistoryPage /> },
          { path: "events/:id", element: <EventDetailsPage /> },
          { path: "profile", element: <AdminProfile /> },
          { path: "prizes", element: <AdminPrizesPage /> },
          { path: "leaderboard", element: <AdminLeaderboardPage /> },
        ],
      },

      // --- Khu vực của Judge ---
      {
        path: "/judge",
        children: [
          { index: true, element: <JudgeDashboard /> },
          { path: "profile", element: <JudgeProfile /> },
          { path: "score/:teamId", element: <ScoringPage /> },
        ],
      },

      // --- Khu vực của Player ---
      {
        path: "/player",
        element: <PlayerLayout />,
        children: [
          { index: true, element: <PlayerDashboard /> },
          { path: "team", element: <PlayerTeam /> },
          { path: "submit", element: <PlayerSubmit /> },
        ],
      },

      // Đi bậy bạ trong khu vực Auth thì đá về Gateway/Dashboard
      { path: "*", element: <Navigate to="/login" replace /> },
    ],
  },
]);
