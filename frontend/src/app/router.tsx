import { createBrowserRouter, Navigate } from "react-router-dom";

// 1. IMPORT CÁC TRANG ĐƠN
import { Landing } from "./pages/Landing";
import { AuthLayout } from "./pages/AuthLayout";
import { Gateway } from "./pages/Gateway";
import RequireAuth from "../app/components/guards/RequireAuth";
import RequireUnAuth from "../app/components/guards/RequireUnAuth";

// 2. IMPORT CỤM TRANG PLAYER
import { Dashboard as PlayerDashboard } from "./pages/Player/Dashboard";
import { Team as PlayerTeam } from "./pages/Player/Team";
import { Submit as PlayerSubmit } from "./pages/Player/Submit";
import { PlayerLayout } from "./pages/Player/PlayerLayout";

// 3. IMPORT CỤM TRANG ADMIN
import { AdminLayout as AdminLayout } from "../app/components/adminPage/AdminLayout";
import { AdminViolationsPage as AdminViolationsPage } from "./pages/Admin/AdminViolationsPage";
import { ManageUsersAndAssign as ManageUsersAndAssign } from "./pages/Admin/ManageUsersAndAssign";
import { CreateEvents as CreateEvents } from "./pages/Admin/CreateEvents";
import { Dashboard as AdminDashboard } from "./pages/Admin/Dashboard";
import { EventDetailsPage as EventDetailsPage } from "./pages/Admin/EventDetailsPage";
import { EventHistoryPage as EventHistoryPage } from "./pages/Admin/EventHistoryPage";
import { ProfilePage as AdminProfile } from "./pages/Admin/ProfilePage";

// 4. IMPORT CỤM TRANG JUDGE
import { JudgeDashboard } from "./pages/Judge/JudgeDashboard";
import { ProfilePage as JudgeProfile } from "./pages/Judge/ProfilePage";
import { ScoringPage } from "./pages/Judge/ScoringPage";
import { AdminPrizesPage } from "./pages/Admin/AdminPrizesPage";

export const router = createBrowserRouter([
  // =========================================================
  // 🚨 KHU VỰC UN-AUTH: CHỈ CHO NGƯỜI CHƯA ĐĂNG NHẬP
  // Những ai đã có Token mà bấm Back về 3 trang này sẽ lập tức bị bẻ lái về Dashboard!
  // =========================================================
  {
    element: <RequireUnAuth />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/gateway", element: <Gateway /> },
      { path: "/login", element: <AuthLayout /> },
    ],
  },

  // =========================================================
  // 🔒 KHU VỰC BẢO MẬT: BẮT BUỘC PHẢI QUA REQUIREAUTH KIỂM TRA
  // =========================================================
  {
    element: <RequireAuth />,
    children: [
      // ĐÃ XÓA /gateway Ở ĐÂY VÌ ĐÃ DỜI LÊN TRÊN RỒI!

      // --- Khu vực của Admin ---
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <CreateEvents /> },
          { path: "users", element: <ManageUsersAndAssign /> },
          { path: "violations", element: <AdminViolationsPage /> },
          { path: "events/create", element: <CreateEvents /> },
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "events", element: <EventHistoryPage /> },
          { path: "events/:id", element: <EventDetailsPage /> },
          { path: "profile", element: <AdminProfile /> },
          { path: "prizes", element: <AdminPrizesPage /> },
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

      // Fallback cho người đi lạc trong khu vực Auth
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
