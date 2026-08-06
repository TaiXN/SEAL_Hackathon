import apiClient from "./apiClient";
// thêm bộ api dùng cho chức năng quản lý prize
export interface PrizeData {
  id?: string;
  prizeId?: string;
  prizeName: string;
  description: string;
  eventId?: string;
  teamId?: string; // Dùng khi đã được assign
  teamName?: string;
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

  // 3. Lấy giải thưởng của một sự kiện.
  // ⚠️ Backend KHÔNG có /api/Prize/event/{eventId} (chỉ có /event-name/{name}),
  // nên phải lấy toàn bộ rồi lọc theo eventId ở client.
  getPrizesByEvent: async (eventId: string) => {
    const res = await apiClient.get("/api/Prize");
    const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
    return list.filter(
      (p: any) =>
        String(p.eventId ?? p.eventID ?? "") === String(eventId),
    );
  },

  // 4. Tạo giải thưởng mới. rankIndex là field BẮT BUỘC của
  // CreatePrizeAPIViewModel — nó quyết định giải này trao cho hạng mấy.
  createPrize: async (data: {
    prizeName: string;
    description: string;
    eventId: string;
    rankIndex: number;
  }) => {
    const res = await apiClient.post("/api/Prize", data);
    return res.data;
  },

  // 5. Cập nhật giải thưởng (UpdatePrizeAPIViewModel: name, description, rankIndex)
  updatePrize: async (
    id: string,
    data: { prizeName: string; description: string; rankIndex: number },
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

  // 8. Trao giải thủ công cho Đội (Manual Assign).
  // ⚠️ Endpoint này nhận nguyên PrizeAPIViewModel chứ không chỉ 2 id: gửi thiếu
  // prizeName/description/eventId/rankIndex là ghi đè rỗng lên giải thưởng.
  // Vì vậy luôn truyền cả object prize hiện tại vào, chỉ thay teamId.
  manualAssign: async (prize: any, teamId: string) => {
    const payload = {
      prizeId: String(prize.prizeId ?? prize.prizeID ?? prize.id ?? ""),
      prizeName: prize.prizeName ?? prize.name ?? "",
      description: prize.description ?? "",
      eventId: String(prize.eventId ?? prize.eventID ?? ""),
      teamId,
      isActive: prize.isActive ?? true,
      rankIndex: Number(prize.rankIndex ?? 0),
    };
    const res = await apiClient.put("/api/Prize/manual-assign", payload);
    return res.data;
  },
};
