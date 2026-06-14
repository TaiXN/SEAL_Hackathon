import { createBrowserRouter, Navigate } from "react-router-dom";

// 1. IMPORT CÁC TRANG ĐƠN (Đứng 1 mình)
import { Landing } from "./pages/Landing";
import { AuthLayout } from "./pages/AuthLayout";
import { Gateway } from "./pages/Gateway";
import Judge from "./pages/Judge";

// 👇 IMPORT THẰNG BẢO VỆ CỦA BÀ VÀO ĐÂY:
// (Bà nhớ sửa lại đường dẫn cho đúng với vị trí file RequireAuth của bà nha)
import RequireAuth from "../app/components/guards/RequireAuth"; // Đường dẫn này chỉ là ví dụ, bà sửa lại cho đúng với cấu trúc thư mục của bà nhé!

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
import { AdminLayout } from "./components/adminPage/AdminLayout";
import { AdminViolationsPage } from "./pages/Admin/AdminViolationsPage";
import { AdminUsersPage } from "./pages/Admin/AdminUsersPage";
import { CreateEventWizard } from "./pages/Admin/CreateEventWizard";
import { Dashboard as AdminDashboard } from "./pages/Admin/Dashboard";
import { EventDetailPage as AdminEventDetail } from "./pages/Admin/EventDetailPage";
import { EventsPage as AdminEvents } from "./pages/Admin/EventsPage";
import { ProfilePage as AdminProfile } from "./pages/Admin/ProfilePage";
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
    element: <RequireAuth />, // Ông bảo vệ đứng chặn ngay cửa tổng này!
    children: [
      { path: "/gateway", element: <Gateway /> },
      // --- Khu vực của Admin (Được bảo mật bởi RequireAuth) ---
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <AdminDashboard />,
          },
          {
            path: "events",
            element: <AdminEvents />,
          },
          {
            path: "events/create",
            element: <CreateEventWizard />,
          },
          {
            path: "events/:id",
            element: <AdminEventDetail />,
          },
          {
            path: "users",
            element: <AdminUsersPage />,
          },
          {
            path: "violations",
            element: <AdminViolationsPage />,
          },
          {
            path: "profile",
            element: <AdminProfile />,
          },
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
