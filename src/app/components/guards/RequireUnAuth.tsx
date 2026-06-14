import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

const RequireUnAuth = () => {
  // Rút cả accessToken và role từ két sắt ra
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);

  if (accessToken) {
    // 1. ĐÃ CÓ TOKEN: Tùy theo chức vụ mà đẩy về đúng cái cửa của người đó
    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (role === "judge") {
      return <Navigate to="/judge" replace />; // (Đường dẫn này bà tự chỉnh lại cho đúng router nha)
    }

    // Nếu là member bình thường thì đẩy vô cổng gateway hoặc trang chủ
    return <Navigate to="/gateway" replace />;
  }

  // 2. CHƯA CÓ TOKEN: Cho phép đi tiếp vào form Login/Register
  return <Outlet />;
};

export default RequireUnAuth;
