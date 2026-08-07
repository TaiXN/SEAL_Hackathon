import apiClient from "./apiClient";

export interface EventItem {
  id: string;
  name: string; // UI đang dùng .name
  semester: string; // UI đang dùng .semester
  year: number;
  currentRound: number;
  EventName?: string;
  Season?: string;
  Year?: number;
}
export function pickId(obj: any): string {
  return (
    obj?.id ||
    obj?.eventID ||
    obj?.eventId ||
    obj?.roundID ||
    obj?.roundId ||
    obj?.trackID ||
    obj?.trackId ||
    obj?.topicID ||
    obj?.topicId ||
    obj?.criteriaID ||
    obj?.criteriaId ||
    obj?.criteriaSetID ||
    obj?.criteriaSetId ||
    obj?.teacherID ||
    obj?.teacherId ||
    obj?.data?.id ||
    obj?.data?.eventID ||
    obj?.data?.eventId ||
    obj?.data?.roundID ||
    obj?.data?.roundId ||
    obj?.data?.trackID ||
    obj?.data?.trackId ||
    obj?.data?.topicID ||
    obj?.data?.topicId ||
    obj?.data?.criteriaID ||
    obj?.data?.criteriaId ||
    obj?.data?.criteriaSetID ||
    obj?.data?.criteriaSetId ||
    obj?.data?.teacherID ||
    obj?.data?.teacherId ||
    ""
  );
}
/**
 * Chuẩn hóa 1 event từ backend sang shape UI đang dùng (.name/.semester) NHƯNG
 * GIỮ NGUYÊN toàn bộ field gốc.
 *
 * ⚠️ Trước đây hàm map chỉ giữ lại 5 field và vứt hết phần còn lại — trong đó có
 * `status`, `registrationStartDate/EndDate`, `minTeamMember/maxTeamMember`.
 * Hậu quả: mọi chỗ suy ra trạng thái sự kiện đều mù thông tin và phải đoán mò
 * theo currentRound, nên sự kiện vừa tạo bị hiểu nhầm thành "đang mở đăng ký".
 * Đừng rút gọn lại thành object literal nữa.
 */
export function normalizeEvent(item: any): any {
  if (!item) return item;
  const raw = item?.data !== undefined && item?.data !== null ? item.data : item;
  return {
    ...raw,
    id: raw.eventId ?? raw.eventID ?? raw.id,
    name: raw.eventName ?? raw.name,
    semester: raw.season ?? raw.semester,
    year: raw.year,
    // ⚠️ Fallback là -1 (draft), KHÔNG phải 0. Theo quy ước của backend 0 nghĩa
    // là "đã publish, form đăng ký đang mở" — mặc định về 0 sẽ khiến sự kiện mà
    // backend không trả currentRound bị coi là đã công khai và khóa mất quyền
    // sửa của admin. Xem eventLifecycle.ts.
    currentRound: raw.currentRound ?? raw.CurrentRound ?? -1,
  };
}

export const eventApi = {
  async getAllEvents(): Promise<EventItem[]> {
    const res = await apiClient.get("/api/Event");
    // Chỉ loại những bản ghi bị đánh dấu ngừng hoạt động rõ ràng. Lọc theo
    // `=== true` sẽ nuốt mất sự kiện nào backend không trả field isActive.
    const activeEvents = (res.data || []).filter(
      (item: any) => item.isActive !== false,
    );
    return activeEvents.map(normalizeEvent);
  },

  // Danh sách RAW (không lọc isActive, không đổi tên field).
  // Dùng để dò lại ID sau khi tạo mới — event vừa tạo có thể chưa isActive
  // nên sẽ bị getAllEvents() lọc mất, khiến bước dò ID theo tên luôn thất bại.
  async getAllEventsRaw(): Promise<any[]> {
    const res = await apiClient.get("/api/Event");
    return res.data;
  },

  /**
   * ⚠️ GET /api/Event/{id} có lúc trả về hồ sơ rút gọn KHÔNG kèm mốc đăng ký,
   * trong khi GET /api/Event (danh sách) thì có. Thiếu hai mốc này thì tab
   * Overview hiện ô "Registration opens/closes" trống trơn dù admin đã nhập lúc
   * tạo sự kiện. Nên khi bản ghi chi tiết không có, vá lại từ danh sách.
   */
  async getEventById(id: string): Promise<any> {
    const res = await apiClient.get(`/api/Event/${id}`);
    const ev = normalizeEvent(res.data);

    const hasRegDates =
      ev?.registrationStartDate ||
      ev?.RegistrationStartDate ||
      ev?.registrationEndDate ||
      ev?.RegistrationEndDate;
    if (hasRegDates) return ev;

    try {
      const list = await this.getAllEventsRaw();
      const match = (list || []).find(
        (item: any) =>
          String(item.eventId ?? item.eventID ?? item.id) === String(id),
      );
      // Bản chi tiết vẫn là nguồn chính, danh sách chỉ lấp chỗ trống.
      return match ? { ...normalizeEvent(match), ...ev } : ev;
    } catch {
      return ev;
    }
  },

  /**
   * Danh sách đội đang tham gia một sự kiện, kèm thành viên.
   * Trả về: teamId, teamName, trackName, topicName, totalMembers, isBanned,
   * members[{ studentId, studentName, isLeader, isActive }]
   */
  async getEventTeams(eventId: string): Promise<any[]> {
    const res = await apiClient.get(`/api/Event/${eventId}/teams`);
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.result)) return data.result;
    return [];
  },

  async createEvent(data: Partial<EventItem>): Promise<EventItem> {
    const res = await apiClient.post("/api/Event", data);
    return res.data;
  },

  async updateEvent(id: string, data: Partial<EventItem>): Promise<EventItem> {
    const res = await apiClient.put(`/api/Event/${id}`, data);
    return res.data;
  },

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/api/Event/${id}`);
  },
  nextRound: async (eventId: string): Promise<EventItem> => {
    const res = await apiClient.put(`/api/Event/${eventId}/nextround`);
    return res.data;
  },

  // Công khai sự kiện & mở form đăng ký (draft -> registration).
  publish: async (eventId: string) => {
    const res = await apiClient.put(`/api/Event/${eventId}/publish`);
    return res.data;
  },

  // Đóng form đăng ký & khởi động vòng 1 (registration -> running).
  startRound1: async (eventId: string) => {
    const res = await apiClient.put(`/api/Event/${eventId}/start-round-1`);
    return res.data;
  },
};
