import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

const RequireAuth = () => {
  const { accessToken, role } = useAuthStore();
  const location = useLocation();

  // 1. Chưa đăng nhập -> Đá về Login
  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. PHÂN LUỒNG ROLE TUYỆT ĐỐI (Chống Nút Back đi lạc sang Role khác)
  const currentPath = location.pathname.toLowerCase();
  const currentRole = role?.toLowerCase()?.trim();

  if (currentRole === "admin") {
    // Admin không được lọt vào player, judge, gateway
    if (!currentPath.startsWith("/admin")) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  } else if (currentRole === "judge" || currentRole === "teacher") {
    // Judge không được lọt vào admin, player, gateway
    if (!currentPath.startsWith("/judge")) {
      return <Navigate to="/judge" replace />;
    }
  } else if (currentRole === "player") {
    // Player không được lọt vào admin, judge
    if (currentPath.startsWith("/admin") || currentPath.startsWith("/judge")) {
      return <Navigate to="/player" replace />;
    }
  } else {
    // Lạ lạ thì kick ra login
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
