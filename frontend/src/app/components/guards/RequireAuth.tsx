import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

const RequireAuth = () => {
  const { accessToken, role } = useAuthStore();
  const location = useLocation();

  // 1. Chưa đăng nhập -> Đá về Login
  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentPath = location.pathname.toLowerCase();
  const currentRole = role?.toLowerCase()?.trim();

  if (currentRole === "admin") {
    if (!currentPath.startsWith("/admin")) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  } else if (currentRole === "judge") {
    if (!currentPath.startsWith("/judge")) {
      return <Navigate to="/judge" replace />;
    }
  } else if (currentRole === "player") {
    if (currentPath.startsWith("/admin") || currentPath.startsWith("/judge")) {
      return <Navigate to="/player" replace />;
    }
  } else {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
