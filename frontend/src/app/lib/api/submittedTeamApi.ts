import apiClient from "./apiClient";

export interface SubmitProjectPayload {
  githubUrl: string;
  demoUrl: string;
  slideUrl: string;
}

export const submittedTeamApi = {
  async submitProject(teamId: string, payload: SubmitProjectPayload) {
    const res = await apiClient.post(`/api/Submission/${teamId}/submit-urls`, {
      urlGithub: payload.githubUrl,
      urlDemo: payload.demoUrl,
      urlSlide: payload.slideUrl,
    });

    return res.data;
  },

  async getMySubmission(teamId: string) {
    const res = await apiClient.get(
      `/api/Submission/my-team/${teamId}/submission`,
    );
    return res.data;
  },

  async getMyTeamAuditLogs(teamId: string) {
    const res = await apiClient.get(
      `/api/Submission/my-team/${teamId}/audit-logs`,
    );
    return res.data;
  },

  async getAuditLogsByTeam(teamId: string) {
    const res = await apiClient.get(`/api/Submission/audit-logs/${teamId}`);
    return res.data;
  },

  async getAllSubmissions() {
    const res = await apiClient.get("/api/Submission");
    return res.data;
  },
};
