import { createBrowserRouter } from "react-router-dom";

// 1. IMPORT CÁC TRANG ĐƠN
import { Landing } from "./pages/Landing";
import { AuthLayout } from "./pages/AuthLayout";
import { Gateway } from "./pages/Gateway";
import Judge from "./pages/Judge";
import RequireAuth from "../app/components/guards/RequireAuth";

// 2. IMPORT CỤM TRANG LEADER
import { Layout as LeaderLayout } from "./components/leaderPage/Layout";
import { Dashboard as LeaderDashboard } from "./pages/Leader/Dashboard";
import { Team as LeaderTeam } from "./pages/Leader/Team";
import { Submit as LeaderSubmit } from "./pages/Leader/Submit";

// 3. IMPORT CỤM TRANG MEMBER
import { Layout as MemberLayout } from "./components/memberPage/Layout";
import { Dashboard as MemberDashboard } from "./pages/Member/Dashboard";
import { MyTeam as MemberMyTeam } from "./pages/Member/MyTeam";
import { Sidebar as MemberSidebar } from "./pages/Member/Sidebar";

// 3. IMPORT CỤM TRANG ADMIN
import { AdminLayout as AdminLayout } from "../app/components/adminPage/AdminLayout";
import { AdminViolationsPage as AdminViolationsPage } from "./pages/Admin/AdminViolationsPage";
import { ManageUsersAndAssign as ManageUsersAndAssign } from "./pages/Admin/ManageUsersAndAssign";
import { CreateEvents as CreateEvents } from "./pages/Admin/CreateEvents";
import { Dashboard as AdminDashboard } from "./pages/Admin/Dashboard";
import { EventDetailsPage as EventDetailsPage } from "./pages/Admin/EventDetailsPage";
import { EventHistoryPage as EventHistoryPage } from "./pages/Admin/EventHistoryPage";
import { ProfilePage as AdminProfile } from "./pages/Admin/ProfilePage";
// import { AdminUsersPage as AdminUsers } from "./pages/Admin/AdminUsersPage";
// import { AdminViolationsPage as AdminViolations } from "./pages/Admin/AdminViolationsPage";

// 4. IMPORT CỤM TRANG JUDGE
import { JudgeDashboard } from "./pages/Judge/JudgeDashboard";
import { ProfilePage } from "./pages/Judge/ProfilePage";
import { ScoringPage } from "./pages/Judge/ScoringPage";

export const router = createBrowserRouter([
  // =========================================================
  // KHU VỰC CÔNG CỘNG: Ai vào cũng được, không cần token
  // =========================================================
  { path: "/", element: <Landing /> },
  { path: "/login", element: <AuthLayout /> },

  // =========================================================
  // KHU VỰC BẢO MẬT: BẮT BUỘC PHẢI QUA REQUIREAUTH KIỂM TRA
  // =========================================================
  {
    element: <RequireAuth />,
    children: [
      { path: "/gateway", element: <Gateway /> },
      // --- Khu vực của Admin (Được bảo mật bởi RequireAuth) ---
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <CreateEvents /> }, // Trang chính của Admin
          { path: "users", element: <ManageUsersAndAssign /> },
          { path: "violations", element: <AdminViolationsPage /> },
          { path: "events/create", element: <CreateEvents /> },
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "events", element: <EventHistoryPage /> },
          { path: "events/:id", element: <EventDetailsPage /> },
          { path: "profile", element: <AdminProfile /> },
          // { path: "users", element: <AdminUsers /> },
          // { path: "violations", element: <AdminViolations /> },
        ],
      },
      // --- Khu vực của Judge (Cũng được bảo mật) ---
      {
        path: "/judge",
        // element: <JudgeDashboard />,
        children: [
          { index: true, element: <JudgeDashboard /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "score", element: <ScoringPage /> },
        ],
      },

      // --- Khu vực của Leader (Cũng được bảo mật) ---
      {
        path: "/leader",
        element: <LeaderLayout />,
        children: [
          { index: true, element: <LeaderDashboard /> },
          { path: "team", element: <LeaderTeam /> },
          { path: "submit", element: <LeaderSubmit /> },
        ],
      },

      // --- Khu vực của Member (Cũng được bảo mật) ---
      {
        path: "/member",
        element: <MemberLayout />,
        children: [
          { index: true, element: <MemberDashboard /> },
          { path: "team", element: <MemberMyTeam /> },
          { path: "sidebar", element: <MemberSidebar /> },
        ],
      },
    ],
  },
]);
