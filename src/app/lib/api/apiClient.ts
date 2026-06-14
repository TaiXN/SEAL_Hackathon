import axios from "axios";
import { useAuthStore } from "../../stores/auth.store";
import { jwtDecode } from "jwt-decode";

// Create instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10s timeout
  withCredentials: true, // gửi - nhận cookie nếu có (dùng cho auth)
});

//Request Interceptor: Attach Token: tự động thêm token vào header Authorization nếu cần
apiClient.interceptors.request.use(
  async (config) => {
    // 1. Chỉ lấy token khi ko phải trang login
    if (config.url?.includes("/login")) {
      return config; // Đi tay không cho an toàn
    }
    let accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      try {
        const decodedToken = jwtDecode(accessToken);
        const currentTime = Date.now() / 1000;
        // 2. Nếu sắp hết hạn -> Âm thầm đi đổi
        if (decodedToken.exp && decodedToken.exp < currentTime + 10) {
          console.log("Thẻ sắp hết hạn, đang đổi vé...");

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

          // Cập nhật biến accessToken cục bộ để tí nữa gắn vô Header
          accessToken = newAccessToken;
          console.log("Đổi vé thành công!");
        }
      } catch (error) {
        console.error("Lỗi token!");
        useAuthStore.getState().clearTokens();
        window.location.href = "/";
        return Promise.reject(error);
      }
      // 3. Gắn cái biến accessToken (dù cũ hay mới) vô đây là xong
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// RESPONSE INTERCETPTOR : Xử lý lỗi chung
// ví dụ 401 Unauthorized thì có thể tự động xin vé mới || logout
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Nếu 401 thì đích thị là bị đổi ac trong f12 => đá thẳng ra cửa luôn
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

// import axios from "axios";
// import { useAuthStore } from "../../stores/auth.store";

// const apiClient = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
//   timeout: 10000,
//   withCredentials: true,
// });

// // TRẠM GÁC ĐẦU RA: Nhắm mắt gắn vé vô gửi đi (kệ mẹ vé đúng hay sai)
// apiClient.interceptors.request.use(
//   (config) => {
//     const accessToken = useAuthStore.getState().accessToken;
//     if (accessToken) {
//       config.headers.Authorization = `Bearer ${accessToken}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error),
// );

// // TRẠM GÁC ĐẦU VÀO: Hứng đạn từ BE
// apiClient.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   async (error) => {
//     const originalRequest = error.config;

//     // 🚨 KHÚC BÙA CHÚ CHỐNG LẠI BACKEND THIẾU CORS Ở ĐÂY NÈ:
//     // 1. BE trả 401 đàng hoàng (Nếu sau này BE fix CORS)
//     const isUnauthorized = error.response && error.response.status === 401;
//     // 2. BE trả 401 nhưng thiếu CORS làm FE văng Network Error
//     const isCorsError = error.message === "Network Error" && !error.response;

//     // Nếu dính 1 trong 2 cái trên, VÀ chưa từng đi xin vé lại
//     if ((isUnauthorized || isCorsError) && !originalRequest._retry) {
//       originalRequest._retry = true;

//       // Tránh vòng lặp vô tận nếu chính API đi xin vé cũng bị lỗi
//       if (
//         originalRequest.url?.includes("/api/Auth/refreshtoken") ||
//         originalRequest.url?.includes("/login")
//       ) {
//         return Promise.reject(error);
//       }

//       try {
//         console.log(
//           "Phát hiện lỗi Token (hoặc CORS do BE lỏ), đang gọi API xin vé mới...",
//         );

//         // Đi xin vé mới
//         const response = await axios.post(
//           `${import.meta.env.VITE_API_URL}/api/Auth/refreshtoken`,
//           {},
//           { withCredentials: true },
//         );

//         // Có vé mới rồi, cất vô két sắt
//         const newAccessToken = response.data.accessToken;
//         const currentRole = useAuthStore.getState().role;
//         useAuthStore
//           .getState()
//           .setTokens(newAccessToken, currentRole || "member");

//         // Gắn vé mới vô cái request cũ (changepassword) và ráng gửi lại lần nữa
//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//         console.log("Đổi vé thành công, gửi lại API cũ nha má!");

//         return apiClient(originalRequest);
//       } catch (refreshError) {
//         console.error("Refresh Token cũng chết ngắc rồi, đăng xuất đi!");
//         useAuthStore.getState().clearTokens();
//         window.location.href = "/";
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   },
// );

// export default apiClient;
