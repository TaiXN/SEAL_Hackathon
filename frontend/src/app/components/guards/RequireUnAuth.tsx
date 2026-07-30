import { useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import { useEffect } from "react";

const RequireUnAuth = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);
  const clearTokens = useAuthStore((state) => state.clearTokens);
  const navigate = useNavigate();

  useEffect(() => {
    if (accessToken) {
      const currentRole = role?.toLowerCase()?.trim();

      if (currentRole === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (currentRole === "mentor") {
        navigate("/judge", { replace: true });
      } else if (currentRole === "judge" || currentRole === "teacher") {
        navigate("/judge", { replace: true });
      } else if (
        currentRole === "player" ||
        currentRole === "member" ||
        currentRole === "leader" ||
        currentRole === "student"
      ) {
        navigate("/player", { replace: true });
      } else {
        clearTokens();
        localStorage.removeItem("seal-hackathon-auth");
      }
    }
  }, [accessToken, role, clearTokens, navigate]);

  if (accessToken) {
    return null;
  }

  return <Outlet />;
};

export default RequireUnAuth;
