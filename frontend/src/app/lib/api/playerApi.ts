import apiClient from "./apiClient";

export interface RegisterPlayerPayload {
  email: string;
  password: string;
  fullName: string;
  address: string;
  phone: string;
  universityId: string;
  idCardImage?: File | null;
  studentCardImage?: File | null;
  cccdNumber?: string;
}

export interface VerifyOtpPayload {
  email: string;
  otpCode: string;
}

export interface BanPlayerPayload {
  studentId: string;
  reason?: string;
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
  async register(payload: RegisterPlayerPayload) {
    const formData = new FormData();
    formData.append("Email", payload.email);
    formData.append("Password", payload.password);
    formData.append("FullName", payload.fullName);
    formData.append("Address", payload.address);
    formData.append("Phone", payload.phone);
    formData.append("UniversityId", payload.universityId);

    if (payload.idCardImage) {
      formData.append("IdCardImage", payload.idCardImage);
    }

    if (payload.studentCardImage) {
      formData.append("StudentCardImage", payload.studentCardImage);
    }

    if (payload.cccdNumber) {
      formData.append("CccdNumber", payload.cccdNumber);
    }

    const res = await apiClient.post("/api/Player/register", formData);
    return res.data;
  },

  async verifyOtp(payload: VerifyOtpPayload) {
    const res = await apiClient.post("/api/Player/verify-otp", payload);
    return res.data;
  },

  async getAllPlayers() {
    const res = await apiClient.get("/api/Player/all-players");
    return res.data;
  },

  async getPendingPlayers() {
    const res = await apiClient.get("/api/Player/pending");
    return res.data;
  },

  async approvePlayer(studentId: string) {
    const res = await apiClient.put(`/api/Player/${studentId}/approve`);
    return res.data;
  },

  async rejectPlayer(studentId: string) {
    const res = await apiClient.delete(`/api/Player/${studentId}/reject`);
    return res.data;
  },

  async banPlayer(payload: BanPlayerPayload) {
    const res = await apiClient.put("/api/Player/ban", payload);
    return res.data;
  },

  async unbanPlayer(studentId: string) {
    const res = await apiClient.put(`/api/Player/${studentId}/unban`);
    return res.data;
  },

  async getUniversities() {
    const res = await apiClient.get("/api/University");
    return res.data;
  },
};
