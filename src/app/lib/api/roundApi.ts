import apiClient from "./apiClient";

export interface RoundData {
  roundID?: string;
  eventID: string;
  roundName: string;
  startDate: string;
  endDate: string;
  topNPromotion: number;
  maxTeam: number;
  roundIndex: number;
  criteriaSetID: string;
}

export const roundApi = {
  // ================= CRUD CƠ BẢN =================
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

  // ================= TÍNH NĂNG MỞ RỘNG =================
  async getActiveMenus(): Promise<any> {
    const res = await apiClient.get("/api/Round/active-menus");
    return res.data;
  },

  async autoTransitionRound(roundId: string): Promise<any> {
    const res = await apiClient.post(`/api/Round/auto-transition/${roundId}`);
    return res.data;
  },

  // API MỚI THEO SWAGGER: Lấy các vòng thi đang Active
  async getActiveRounds(): Promise<RoundData[]> {
    const res = await apiClient.get("/api/Round/active");
    return res.data;
  },
};
