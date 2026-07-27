import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

const RequireUnAuth = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role)
    ?.toLowerCase()
    ?.trim();

  if (accessToken) {
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "judge" || role === "teacher")
      return <Navigate to="/judge" replace />;

    if (role === "player") return <Navigate to="/player" replace />;

    return <Navigate to="/login" replace />;
  }

  // Chưa đăng nhập thì thoải mái xem Landing, Login
  return <Outlet />;
};

export default RequireUnAuth;
