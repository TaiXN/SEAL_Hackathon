import apiClient from "./apiClient";

export const judgeApi = {
  // 1. API: Lấy danh sách đội thi được phân công chấm cho Giám khảo
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

  // 2. API: Lấy điểm cũ (Evaluation) dựa vào ID bài nộp
  async getEvaluationBySubmission(submissionId: string) {
    const res = await apiClient.get(
      `/api/Evaluation/submission/${submissionId}`,
    );
    return res.data;
  },

  // 3. API: Chấm điểm mới (Lần đầu)
  async createEvaluation(
    teacherId: string,
    payload: { submissionID: string; score: number; reason: string },
  ) {
    const res = await apiClient.post(`/api/Evaluation/${teacherId}`, payload);
    return res.data;
  },

  // 4. API: Sửa điểm (Cập nhật)
  async updateEvaluation(
    teacherId: string,
    payload: { evaluationID: string; score: number; reason: string },
  ) {
    const res = await apiClient.put(`/api/Evaluation/${teacherId}`, payload);
    return res.data;
  },
};
