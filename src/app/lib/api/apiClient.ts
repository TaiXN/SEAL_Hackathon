import axios from "axios";
import { useAuthStore } from "../../stores/auth.store";
import { jwtDecode } from "jwt-decode";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

//REQUEST INTERCEPTOR: attach token: tự động thêm token vào header Authorization nếu cần
apiClient.interceptors.request.use(
  async (config) => {
    // 1. chỉ lấy token khi ko phải trang login
    if (config.url?.includes("/login")) {
      return config; // return config cho an toàn
    }
    let accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      try {
        const decodedToken = jwtDecode(accessToken);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp && decodedToken.exp < currentTime + 10) {
          console.log("Token sắp hết hạn, đang đổi token...");

          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/Auth/refreshtoken`,
            {},
            { withCredentials: true },
          );

          const newAccessToken = response.data.accessToken;
          const currentRole = useAuthStore.getState().role;

          useAuthStore
            .getState()
            .setTokens(newAccessToken, currentRole || "member");

          // cập nhật lại newAc vào access token global để gắn vô header
          accessToken = newAccessToken;
          console.log("Cấp token mới thành công, duy trì đăng nhập!");
        }
      } catch (error) {
        console.error("Lỗi token!");
        useAuthStore.getState().clearTokens();
        window.location.href = "/";
        return Promise.reject(error);
      }
      // 3. Gắn biến accessToken (dù cũ hay mới) vô header
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// RESPONSE INTERCETPTOR : Xử lý lỗi chung
// ví dụ 401 Unauthorized: set tự động xin vé mới || logout
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // nếu 401 thì ac bị cố tình đổi trong f12 => đá về login luôn
    if (error.response?.status === 401) {
      console.error(
        "Truy cập trái phép hoặc vé bị Backend từ chối! Đăng xuất!",
      );
      useAuthStore.getState().clearTokens();
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export default apiClient;
