import apiClient from "./apiClient";

export const leaderboardApi = {
  // Lấy bảng xếp hạng theo Vòng và Hạng mục (Sử dụng chính)
  getLeaderboardByRoundAndTrack: async (roundId: string, trackId: string) => {
    const res = await apiClient.get(`/api/LeaderBoard/${roundId}/${trackId}`);
    return res.data;
  },

  // Lấy tất cả (Phòng hờ sau này cần)
  getAllLeaderboard: async () => {
    const res = await apiClient.get("/api/LeaderBoard");
    return res.data;
  },

  // Lấy bảng xếp hạng theo Vòng thi và Hạng mục
  async getLeaderboardDetail(roundId: string, trackId: string) {
    const res = await apiClient.get(`/api/LeaderBoard/${roundId}/${trackId}`);
    return res.data;
  },
};
