import apiClient from "./apiClient";

export interface RoundData {
  roundID?: string; // Thêm id
  eventID: string;
  roundName: string;
  startDate: string;
  endDate: string;
  topNPromotion: number;
  maxTeam: number;
  roundIndex: number;
  criteriaSetID: string;
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
    obj?.data?.CriteriaSetId ||
    obj?.data?.CriteriaSetID ||
    obj?.data?.teacherID ||
    obj?.data?.teacherId ||
    ""
  );
}

export const roundApi = {
  async getAllRounds(): Promise<RoundData[]> {
    const res = await apiClient.get("/api/Round");
    return res.data;
  },

  async getRoundsById(id: string): Promise<RoundData> {
    const res = await apiClient.get(`/api/Round/${id}`);
    return res.data;
  },

  async createRound(data: RoundData): Promise<RoundData> {
    const res = await apiClient.post("/api/Round", data);
    return res.data;
  },

  async updateRound(data: RoundData & { roundID: string }): Promise<RoundData> {
    const res = await apiClient.put("/api/Round", data);
    return res.data;
  },

  async deleteRound(id: string): Promise<void> {
    await apiClient.delete(`/api/Round/${id}`);
  },

  // ==========================================
  // CÁC API MỚI UPDATE
  // ==========================================

  // Lấy các menu đang active của round
  async getActiveMenus(): Promise<any> {
    const res = await apiClient.get("/api/Round/active-menus");
    return res.data;
  },

  // Tự động chuyển vòng thi
  async autoTransitionRound(roundId: string): Promise<any> {
    const res = await apiClient.post(`/api/Round/auto-transition/${roundId}`);
    return res.data;
  },
};
