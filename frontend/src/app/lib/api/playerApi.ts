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
};
