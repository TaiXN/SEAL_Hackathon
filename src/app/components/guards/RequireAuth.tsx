import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

const RequireAuth = () => {
  // 1. Chỉ lấy đúng cái accessToken ra để ông bảo vệ soi
  const accessToken = useAuthStore((state) => state.accessToken);
  const location = useLocation();

  if (!accessToken) {
    // 2. Không có vé (Chưa đăng nhập hoặc vé bị Axios xóa do hết hạn) -> Đuổi về /login
    // - replace: true để đè lịch sử, tránh bấm nút back trên trình duyệt bị lặp vòng
    // - state: lưu lại địa chỉ cũ để đăng nhập xong trả về đúng chỗ đó
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Có vé -> Mở cổng cho đi tiếp vào các tầng bên trong
  return <Outlet />;
};

export default RequireAuth;
