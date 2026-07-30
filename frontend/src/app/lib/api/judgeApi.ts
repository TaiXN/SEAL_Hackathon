import apiClient from "./apiClient";

export const judgeApi = {
  // 1. API: Load the teams assigned to a judge for scoring.
  async getAssignedTeams(teacherId: string) {
    const res = await apiClient.get(
      `/api/Judge/dashboard-assignments/${teacherId}`,
    );
    const data = res?.data ?? res;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.result)) return data.result;
    return [];
  },

  // 2. API: Load previous evaluations by submission id.
  async getEvaluationBySubmission(submissionId: string) {
    const res = await apiClient.get(
      `/api/Evaluation/submission/${submissionId}`,
    );
    return res.data;
  },

  // 3. API: Create a new evaluation.
  async createEvaluation(
    teacherId: string,
    payload: { submissionID: string; score: number; reason: string },
  ) {
    const res = await apiClient.post(`/api/Evaluation/${teacherId}`, payload);
    return res.data;
  },

  // 4. API: Update an existing evaluation.
  async updateEvaluation(
    teacherId: string,
    payload: { evaluationID: string; score: number; reason: string },
  ) {
    const res = await apiClient.put(`/api/Evaluation/${teacherId}`, payload);
    return res.data;
  },

  // 5. Load evaluation details by id.
  async getEvaluationById(evaluationId: string) {
    const res = await apiClient.get(`/api/Evaluation/${evaluationId}`);
    return res.data;
  },

  // 6. Load all evaluations for Admin/Manager views.
  async getAllEvaluations() {
    const res = await apiClient.get(`/api/Evaluation`);
    return res.data;
  },

  // 7. Delete an evaluation.
  async deleteEvaluation(evaluationId: string) {
    const res = await apiClient.delete(`/api/Evaluation/${evaluationId}`);
    return res.data;
  },

  // ==========================================
  // APIs for assigning judges to tracks.
  // ==========================================
  async assignJudgeToTrack(trackId: string, judgeId: string) {
    const res = await apiClient.post(
      `/api/Judge/track/${trackId}/teacher/${judgeId}`,
    );
    return res.data;
  },

  async removeJudgeFromTrack(trackId: string, judgeId: string) {
    const res = await apiClient.delete(
      `/api/Judge/track/${trackId}/teacher/${judgeId}`,
    );
    return res.data;
  },

  async getJudgesByTrack(trackId: string) {
    const res = await apiClient.get(`/api/Judge/track/${trackId}`);
    return res.data;
  },
};
