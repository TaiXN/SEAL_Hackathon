import axios from "axios";
import { useAuthStore } from "../../stores/auth.store";

const apiClient = axios.create({
  baseURL: "https://seal.cosplane.io.vn",
  headers: {
    "Content-Type": "application/json",
  },
  // BẮT BUỘC BẬT ĐỂ TRÌNH DUYỆT TỰ GỬI COOKIE (CHỨA REFRESH TOKEN)
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url.includes("/login") ||
        originalRequest.url.includes("/refresh-token")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // BẮN API RỖNG: Không body, không biến. Trình duyệt tự nhét Cookie vào.
        const res = await axios.post(
          "https://seal.cosplane.io.vn/api/Auth/refresh-token",
          {},
          {
            withCredentials: true,
          },
        );

        const newAccessToken = res.data.accessToken;
        useAuthStore.getState().updateAccessToken(newAccessToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = "Bearer " + newAccessToken;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().clearTokens();
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
