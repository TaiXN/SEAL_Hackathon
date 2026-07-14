import React, { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

const RequireUnAuth = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);
  const navigate = useNavigate();

  useEffect(() => {
    // Nếu có token, bế cổ ném thẳng về Dashboard, cấm lảng vảng ở Landing/Gateway/Login
    if (accessToken) {
      const currentRole = role?.toLowerCase()?.trim();

      if (currentRole === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (currentRole === "judge" || currentRole === "teacher") {
        navigate("/judge", { replace: true });
      } else if (currentRole === "player") {
        navigate("/player", { replace: true });
      } else {
        // Fallback an toàn nếu role lạ
        navigate("/login", { replace: true });
      }
    }
  }, [accessToken, role, navigate]);

  // 🚨 CHỐNG CHỚP MÀN HÌNH: Nếu phát hiện có Token, trả về null (không vẽ giao diện)
  if (accessToken) {
    return null;
  }

  // Chắc chắn 100% KHÔNG có token thì mới cho hiện trang (Outlet)
  return <Outlet />;
};

export default RequireUnAuth;
