import apiClient from "./apiClient";

export const prizeApi = {
  async getTeamAwards(eventId: string, teamId: string) {
    const res = await apiClient.get(
      `/api/Prize/team-awards/${eventId}/${teamId}`,
    );
    return res.data;
  },
};
