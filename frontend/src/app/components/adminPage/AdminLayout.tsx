import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Hexagon,
  LayoutDashboard,
  CalendarDays,
  Users,
  ShieldAlert,
  LogOut,
  User,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../../lib/api/authApi";
import { useAuthStore } from "../../stores/auth.store";

const SIDEBAR_COLLAPSED_KEY = "seal-admin-sidebar-collapsed";

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const clearTokens = useAuthStore((state) => state.clearTokens);

  // Rail thu gọn (chỉ còn icon) là chuyện của màn hình >= lg. Dưới lg thì sidebar
  // luôn là drawer trượt ra, thu gọn kiểu rail ở đó chỉ tổ chiếm mất chỗ.
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1",
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isCollapsed ? "1" : "0");
  }, [isCollapsed]);

  // Bấm menu xong mà drawer còn nằm đó thì nó che luôn trang vừa mở.
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMobileOpen]);

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/admin/dashboard",
    },

    {
      name: "Events & Rounds",
      icon: <CalendarDays size={20} />,
      path: "/admin/events",
    },

    {
      name: "Users & Assignments",
      icon: <Users size={20} />,
      path: "/admin/users",
    },

    {
      name: "Violations & Discipline",
      icon: <ShieldAlert size={20} />,
      path: "/admin/violations",
    },
    // Leaderboard, Audit Log và Prizes đã chuyển vào trang chi tiết sự kiện: cả ba
    // chỉ có nghĩa khi gắn với MỘT sự kiện cụ thể, xem gộp toàn hệ thống thì admin
    // không biết số liệu/giải thưởng thuộc sự kiện nào.
  ];

  const handleLogout = async () => {
    const loadingToastId = toast.loading("Logging out...");
    try {
      await authApi.logout(); //xóa cookie & token

      toast.success("Logged out successfully! See you next time.", {
        id: loadingToastId,
      });
    } catch (error) {
      console.error("Lỗi BE khi logout nhưng vẫn xóa FE:", error);
      toast.error(
        "A system error occurred, but you have been logged out successfully!",
        {
          id: loadingToastId,
        },
      );
    } finally {
      clearTokens();
      localStorage.removeItem("seal-hackathon-auth");
      navigate("/");
    }
  };

  // Ở trạng thái rail thì nhãn bị ẩn, giữ lại title để hover còn biết nút nào là nút nào.
  const railTitle = (label: string) => (isCollapsed ? label : undefined);

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans text-gray-900">
      {/* Nền mờ chỉ tồn tại khi drawer mở trên mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between border-r border-gray-200 bg-white shadow-xl transition-[width,transform] duration-300 ease-in-out lg:static lg:z-20 lg:translate-x-0 lg:shadow-sm ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div
            className={`flex h-20 items-center border-b border-gray-100 ${
              isCollapsed ? "lg:justify-center lg:px-0" : ""
            } gap-3 px-6`}
          >
            <Hexagon
              size={28}
              className="flex-shrink-0 text-[#f26f21]"
              strokeWidth={2.5}
            />
            <div
              className={`min-w-0 flex-1 ${isCollapsed ? "lg:hidden" : ""}`}
            >
              <h1 className="truncate text-base font-black leading-tight tracking-tight">
                SEAL Hackathon
              </h1>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                ADMIN PORTAL
              </p>
            </div>

            {/* Nút đóng drawer: chỉ có trên mobile */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="-mr-2 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav
            className={`mt-4 space-y-2 p-4 ${isCollapsed ? "lg:px-3" : ""}`}
          >
            {menuItems.map((item) => {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={railTitle(item.name)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
                      isCollapsed ? "lg:justify-center lg:px-0" : ""
                    } ${
                      isActive
                        ? "bg-[#f26f21] text-white shadow-md"
                        : "text-gray-500 hover:bg-orange-50 hover:text-[#c2410c]"
                    }`
                  }
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className={isCollapsed ? "lg:hidden" : ""}>
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div
          className={`space-y-1 border-t border-gray-100 p-4 ${
            isCollapsed ? "lg:px-3" : ""
          }`}
        >
          {/* Nút thu gọn/mở rail: vô nghĩa trên mobile nên ẩn dưới lg */}
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`hidden w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:flex ${
              isCollapsed ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}
            <span className={isCollapsed ? "lg:hidden" : ""}>Collapse</span>
          </button>

          <NavLink
            to="profile"
            title={railTitle("My Profile")}
            className={({ isActive }) =>
              `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
                isCollapsed ? "lg:justify-center lg:px-0" : ""
              } ${
                isActive
                  ? "bg-black text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-100 hover:text-black"
              }`
            }
          >
            <User size={20} className="flex-shrink-0" />
            <span className={isCollapsed ? "lg:hidden" : ""}>My Profile</span>
          </NavLink>

          <button
            onClick={handleLogout}
            title={railTitle("Log Out")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 ${
              isCollapsed ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className={isCollapsed ? "lg:hidden" : ""}>Log Out</span>
          </button>
        </div>
      </aside>

      {/* min-w-0: không có nó thì bảng rộng bên trong đẩy phình cả main ra ngoài viewport */}
      <main className="relative flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <Hexagon size={22} className="text-[#f26f21]" strokeWidth={2.5} />
          <span className="text-sm font-black tracking-tight">
            SEAL Hackathon
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
