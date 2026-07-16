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

  // 5. Lấy chi tiết Evaluation theo ID
  async getEvaluationById(evaluationId: string) {
    const res = await apiClient.get(`/api/Evaluation/${evaluationId}`);
    return res.data;
  },

  // 6. Lấy tất cả Evaluation (Cho Admin/Manager)
  async getAllEvaluations() {
    const res = await apiClient.get(`/api/Evaluation`);
    return res.data;
  },

  // 7. API MỚI: Xóa điểm (Delete Evaluation)
  async deleteEvaluation(evaluationId: string) {
    const res = await apiClient.delete(`/api/Evaluation/${evaluationId}`);
    return res.data;
  },

  // ==========================================
  // API PHÂN CÔNG GIÁM KHẢO VÀO TRACK (MỚI)
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
