import apiClient from "./apiClient";

export interface SubmitProjectPayload {
  githubUrl: string;
  demoUrl: string;
  slideUrl: string;
}

export const submittedTeamApi = {
  async submitProject(teamId: string, payload: SubmitProjectPayload) {
    const res = await apiClient.post(
      `/api/SubmittedTeam/${teamId}/submit-urls`,
      {
        githubUrl: payload.githubUrl,
        demoUrl: payload.demoUrl,
        slideUrl: payload.slideUrl,
      },
    );

    return res.data;
  },
};
