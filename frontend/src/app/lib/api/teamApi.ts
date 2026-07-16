import apiClient from "./apiClient";

export interface CreateTeamPayload {
  teamName: string;
}

export interface UpdateTeamInfoPayload {
  teamName?: string;
}

export interface SubmitRegistrationPayload {
  eventId: string;
  trackId: string;
  topicId: string;
}

export const teamApi = {
  // ===============================================
  // QUẢN LÝ THÔNG TIN TEAM
  // ===============================================
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
    // Đã sửa lại chuẩn theo Swagger: /info thay vì /dashboard
    const res = await apiClient.get(`/api/Team/${teamId}/info`);
    return res.data;
  },

  async getCountdown(teamId: string) {
    const res = await apiClient.get(`/api/Team/${teamId}/countdown`);
    return res.data;
  },

  async updateTeamInfo(teamId: string, payload: UpdateTeamInfoPayload) {
    const res = await apiClient.put(`/api/Team/${teamId}/update-info`, payload);
    return res.data;
  },

  async leaveTeam(teamId: string) {
    const res = await apiClient.delete(`/api/Team/${teamId}/leave`);
    return res.data;
  },

  // ===============================================
  // QUẢN LÝ THÀNH VIÊN TRONG TEAM
  // ===============================================
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

  // ===============================================
  // DROPDOWN APIS (Lấy list Sự kiện, Hạng mục, Đề tài để đăng ký)
  // ===============================================
  async getActiveEvents() {
    const res = await apiClient.get("/api/Dropdown/active-events");
    return res.data;
  },

  async getTracksByEvent(eventId: string) {
    const res = await apiClient.get(`/api/Dropdown/tracks-by-event/${eventId}`);
    return res.data;
  },

  async getTopicsByTrack(trackId: string) {
    const res = await apiClient.get(`/api/Dropdown/topics-by-track/${trackId}`);
    return res.data;
  },

  // ===============================================
  // TEAM IN ROUND APIS (Đăng ký vòng thi và Trạng thái)
  // ===============================================
  async submitRegistration(teamId: string, payload: SubmitRegistrationPayload) {
    const res = await apiClient.post(`/api/TeamInRound/${teamId}/create`, {
      eventId: payload.eventId,
      trackId: payload.trackId,
      topicId: payload.topicId,
    });
    return res.data;
  },

  async approveTeamInRound(teamInRoundId: string) {
    const res = await apiClient.put(
      `/api/TeamInRound/approve/${teamInRoundId}`,
    );
    return res.data;
  },

  async banTeamInRound(teamInRoundId: string) {
    const res = await apiClient.put(`/api/TeamInRound/ban/${teamInRoundId}`);
    return res.data;
  },

  async unbanTeamInRound(teamInRoundId: string) {
    const res = await apiClient.put(`/api/TeamInRound/unban/${teamInRoundId}`);
    return res.data;
  },

  async getTeamDetailsInRound(roundId: string) {
    const res = await apiClient.get(
      `/api/TeamInRound/details/round/${roundId}`,
    );
    return res.data;
  },
};
