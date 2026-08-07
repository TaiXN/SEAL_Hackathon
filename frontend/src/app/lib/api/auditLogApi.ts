import apiClient from "./apiClient";
import { teacherApi } from "./teacher";

/**
 * Audit log của hệ thống đến từ HAI endpoint khác nhau, không phải một:
 *
 *   GET /api/Submission/audit-logs/{teamId}/event/{eventId} — thí sinh sửa link
 *                                                             bài nộp
 *   GET /api/Evaluation/{evaluationId}/audit-logs           — giám khảo sửa điểm
 *
 * Chỉ hai cái đó. Nhánh `/api/Evaluation/judge/...` dành riêng cho trang giám
 * khảo, trang audit log không dùng.
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
  trackId: string;
  changedAt: string;
  old: { github: string; demo: string; slide: string };
  next: { github: string; demo: string; slide: string };
  raw: any;
};

export type ScoreAuditLog = {
  id: string;
  evaluationId: string;
  judgeId: string;
  teamId: string;
  roundId: string;
  trackId: string;
  eventId: string;
  /**
   * Tên do backend trả kèm trên chính bản ghi log. Có thì dùng luôn, không có
   * thì UI tự tra ngược qua danh sách đội/vòng/bảng của sự kiện như trước.
   */
  judgeName: string;
  teamName: string;
  roundName: string;
  trackName: string;
  eventName: string;
  oldScore: number | null;
  newScore: number | null;
  reason: string;
  changedAt: string;
  raw: any;
};

/**
 * Chỗ neo một phiếu chấm vào cây sự kiện. Bản thân audit-log của điểm không nói
 * nó thuộc vòng/bảng nào, thông tin đó chỉ có trên evaluation cha — nên phải
 * lấy ở bước liệt kê evaluation rồi truyền kèm xuống.
 */
export type EvaluationScope = {
  evaluationId: string;
  submissionId: string;
  /**
   * Mắt xích thật giữa bài nộp và sự kiện: bài nộp không mang teamId/roundId,
   * chỉ mang teamInRoundId. Bên gọi tra id này ra đội/vòng/bảng.
   */
  teamInRoundId: string;
  teamId: string;
  roundId: string;
  trackId: string;
  eventId: string;
  teamName: string;
  judgeId: string;
  judgeName: string;
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
  trackId: String(pick(r, "trackId", "trackID") ?? ""),
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
  id: String(pick(r, "logId", "id", "auditId") ?? ""),
  evaluationId: String(pick(r, "evaluationID", "evaluationId") ?? ""),
  judgeId: String(pick(r, "judgeId", "judgeID") ?? ""),
  teamId: String(pick(r, "teamId", "teamID") ?? ""),
  roundId: String(pick(r, "roundId", "roundID") ?? ""),
  trackId: String(pick(r, "trackId", "trackID") ?? ""),
  eventId: String(pick(r, "eventId", "eventID") ?? ""),
  judgeName: String(
    pick(r, "judgeName", "judgeFullName", "teacherName", "judgeUserName") ?? "",
  ),
  teamName: String(pick(r, "teamName") ?? ""),
  roundName: String(pick(r, "roundName") ?? ""),
  trackName: String(pick(r, "trackName") ?? ""),
  eventName: String(pick(r, "eventName") ?? ""),
  oldScore: num(pick(r, "oldScore")),
  newScore: num(pick(r, "newScore")),
  reason: String(pick(r, "reason") ?? ""),
  changedAt: String(pick(r, "timeStamp", "timestamp", "createdAt") ?? ""),
  raw: r,
});

/**
 * Đọc vòng/bảng/đội của một evaluation. Nested object (`submission`, `round`,
 * `judgeAssignment`, `teamInRound`) được dò kèm vì tùy endpoint backend có khi
 * trả id phẳng, có khi chỉ nhét trong quan hệ đi kèm.
 */
export const readEvaluationScope = (ev: any): EvaluationScope => {
  const from = (...names: string[]) =>
    String(
      pick(ev, ...names) ??
        pick(ev?.submission, ...names) ??
        pick(ev?.teamInRound, ...names) ??
        pick(ev?.judgeAssignment, ...names) ??
        pick(ev?.round, ...names) ??
        "",
    );
  return {
    evaluationId: String(
      pick(ev, "evaluationID", "evaluationId", "id") ?? "",
    ),
    submissionId: String(pick(ev, "submissionID", "submissionId") ?? ""),
    teamInRoundId: from("teamInRoundId", "teamInRoundID"),
    teamId: from("teamId", "teamID"),
    roundId: from("roundId", "roundID"),
    trackId: from("trackId", "trackID"),
    eventId: from("eventId", "eventID"),
    teamName: from("teamName"),
    judgeId: from("judgeId", "judgeID", "teacherId", "teacherID"),
    judgeName: from("judgeName", "judgeFullName", "teacherName"),
  };
};

/**
 * Lịch sử sửa điểm của một phiếu chấm — CHỈ một endpoint:
 *
 *   GET /api/Evaluation/{id}/audit-logs
 *
 * `/api/Evaluation/judge/audit-logs/{id}` là endpoint của giám khảo, không phải
 * của trang audit log; đừng gọi thêm nó ở đây.
 *
 * Bản ghi trả về KHÔNG mang eventId/teamId/roundId, nên bên gọi phải tự neo nó
 * vào sự kiện qua submissionId của phiếu chấm (xem `scope` ở
 * getScoreLogsByEvaluation).
 */
const fetchScoreLogRows = async (evaluationId: string): Promise<any[]> => {
  const res = await apiClient.get(`/api/Evaluation/${evaluationId}/audit-logs`);
  return asList(res.data);
};

export const auditLogApi = {
  /** Lịch sử sửa link bài nộp của MỘT đội trong MỘT sự kiện. */
  async getSubmissionLogsByTeam(
    teamId: string,
    eventId: string,
  ): Promise<SubmissionAuditLog[]> {
    const res = await apiClient.get(
      `/api/Submission/audit-logs/${teamId}/event/${eventId}`,
    );
    return asList(res.data).map(normalizeSubmissionLog);
  },

  /**
   * Gộp lịch sử nộp bài của nhiều đội trong cùng một sự kiện.
   * Dùng allSettled: một đội chưa từng nộp bài thường trả 404, và đó không phải
   * lý do để cả bảng audit log trắng xóa.
   */
  async getSubmissionLogsByTeams(
    teamIds: string[],
    eventId: string,
  ): Promise<SubmissionAuditLog[]> {
    if (!eventId) return [];
    const results = await Promise.allSettled(
      teamIds.map((tid) => this.getSubmissionLogsByTeam(tid, eventId)),
    );
    return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  },

  /**
   * Phiếu chấm của MỘT sự kiện — nguồn chuẩn, không phải suy đoán.
   *
   * `/api/Evaluation` chỉ trả evaluationID + submissionID, không nói phiếu chấm
   * thuộc sự kiện nào, nên mọi cách lần ngược từ đó đều là phỏng đoán. Trong khi
   * đó cổng giám khảo `/api/Teacher/{teacherId}/portal-events/{eventId}` trả
   * thẳng danh sách đội của ĐÚNG sự kiện này kèm evaluationId, submissionId,
   * roundId, trackId và tên đội — tức là backend đã tự ghép sẵn.
   *
   * Đổi lại phải quét qua từng giám khảo, nên dùng allSettled: một tài khoản
   * không đọc được không phải lý do để mất cả bảng.
   */
  async getEvaluationScopesByEvent(eventId: string): Promise<EvaluationScope[]> {
    if (!eventId) return [];

    const teachers = asList((await apiClient.get("/api/Teacher")).data)
      .map((t: any) => ({
        id: String(pick(t, "teacherId", "teacherID", "id") ?? ""),
        name: String(
          pick(t, "fullName", "teacherName", "name", "userName", "email") ?? "",
        ),
      }))
      .filter((t) => t.id);

    const results = await Promise.allSettled(
      teachers.map((t) => teacherApi.getPortalEventDetail(t.id, eventId)),
    );

    const byEvaluation = new Map<string, EvaluationScope>();
    results.forEach((res, i) => {
      if (res.status !== "fulfilled") return;
      const judge = teachers[i];
      (res.value?.teams || []).forEach((team) => {
        const evaluationId = String(team.evaluationId ?? "");
        if (!evaluationId) return;
        const key = evaluationId.toLowerCase();
        if (byEvaluation.has(key)) return;
        byEvaluation.set(key, {
          evaluationId,
          submissionId: String(team.submissionId ?? ""),
          teamInRoundId: "",
          teamId: String(team.teamId ?? ""),
          roundId: String(team.roundId ?? ""),
          trackId: String(team.trackId ?? ""),
          eventId: String(team.eventId || eventId),
          teamName: String(team.teamName ?? ""),
          judgeId: judge.id,
          judgeName: judge.name,
        });
      });
    });

    return [...byEvaluation.values()];
  },

  /** Toàn bộ evaluation trong hệ thống — dùng để lần ra evaluationId theo vòng. */
  async getAllEvaluations(): Promise<any[]> {
    const res = await apiClient.get("/api/Evaluation");
    return asList(res.data);
  },

  /** Toàn bộ bài nộp — dùng để lần từ đội của sự kiện ra submissionId. */
  async getAllSubmissions(): Promise<any[]> {
    const res = await apiClient.get("/api/Submission");
    return asList(res.data);
  },

  /**
   * Phiếu chấm của MỘT bài nộp. Đường đi thứ hai khi /api/Evaluation không liệt
   * kê đủ: từ bài nộp của sự kiện lần thẳng ra phiếu chấm của nó.
   */
  async getEvaluationsBySubmission(submissionId: string): Promise<any[]> {
    const res = await apiClient.get(
      `/api/Evaluation/submission/${submissionId}`,
    );
    const list = asList(res.data);
    // Một bài nộp thường chỉ có một phiếu chấm nên endpoint hay trả object trần
    // chứ không phải mảng.
    if (list.length > 0) return list;
    return res.data && typeof res.data === "object" ? [res.data] : [];
  },

  /**
   * Lịch sử sửa điểm của MỘT phiếu chấm.
   * `scope` là đội/vòng/bảng đọc được từ evaluation cha; chỉ dùng để lấp chỗ
   * trống, giá trị nằm sẵn trên bản ghi log luôn được ưu tiên.
   */
  async getScoreLogsByEvaluation(
    evaluationId: string,
    scope?: Partial<EvaluationScope>,
  ): Promise<ScoreAuditLog[]> {
    const rows = await fetchScoreLogRows(evaluationId);

    const seen = new Set<string>();
    const out: ScoreAuditLog[] = [];
    for (const r of rows) {
      const log = normalizeScoreLog(r);
      // Khử trùng theo logId; không có logId thì dựa vào bộ (thời điểm + điểm
      // cũ + điểm mới).
      const key =
        log.id ||
        `${log.evaluationId}|${log.changedAt}|${log.oldScore}|${log.newScore}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        ...log,
        evaluationId: log.evaluationId || String(evaluationId),
        teamId: log.teamId || scope?.teamId || "",
        roundId: log.roundId || scope?.roundId || "",
        trackId: log.trackId || scope?.trackId || "",
        eventId: log.eventId || scope?.eventId || "",
        teamName: log.teamName || scope?.teamName || "",
        judgeId: log.judgeId || scope?.judgeId || "",
        judgeName: log.judgeName || scope?.judgeName || "",
      });
    }
    return out;
  },

  async getScoreLogsByEvaluations(
    scopes: EvaluationScope[],
  ): Promise<ScoreAuditLog[]> {
    const results = await Promise.allSettled(
      scopes.map((s) => this.getScoreLogsByEvaluation(s.evaluationId, s)),
    );
    return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  },
};

export const evaluationHelpers = { pick, asList };
