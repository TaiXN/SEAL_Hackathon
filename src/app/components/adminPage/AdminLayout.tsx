import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Hexagon,
  LayoutDashboard,
  CalendarDays,
  Users,
  ShieldAlert,
  LogOut,
  HelpCircle,
  User,
} from "lucide-react";
// 1. IMPORT ZUSTAND VÀO ĐÂY ĐỂ DÙNG HÀM LOGOUT
import { useAuthStore } from "../../stores/auth.store";

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy hàm xóa token từ kho ra
  const clearTokens = useAuthStore((state) => state.clearTokens);

  // 2. SỬA LẠI TOÀN BỘ ĐƯỜNG DẪN: Thêm chữ /admin vô phía trước
  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/admin/dashboard",
    },
    {
      name: "Sự kiện & Vòng thi",
      icon: <CalendarDays size={20} />,
      path: "/admin/events",
    },
    {
      name: "Người dùng & Phân công",
      icon: <Users size={20} />,
      path: "/admin/users",
    },
    {
      name: "Vi phạm & Kỷ luật",
      icon: <ShieldAlert size={20} />,
      path: "/admin/violations",
    },
  ];

  // 3. SỬA HÀM ĐĂNG XUẤT CHO CHUẨN ZUSTAND
  const handleLogout = () => {
    // Dọn sạch kho Zustand (Nó sẽ tự động xóa token và role)
    clearTokens();

    // Đẩy về trang đăng nhập
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans text-gray-900">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shadow-sm z-20">
        <div>
          <div className="p-6 pb-8">
            <div className="flex items-center gap-3">
              <Hexagon size={28} className="text-black" strokeWidth={2.5} />
              <div>
                <h1 className="font-bold text-base tracking-tight leading-tight">
                  SEAL Hackathon
                </h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  Admin Portal
                </p>
              </div>
            </div>
          </div>
          <nav className="px-4 space-y-1.5">
            {menuItems.map((item) => {
              const isActive = location.pathname.includes(item.path);
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                    isActive
                      ? "bg-black text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* KHU VỰC CẬP NHẬT: Profile & Đăng xuất */}
        <div className="p-4 border-t border-gray-100 space-y-1">
          {/* 4. SỬA LUÔN CHỖ NÀY: Thêm /admin vô */}
          <NavLink
            to="/admin/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? "bg-black text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-100 hover:text-black"
              }`
            }
          >
            <User size={20} />
            Trang cá nhân
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-8">
          {/* NƠI RENDER CÁC TRANG CON ĐÃ CÓ MẶT SẴN */}
          <Outlet />
        </div>
        <button className="absolute bottom-6 right-6 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center text-gray-500 hover:text-black hover:border-black transition-colors">
          <HelpCircle size={20} />
        </button>
      </main>
    </div>
  );
}
