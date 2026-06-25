import apiClient from "./apiClient";

export interface RegisterPlayerPayload {
  email: string;
  password: string;
  fullName: string;
  address: string;
  phone: string;
  studentId: string;
  universityId: string;
}

export const playerApi = {
  // API: POST /api/Player/register
  // Swagger yêu cầu:
  // email, password, fullName, address, phone, studentId, universityId
  async register(payload: RegisterPlayerPayload) {
    const res = await apiClient.post("/api/Player/register", payload);
    return res.data;
  },
};
