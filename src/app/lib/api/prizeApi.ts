import apiClient from "./apiClient";

export interface CreatePrizePayload {
  prizeName: string;
  description: string;
  eventId: string;
}

export interface UpdatePrizePayload {
  prizeName?: string;
  description?: string;
}

export interface AssignPrizePayload {
  prizeId: string;
  teamId: string;
}

export const prizeApi = {
  // 1. Tạo giải thưởng mới
  async createPrize(payload: CreatePrizePayload) {
    const res = await apiClient.post("/api/Prize", payload);
    return res.data;
  },

  // 2. Lấy toàn bộ danh sách giải thưởng
  async getAllPrizes() {
    const res = await apiClient.get("/api/Prize");
    return res.data;
  },

  // 3. Lấy chi tiết giải thưởng theo ID
  async getPrizeById(id: string) {
    const res = await apiClient.get(`/api/Prize/${id}`);
    return res.data;
  },

  // 4. Cập nhật giải thưởng
  async updatePrize(id: string, payload: UpdatePrizePayload) {
    const res = await apiClient.put(`/api/Prize/${id}`, payload);
    return res.data;
  },

  // 5. Xóa giải thưởng
  async deletePrize(id: string) {
    const res = await apiClient.delete(`/api/Prize/${id}`);
    return res.data;
  },

  // 6. Lấy danh sách giải thưởng thuộc về một Event cụ thể
  async getPrizeByEventId(eventId: string) {
    const res = await apiClient.get(`/api/Prize/event/${eventId}`);
    return res.data;
  },

  // 7. Khôi phục/Kích hoạt lại giải thưởng (Reactive)
  async reactivePrize(prizeId: string) {
    const res = await apiClient.put(`/api/Prize/${prizeId}/reactive`);
    return res.data;
  },

  // 8. Gán giải thưởng thủ công cho Đội thi (Manual Assign)
  async manualAssignPrize(payload: AssignPrizePayload) {
    const res = await apiClient.put("/api/Prize/manual-assign", payload);
    return res.data;
  },
};
