import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

const RequireUnAuth = () => {
  // Rút trực tiếp accessToken từ két sắt Zustand ra kiểm tra
  const isAuthed = useAuthStore((state) => state.accessToken);

  if (isAuthed) {
    // 1. ĐÃ CÓ TOKEN: Tức là đang đăng nhập rồi.
    // Đá văng ra trang chủ (Landing Page) ngay và luôn để khỏi mắc công thấy form Login nữa.
    // (Bà yên tâm, lỡ cái token này hết hạn thì lúc nó mò vô mấy trang bảo mật,
    // thằng RequireAuth sẽ tự tịch thu thẻ và quăng nó lại về đây thôi).
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RequireUnAuth;
