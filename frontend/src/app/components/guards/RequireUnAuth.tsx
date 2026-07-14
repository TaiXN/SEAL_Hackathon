import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

const RequireUnAuth = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);

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
  return <Outlet />;
};

export default RequireUnAuth;
