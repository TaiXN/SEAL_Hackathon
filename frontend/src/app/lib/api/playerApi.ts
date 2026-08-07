import apiClient from "./apiClient";

export interface RegisterPlayerPayload {
  email: string;
  password: string;
  fullName: string;
  address: string;
  phone: string;
  universityId: string;
}

export interface University {
  universityId?: string;
  universityID?: string;
  UniversityId?: string;
  UniversityID?: string;
  id?: string;

  universityName?: string;
  UniversityName?: string;
  name?: string;
}

export const playerApi = {
  register: (formData: FormData) =>
    apiClient.post("/api/Player/register", formData, {
      headers: {
        // Dùng cái này để xóa bỏ mặc định application/json của apiClient
        "Content-Type": "multipart/form-data",
      },
    }),

  verifyOtp: (payload: { email: string; otpCode: string }) =>
    apiClient.post("/api/Player/verify-otp", payload),

  async getUniversities() {
    const res = await apiClient.get("/api/University");
    return res.data;
  },

  // ===== Quản lý player đã được duyệt (Admin) =====

  // Danh sách toàn bộ player đã có tài khoản (kể cả đứa đang bị ban).
  async getAllPlayers() {
    const res = await apiClient.get("/api/Player/all-players");
    return res.data;
  },

  // Backend gửi mail báo lý do cho player nên `reason` là bắt buộc, không để rỗng.
  banPlayer: (payload: { studentId: string; reason: string }) =>
    apiClient.put("/api/Player/ban", payload),

  unbanPlayer: (studentId: string) =>
    apiClient.put(`/api/Player/${studentId}/unban`),
};
