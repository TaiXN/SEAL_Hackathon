import apiClient from "./apiClient";

/**
 * Audit log của hệ thống đến từ HAI endpoint khác nhau, không phải một:
 *
 *   GET /api/Submission/audit-logs/{teamId}      — thí sinh sửa link bài nộp
 *   GET /api/Evaluation/{evaluationId}/audit-logs — giám khảo sửa điểm
 *
 * Backend khai báo response là octet-stream trong swagger nên không có schema để
 * dựa vào. Vì vậy mọi field đều được đọc qua nhiều biến thể tên (PascalCase /
 * camelCase) và chuẩn hóa về một shape chung cho UI.
 */

export type SubmissionAuditLog = {
  id: string;
  submissionId: string;
  teamId: string;
  eventId: string;
  roundId: string;
  changedAt: string;
  old: { github: string; demo: string; slide: string };
  next: { github: string; demo: string; slide: string };
  raw: any;
};

export type ScoreAuditLog = {
  id: string;
  evaluationId: string;
  judgeId: string;
  oldScore: number | null;
  newScore: number | null;
  reason: string;
  changedAt: string;
  raw: any;
};

const pick = (o: any, ...names: string[]) => {
  for (const n of names) {
    if (o?.[n] !== undefined && o?.[n] !== null) return o[n];
    const cap = n[0].toUpperCase() + n.slice(1);
    if (o?.[cap] !== undefined && o?.[cap] !== null) return o[cap];
  }
  return undefined;
};

const asList = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const num = (v: any): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

const normalizeSubmissionLog = (r: any): SubmissionAuditLog => ({
  id: String(pick(r, "id", "auditId", "logId") ?? ""),
  submissionId: String(pick(r, "submissionId", "submissionID") ?? ""),
  teamId: String(pick(r, "teamId", "teamID") ?? ""),
  eventId: String(pick(r, "eventId", "eventID") ?? ""),
  roundId: String(pick(r, "roundId", "roundID") ?? ""),
  changedAt: String(pick(r, "createdAt", "timeStamp", "timestamp") ?? ""),
  old: {
    github: String(pick(r, "oldUrlGithub", "oldUrlGitHub") ?? ""),
    demo: String(pick(r, "oldUrlDemo") ?? ""),
    slide: String(pick(r, "oldUrlSlide") ?? ""),
  },
  next: {
    github: String(pick(r, "newUrlGithub", "newUrlGitHub") ?? ""),
    demo: String(pick(r, "newUrlDemo") ?? ""),
    slide: String(pick(r, "newUrlSlide") ?? ""),
  },
  raw: r,
});

const normalizeScoreLog = (r: any): ScoreAuditLog => ({
  id: String(pick(r, "id", "auditId", "logId") ?? ""),
  evaluationId: String(pick(r, "evaluationID", "evaluationId") ?? ""),
  judgeId: String(pick(r, "judgeId", "judgeID") ?? ""),
  oldScore: num(pick(r, "oldScore")),
  newScore: num(pick(r, "newScore")),
  reason: String(pick(r, "reason") ?? ""),
  changedAt: String(pick(r, "timeStamp", "timestamp", "createdAt") ?? ""),
  raw: r,
});

export const auditLogApi = {
  /** Lịch sử sửa link bài nộp của MỘT đội. */
  async getSubmissionLogsByTeam(teamId: string): Promise<SubmissionAuditLog[]> {
    const res = await apiClient.get(`/api/Submission/audit-logs/${teamId}`);
    return asList(res.data).map(normalizeSubmissionLog);
  },

  /**
   * Gộp lịch sử nộp bài của nhiều đội.
   * Dùng allSettled: một đội chưa từng nộp bài thường trả 404, và đó không phải
   * lý do để cả bảng audit log trắng xóa.
   */
  async getSubmissionLogsByTeams(
    teamIds: string[],
  ): Promise<SubmissionAuditLog[]> {
    const results = await Promise.allSettled(
      teamIds.map((tid) => this.getSubmissionLogsByTeam(tid)),
    );
    return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  },

  /** Toàn bộ evaluation trong hệ thống — dùng để lần ra evaluationId theo vòng. */
  async getAllEvaluations(): Promise<any[]> {
    const res = await apiClient.get("/api/Evaluation");
    return asList(res.data);
  },

  /** Lịch sử sửa điểm của MỘT phiếu chấm. */
  async getScoreLogsByEvaluation(
    evaluationId: string,
  ): Promise<ScoreAuditLog[]> {
    const res = await apiClient.get(
      `/api/Evaluation/${evaluationId}/audit-logs`,
    );
    return asList(res.data).map((r) => ({
      ...normalizeScoreLog(r),
      evaluationId: normalizeScoreLog(r).evaluationId || String(evaluationId),
    }));
  },

  async getScoreLogsByEvaluations(
    evaluationIds: string[],
  ): Promise<ScoreAuditLog[]> {
    const results = await Promise.allSettled(
      evaluationIds.map((eid) => this.getScoreLogsByEvaluation(eid)),
    );
    return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  },
};

export const evaluationHelpers = { pick, asList };
