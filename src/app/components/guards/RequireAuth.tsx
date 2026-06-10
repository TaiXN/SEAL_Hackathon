import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

const RequireAuth = () => {
  // 1. lấy ac từ kho zustand ra
  const accessToken = useAuthStore((state) => state.accessToken);
  const location = useLocation();

  if (!accessToken) {
    // 2. Không có token (ch đăng nhập hoặc token bị xóa do hết hạn) -> đá về /login
    // - replace: true để đè lịch sử, tránh bấm nút back trên trình duyệt bị lặp vòng
    // - state: lưu lại địa chỉ cũ để đăng nhập xong trả về đúng chỗ đó
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. có -> cho đi tiếp vào các tầng bên trong
  return <Outlet />;
};

export default RequireAuth;
