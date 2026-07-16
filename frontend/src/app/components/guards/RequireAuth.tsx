import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

const RequireAuth = () => {
  const { accessToken, role } = useAuthStore();
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // BẢO VỆ TUYỆT ĐỐI CHỐNG LỌT ROLE (Ngăn vụ bấm Nút Back)
  const currentPath = location.pathname.toLowerCase();
  const currentRole = role?.toLowerCase()?.trim();

  // Admin lọt vào Player/Judge? Đá về Admin!
  if (
    (currentPath.startsWith("/player") ||
      currentPath.startsWith("/judge") ||
      currentPath.startsWith("/gateway")) &&
    currentRole === "admin"
  ) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Player lọt vào Admin/Judge? Đá về Player!
  if (
    (currentPath.startsWith("/admin") || currentPath.startsWith("/judge")) &&
    currentRole === "player"
  ) {
    return <Navigate to="/player" replace />;
  }

  // Judge lọt vào Admin/Player? Đá về Judge!
  if (
    (currentPath.startsWith("/admin") ||
      currentPath.startsWith("/player") ||
      currentPath.startsWith("/gateway")) &&
    (currentRole === "judge" || currentRole === "teacher")
  ) {
    return <Navigate to="/judge" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
