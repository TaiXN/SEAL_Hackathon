import apiClient from "./apiClient";

export interface UniversityPayload {
  universityID?: string;
  universityName: string;
}

export const universityApi = {
  // Lấy danh sách trường (Có thể dùng chung cho cả Player đăng ký)
  async getAllUniversities() {
    const res = await apiClient.get("/api/University");
    return res.data;
  },

  async getUniversityById(id: string) {
    const res = await apiClient.get(`/api/University/${id}`);
    return res.data;
  },

  async createUniversity(payload: { universityName: string }) {
    const res = await apiClient.post("/api/University", payload);
    return res.data;
  },

  async updateUniversity(payload: UniversityPayload) {
    const res = await apiClient.put("/api/University", payload);
    return res.data;
  },

  async deleteUniversity(id: string) {
    const res = await apiClient.delete(`/api/University/${id}`);
    return res.data;
  },
};
