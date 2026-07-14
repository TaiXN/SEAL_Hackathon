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
    const res = await apiClient.post("/api/Player/register", payload);
    return res.data;
  },

  async getUniversities() {
    const res = await apiClient.get("/api/University");
    return res.data;
  },
};
