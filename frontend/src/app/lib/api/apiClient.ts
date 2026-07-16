import axios from "axios";
import { useAuthStore } from "../../stores/auth.store";

// Khởi tạo instance
const apiClient = axios.create({
  baseURL: "https://seal.cosplane.io.vn", // Hoặc biến môi trường của bà
  headers: {
    "Content-Type": "application/json",
  },
});

// Cờ báo hiệu đang refresh token
let isRefreshing = false;
// Hàng đợi các request bị kẹt lại chờ token mới
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ==========================================
// INTERCEPTOR GẮN TOKEN VÀO REQUEST
// ==========================================
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ==========================================
// INTERCEPTOR BẮT LỖI 401 VÀ REFRESH TOKEN
// ==========================================
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 (Hết hạn Token) và chưa từng thử gửi lại (_retry)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu lỗi 401 xảy ra ngay tại API login hoặc refresh, thì bỏ qua luôn (tránh lặp vô tận)
      if (
        originalRequest.url.includes("/login") ||
        originalRequest.url.includes("/refresh")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Đang có người khác đi lấy token rồi, mình xếp hàng đợi
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // GỌI API REFRESH TOKEN Ở ĐÂY (Sửa lại đúng URL của Backend bà nhé)
        const res = await axios.post(
          "https://seal.cosplane.io.vn/api/Auth/refresh-token",
          {
            refreshToken: refreshToken,
          },
        );

        const newAccessToken = res.data.accessToken;

        // Cập nhật token mới vào kho
        useAuthStore.getState().updateAccessToken(newAccessToken);

        // Báo cho các request đang xếp hàng biết là có token mới rồi
        processQueue(null, newAccessToken);

        // Chạy lại cái request vừa bị tịt
        originalRequest.headers.Authorization = "Bearer " + newAccessToken;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().clearTokens();
        // Refresh thất bại (do token refresh cũng hết hạn luôn) -> Đá văng về trang Login
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
