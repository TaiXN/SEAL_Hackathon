import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import { jwtDecode } from "jwt-decode";

const RequireAuth = () => {
  const location = useLocation();

  // 1. lấy data sẽ dùng từ store ra
  // k gọi hết cả store mà k xài lãng phí
  const accessToken = useAuthStore((state) => state.accessToken);
  const userRole = useAuthStore((state) => state.role);
  const clearTokens = useAuthStore((state) => state.clearTokens);

  // lấy setTokens để có vé mới thì cất vô
  const setTokens = useAuthStore((state) => state.setTokens);

  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!accessToken) {
        setIsValid(false);
        setIsChecking(false);
        return;
      }

      try {
        // check hạn sd và cấp access token mới nếu cần

        // soi nội dung vé hiện tại
        const decodedToken = jwtDecode(accessToken);

        // lấy giờ hiện tại của máy (tính bằng giây nên phải chia 1000)
        const currentTime = Date.now() / 1000;

        // khai báo 1 biến token để lát xài, mặc định là token cũ
        let tokenToUse = accessToken;

        // nếu time hiện tại > thời gian hết hạn (exp) -> vé hết tác dụng
        if (decodedToken.exp && decodedToken.exp < currentTime) {
          console.log("Access token hết hạn, đang lấy vé mới...");

          // gọi API lấy access mới (bật credentials: 'include' để config Cookie)
          const refreshResponse = await fetch(
            "https://seal.cosplane.io.vn/api/Auth/refreshtoken",
            {
              method: "POST",
              // k gắn header authorization vì khi gọi refreshToken
              // thì cái access token cũ chết r, gắn header authori chi nữa
              credentials: "include",
            },
          );

          if (refreshResponse.ok) {
            // 1. CHỖ SỬA THỨ NHẤT: Bóc hộp JSON ra lấy đúng cái lõi
            const data = await refreshResponse.json();
            const newAccessToken = data.accessToken; // Bóc đúng cái thẻ VIP ra

            // cất access mới vô kho zustand
            setTokens(newAccessToken, userRole!);

            // gán vé mới vào biến để lát check
            tokenToUse = newAccessToken;
            console.log("Lấy vé mới thành công, đi tiếp thôi!");
          } else {
            // đổi vé thất bại (có thể Cookie Refresh cũng hết hạn)
            // -> xóa sạch kho zustand và bắt login lại
            throw new Error("Refresh token failed");
          }
        }

        let apiUrl = "";
        let isRawText = true;

        if (userRole === "admin" || userRole === "judge") {
          apiUrl = "https://seal.cosplane.io.vn/api/Auth/checktoken";
          isRawText = true;
        } else {
          apiUrl = "https://seal.cosplane.io.vn/api/Auth/checktoken";
          isRawText = true;
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenToUse}`,
          },
        });

        if (response.ok) {
          if (isRawText) {
            await response.text();
          } else {
            await response.json();
            // xử lý phân luồng cho participant ở đây
            // xử lý sau: hasTeam....
          }
          setIsValid(true);
        } else {
          throw new Error("Token không hợp lệ với BE");
        }
      } catch (error) {
        console.error("Lỗi xác thực:", error);
        clearTokens();
        setIsValid(false);
      } finally {
        setIsChecking(false);
      }
    };

    verifyToken();
  }, [accessToken, userRole, clearTokens, setTokens]);

  // ================= RETURN RA GIAO DIỆN =================
  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <h2 className="text-xl font-semibold text-slate-600">
          Đang kiểm tra quyền truy cập...
        </h2>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
