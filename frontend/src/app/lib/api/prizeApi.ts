import apiClient from "./apiClient";

export interface PrizeData {
  id?: string;
  prizeId?: string;
  prizeName: string;
  description: string;
  eventId?: string;
  teamId?: string; // Dùng khi đã được assign
  isActive?: boolean;
  isDeleted?: boolean;
}

export const prizeApi = {
  // 1. Lấy tất cả giải thưởng
  getAllPrizes: async () => {
    const res = await apiClient.get("/api/Prize");
    return res.data;
  },

  // 2. Lấy chi tiết 1 giải thưởng
  getPrizeById: async (id: string) => {
    const res = await apiClient.get(`/api/Prize/${id}`);
    return res.data;
  },

  // 3. Lấy giải thưởng theo Event
  getPrizesByEvent: async (eventId: string) => {
    const res = await apiClient.get(`/api/Prize/event/${eventId}`);
    return res.data;
  },

  // 4. Tạo giải thưởng mới
  createPrize: async (data: {
    prizeName: string;
    description: string;
    eventId: string;
  }) => {
    const res = await apiClient.post("/api/Prize", data);
    return res.data;
  },

  // 5. Cập nhật giải thưởng (Swagger báo chỉ có prizeName và description)
  updatePrize: async (
    id: string,
    data: { prizeName: string; description: string },
  ) => {
    const res = await apiClient.put(`/api/Prize/${id}`, data);
    return res.data;
  },

  // 6. Xóa giải thưởng
  deletePrize: async (id: string) => {
    const res = await apiClient.delete(`/api/Prize/${id}`);
    return res.data;
  },

  // 7. Khôi phục giải thưởng (Reactive)
  restorePrize: async (prizeId: string) => {
    const res = await apiClient.put(`/api/Prize/${prizeId}/reactive`);
    return res.data;
  },

  // 8. Trao giải thủ công cho Đội (Manual Assign)
  manualAssign: async (data: { prizeId: string; teamId: string }) => {
    const res = await apiClient.put("/api/Prize/manual-assign", data);
    return res.data;
  },
};
