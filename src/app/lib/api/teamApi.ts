import apiClient from "./apiClient";

export interface CreateTeamPayload {
  teamName: string;
}

export interface UpdateTeamInfoPayload {
  teamName?: string;
}

export interface SubmitRegistrationPayload {
  trackId: string;
  topicId: string;
}

export const teamApi = {
  async getMyTeamsHistory() {
    const res = await apiClient.get("/api/Team/my-teams-history");
    return res.data;
  },

  async createTeam(payload: CreateTeamPayload) {
    const res = await apiClient.post("/api/Team/create-team", {
      teamName: payload.teamName,
    });

    return res.data;
  },

  async joinViaLink(teamId: string) {
    const res = await apiClient.post(`/api/Team/${teamId}/join-via-link`);
    return res.data;
  },

  async getTeamDashboard(teamId: string) {
    const res = await apiClient.get(`/api/Team/${teamId}/dashboard`);
    return res.data;
  },

  async getCountdown(teamId: string) {
    const res = await apiClient.get(`/api/Team/${teamId}/countdown`);
    return res.data;
  },

  async getTeamMembers(teamId: string) {
    const res = await apiClient.get(`/api/Team/${teamId}/members`);
    return res.data;
  },

  async kickMember(teamId: string, memberPlayerId: string) {
    const res = await apiClient.delete(
      `/api/Team/${teamId}/kick/${memberPlayerId}`,
    );
    return res.data;
  },

  async transferLeader(teamId: string, newLeaderPlayerId: string) {
    const res = await apiClient.put(
      `/api/Team/${teamId}/transfer-leader/${newLeaderPlayerId}`,
    );
    return res.data;
  },

  async updateTeamInfo(teamId: string, payload: UpdateTeamInfoPayload) {
    const res = await apiClient.put(`/api/Team/${teamId}/update-info`, payload);
    return res.data;
  },

  async getAllEvents() {
    const res = await apiClient.get("/api/Event");
    return res.data;
  },

  async getAllTracks() {
    const res = await apiClient.get("/api/Track");
    return res.data;
  },

  async getAllTopics() {
    const res = await apiClient.get("/api/Topic/topic");
    return res.data;
  },

  async submitRegistration(teamId: string, payload: SubmitRegistrationPayload) {
    const res = await apiClient.post(`/api/SubmittedTeam/${teamId}/submit`, {
      trackId: payload.trackId,
      topicId: payload.topicId,
    });

    return res.data;
  },

  async leaveTeam(teamId: string) {
    const res = await apiClient.delete(`/api/Team/${teamId}/leave`);
    return res.data;
  },
};
