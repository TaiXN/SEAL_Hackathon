import apiClient from "./apiClient";

// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES)
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export const authApi = {
  async loginAdmin(credentials: {
    email: string;
    password: string;
  }): Promise<AuthTokens> {
    const res = await apiClient.post("/api/Auth/admin/login", credentials);
    console.log("Cục res lúc này là:", res);
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
      refreshToken: res.data.refreshToken,
    };
  },

  async checkToken(): Promise<boolean | string> {
    const res = await apiClient.post("/api/Auth/checktoken");
    return res.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/api/Auth/logout");
  },

  // THÊM API MỚI: ĐỔI MẬT KHẨU
  async changePassword(payload: {
    oldPassword?: string;
    newPassword?: string;
    rePassword?: string;
  }): Promise<any> {
    const res = await apiClient.put("/api/Auth/changepassword", payload);
    return res.data;
  },
};
