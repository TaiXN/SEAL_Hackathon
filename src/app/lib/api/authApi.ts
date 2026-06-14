import apiClient from "./apiClient"; // Nhớ trỏ đúng đường dẫn file apiClient của bà nha

// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES)
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string; // ? vì rf có thể chỉ trả về mỗi ac mới
}

// 2. KHAI BÁO CÁC HÀM GỌI API
export const authApi = {
  // ---------------- NHÓM LOGIN ----------------
  async loginAdmin(credentials: {
    email: string;
    password: string;
  }): Promise<AuthTokens> {
    const res = await apiClient.post("/api/Auth/admin/login", credentials);
    console.log("Cục res lúc này là gì:", res);
    // Normalize data: lấy 2 cái token FE cần, bỏ qua prop khác BE trả về (nếu có)
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

  //   async loginMember(credentials: {
  //     email: string;
  //     password: string;
  //   }): Promise<AuthTokens> {
  //     const res = await apiClient.post("/api/Auth/login", credentials);
  //     return {
  //       accessToken: res.data.accessToken,
  //       refreshToken: res.data.refreshToken,
  //     };
  //   },

  // ---------------- NHÓM BẢO MẬT TOKEN ----------------

  // Hàm đi xin vé mới bằng Cookie
  async refreshToken(): Promise<AuthTokens> {
    const res = await apiClient.post("/api/Auth/refreshtoken");
    return {
      accessToken: res.data.accessToken,
      // Đề phòng BE trả luôn refresh token mới thì mình bắt luôn, không có thì bỏ qua
      refreshToken: res.data.refreshToken,
    };
  },

  // Hàm kiểm tra vé xem còn hạn không
  async checkToken(): Promise<boolean | string> {
    const res = await apiClient.post("/api/Auth/checktoken");
    // Tùy BE trả về { success: true } hay trả text thô mà bà normalize lại nha
    return res.data;
  },

  // ---------------- NHÓM TÀI KHOẢN KHÁC ----------------

  // Đăng xuất: Không cần normalize, chỉ cần BE thực hiện lệnh và trả 200 OK
  async logout(): Promise<void> {
    await apiClient.post("/api/Auth/logout");
  },

  // Đổi mật khẩu
  async changePassword(data: {
    oldPassword: string;
    newPassword: string;
    rePassword: string;
  }): Promise<void> {
    await apiClient.put("/api/Auth/changepassword", data);
  },
};
