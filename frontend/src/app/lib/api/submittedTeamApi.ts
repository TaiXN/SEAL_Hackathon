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

  // THÊM API MỚI: Lấy tất cả danh sách bài đã nộp
  async getAllSubmissions() {
    const res = await apiClient.get("/api/Submission");
    return res.data;
  },
};
