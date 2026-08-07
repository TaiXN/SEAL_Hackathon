import apiClient from "./apiClient";

export interface SubmitProjectPayload {
  githubUrl: string;
  demoUrl: string;
  slideUrl: string;
}

export const submittedTeamApi = {
  async submitProject(
    teamId: string,
    eventId: string,
    payload: SubmitProjectPayload,
  ) {
    const res = await apiClient.post(
      `/api/Submission/${teamId}/event/${eventId}/submit-urls`,
      {
        urlGithub: payload.githubUrl,
        urlDemo: payload.demoUrl,
        urlSlide: payload.slideUrl,
      },
    );

    return res.data;
  },

  /**
   * Bài nộp của đội mình trong MỘT sự kiện. Cả nhóm endpoint my-team đều đã đổi
   * sang dạng có eventId — gọi kiểu cũ `/my-team/{teamId}/submission` giờ 404.
   */
  async getMySubmission(teamId: string, eventId: string) {
    const res = await apiClient.get(
      `/api/Submission/my-team/${teamId}/event/${eventId}/submission`,
    );
    return res.data;
  },

  /**
   * Lịch sử sửa link bài nộp của đội mình, giới hạn trong MỘT sự kiện.
   * Backend đã đổi endpoint sang dạng có eventId — một đội có thể tham gia
   * nhiều sự kiện nên nếu không truyền eventId thì log của các sự kiện khác
   * cũng lẫn vào bảng lịch sử.
   */
  async getMyTeamAuditLogs(teamId: string, eventId: string) {
    const res = await apiClient.get(
      `/api/Submission/my-team/${teamId}/event/${eventId}/audit-logs`,
    );
    return res.data;
  },

  /** Bản admin của cùng lịch sử đó — cũng đã kèm eventId. */
  async getAuditLogsByTeam(teamId: string, eventId: string) {
    const res = await apiClient.get(
      `/api/Submission/audit-logs/${teamId}/event/${eventId}`,
    );
    return res.data;
  },

  async getAllSubmissions() {
    const res = await apiClient.get("/api/Submission");
    return res.data;
  },
};
