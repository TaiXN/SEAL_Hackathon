import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

const RequireUnAuth = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);

  if (accessToken) {
    // Ép chữ thường hết để so sánh không bao giờ bị hụt
    const currentRole = role?.toLowerCase()?.trim();

    if (currentRole === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (currentRole === "judge" || currentRole === "teacher") {
      // Tui thêm teacher phòng hờ BE nó trả về chữ này
      return <Navigate to="/judge" replace />;
    }

    // Nếu có token nhưng role không phải admin hay judge (vd: sinh viên)
    return <Navigate to="/gateway" replace />;
  }

  // 2. chưa có token: cho phép đi tiếp vào form Login/Register (<Outlet />)
  return <Outlet />;
};

export default RequireUnAuth;
