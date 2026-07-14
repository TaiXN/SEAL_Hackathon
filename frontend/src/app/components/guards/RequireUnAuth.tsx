<<<<<<< HEAD
import React, { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
=======
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
>>>>>>> Tri-dev-pr
import { useAuthStore } from "../../stores/auth.store";

const RequireUnAuth = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);
<<<<<<< HEAD
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
=======

  if (accessToken) {
    // 1. có token: tùy theo role, đẩy về đúng page đó
    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (role === "judge") {
      return <Navigate to="/judge" replace />;
    }

    return <Navigate to="/gateway" replace />;
  }

  // 2. chưa có token: cho phép đi tiếp vào form Login/Register
>>>>>>> Tri-dev-pr
  return <Outlet />;
};

export default RequireUnAuth;
