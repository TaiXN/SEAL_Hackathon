import apiClient from "./apiClient";

// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES)
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string; // ? vì rf có thể chỉ trả về mỗi ac mới
}

export const authApi = {
  async loginAdmin(credentials: {
    email: string;
    password: string;
  }): Promise<AuthTokens> {
    const res = await apiClient.post("/api/Auth/admin/login", credentials);
    console.log("Cục res lúc này là:", res);
    // Normalize data: lấy 2 cái token FE cần, bỏ qua prop khác nếu có trả về
    return {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    };
  },

  async loginTeacher(credentials: {
    email: string;
    password: string;
  }): Promise<AuthTokens> {
    const res = await apiClient.post("/api/Auth/teacher/login", credentials);
    return {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    };
  },

  async loginPlayer(credentials: {
    email: string;
    password: string;
  }): Promise<AuthTokens> {
    const res = await apiClient.post("/api/Auth/player/login", credentials);
    return {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    };
  },

  async refreshToken(): Promise<AuthTokens> {
    const res = await apiClient.post("/api/Auth/refreshtoken");
    return {
      accessToken: res.data.accessToken,
      // đề phòng BE trả luôn refresh mới thì bắt luôn, không thì bỏ qua
      refreshToken: res.data.refreshToken,
    };
  },

  async checkToken(): Promise<boolean | string> {
    const res = await apiClient.post("/api/Auth/checktoken");
    return res.data;
  },

  // không cần normalize, BE thực hiện lệnh và trả 200 OK
  async logout(): Promise<void> {
    await apiClient.post("/api/Auth/logout");
  },

  async changePassword(data: {
    oldPassword: string;
    newPassword: string;
    rePassword: string;
  }): Promise<void> {
    await apiClient.put("/api/Auth/changepassword", data);
  },
};
