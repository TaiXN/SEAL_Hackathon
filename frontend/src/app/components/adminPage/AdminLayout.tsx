import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Hexagon,
  LayoutDashboard,
  CalendarDays,
  Users,
  ShieldAlert,
  LogOut,
  User,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../../lib/api/authApi";
import { useAuthStore } from "../../stores/auth.store";

export function AdminLayout() {
  const navigate = useNavigate();
  const clearTokens = useAuthStore((state) => state.clearTokens);

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
    {
      name: "Prizes & Awards",
      icon: <Trophy size={20} />,
      path: "/admin/prizes",
    }, // update admin sidebar
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

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans text-gray-900">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shadow-sm z-20">
        <div>
          <div className="h-20 flex items-center gap-3 px-8 border-b border-gray-100">
            <Hexagon size={28} className="text-black" strokeWidth={2.5} />
            <div>
              <h1 className="font-black text-base tracking-tight leading-tight">
                SEAL Hackathon
              </h1>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                ADMIN PORTAL
              </p>
            </div>
          </div>
          <nav className="p-4 space-y-2 mt-4">
            {menuItems.map((item) => {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                      isActive
                        ? "bg-black text-white shadow-md"
                        : "text-gray-500 hover:bg-gray-100 hover:text-black"
                    }`
                  }
                >
                  {item.icon} {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 space-y-1">
          <NavLink
            to="profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? "bg-black text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-100 hover:text-black"
              }`
            }
          >
            <User size={20} /> My Profile
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} /> Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
