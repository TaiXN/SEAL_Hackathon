import apiClient from "./apiClient";

export const leaderboardApi = {
  // Lấy toàn bộ bảng xếp hạng
  async getAllLeaderboards() {
    const res = await apiClient.get("/api/LeaderBoard");
    return res.data;
  },

  // Lấy bảng xếp hạng theo Vòng thi và Hạng mục
  async getLeaderboardDetail(roundId: string, trackId: string) {
    const res = await apiClient.get(`/api/LeaderBoard/${roundId}/${trackId}`);
    return res.data;
  },
};
