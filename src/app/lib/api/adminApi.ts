import apiClient from "./apiClient";

// =========================
// COMMON HELPERS
// =========================

function unwrapData<T = any>(res: any): T {
  const data = res?.data ?? res;

  // Vì Swagger báo response là application/octet-stream,
  // có lúc backend có thể trả JSON dưới dạng string.
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as T;
    }
  }

  return data as T;
}

export function pickId(obj: any): string {
  return (
    obj?.id ||
    obj?.eventID ||
    obj?.eventId ||
    obj?.roundID ||
    obj?.roundId ||
    obj?.trackID ||
    obj?.trackId ||
    obj?.topicID ||
    obj?.topicId ||
    obj?.criteriaID ||
    obj?.criteriaId ||
    obj?.criteriaSetID ||
    obj?.criteriaSetId ||
    obj?.teacherID ||
    obj?.teacherId ||
    obj?.data?.id ||
    obj?.data?.eventID ||
    obj?.data?.eventId ||
    obj?.data?.roundID ||
    obj?.data?.roundId ||
    obj?.data?.trackID ||
    obj?.data?.trackId ||
    obj?.data?.topicID ||
    obj?.data?.topicId ||
    obj?.data?.criteriaID ||
    obj?.data?.criteriaId ||
    obj?.data?.criteriaSetID ||
    obj?.data?.criteriaSetId ||
    obj?.data?.teacherID ||
    obj?.data?.teacherId ||
    ""
  );
}

// =========================
// EVENT TYPES
// =========================

export interface CreateEventPayload {
  eventName: string;
  season: string;
  year: number;
}

export interface UpdateEventPayload {
  eventName: string;
  season: string;
  year: number;
  currentRound: number;
}

// =========================
// ROUND TYPES
// =========================

export interface RoundPayload {
  eventID: string;
  roundName: string;
  startDate: string;
  endDate: string;
  topNPromotion: number;
  maxTeam: number;
  roundIndex: number;
  criteriaSetID: string;
}

export interface UpdateRoundPayload extends RoundPayload {
  roundID?: string;
}

// =========================
// TRACK / TOPIC TYPES
// =========================

export interface CreateTrackPayload {
  eventId: string; // POST /api/Track dùng eventId chữ d thường
  trackName: string;
}

export interface UpdateTrackPayload {
  eventID: string; // PUT /api/Track/{id} dùng eventID chữ D hoa theo Swagger
  trackName: string;
}

export interface TopicPayload {
  trackID: string;
  topicDetail: string;
}

// =========================
// CRITERIA TYPES
// =========================

export interface CriterionPayload {
  criteriaName: string;
  description: string;
}

export interface CriteriaSetPayload {
  setName: string;
  isDefault: boolean;
  criteriaList?: {
    criteriaId: string;
    score: number;
  }[];
}

// =========================
// TEACHER / JUDGE TYPES
// =========================

export interface CreateTeacherPayload {
  email: string;
  password: string;
  fullName: string;
  address: string;
  phone: string;
  isGuest: boolean;
}

export interface TeacherListPayload {
  teacherID: string;
  trackID: string;
  isMentor: boolean;
}

export interface UpdateTeacherListPayload {
  isMentor: boolean;
}

// =========================
// ADMIN API
// =========================

export const adminApi = {
  // =========================
  // EVENT
  // =========================

  async getAllEvents() {
    const res = await apiClient.get("/api/Event");
    return unwrapData(res);
  },

  async getEventById(id: string) {
    const res = await apiClient.get(`/api/Event/${id}`);
    return unwrapData(res);
  },

  async createEvent(payload: CreateEventPayload) {
    const res = await apiClient.post("/api/Event", payload);
    return unwrapData(res);
  },

  async updateEvent(id: string, payload: UpdateEventPayload) {
    const res = await apiClient.put(`/api/Event/${id}`, payload);
    return unwrapData(res);
  },

  async deleteEvent(id: string) {
    const res = await apiClient.delete(`/api/Event/${id}`);
    return unwrapData(res);
  },

  async nextRound(eventID: string) {
    const res = await apiClient.put(`/api/Event/${eventID}/nextround`);
    return unwrapData(res);
  },

  // =========================
  // ROUND
  // =========================

  async getAllRounds() {
    const res = await apiClient.get("/api/Round");
    return unwrapData(res);
  },

  async getRoundById(id: string) {
    const res = await apiClient.get(`/api/Round/${id}`);
    return unwrapData(res);
  },

  async createRound(payload: RoundPayload) {
    const res = await apiClient.post("/api/Round", payload);
    return unwrapData(res);
  },

  async updateRound(payload: UpdateRoundPayload) {
    const res = await apiClient.put("/api/Round", payload);
    return unwrapData(res);
  },

  async deleteRound(id: string) {
    const res = await apiClient.delete(`/api/Round/${id}`);
    return unwrapData(res);
  },

  // =========================
  // TRACK
  // =========================

  async getAllTracks() {
    const res = await apiClient.get("/api/Track");
    return unwrapData(res);
  },

  async getTrackById(id: string) {
    const res = await apiClient.get(`/api/Track/${id}`);
    return unwrapData(res);
  },

  async createTrack(payload: CreateTrackPayload) {
    const res = await apiClient.post("/api/Track", payload);
    return unwrapData(res);
  },

  async updateTrack(id: string, payload: UpdateTrackPayload) {
    const res = await apiClient.put(`/api/Track/${id}`, payload);
    return unwrapData(res);
  },

  async deleteTrack(id: string) {
    const res = await apiClient.delete(`/api/Track/${id}`);
    return unwrapData(res);
  },

  // =========================
  // TOPIC
  // =========================

  async getAllTopics() {
    const res = await apiClient.get("/api/Topic/topic");
    return unwrapData(res);
  },

  async getTopicById(id: string) {
    const res = await apiClient.get(`/api/Topic/topic/${id}`);
    return unwrapData(res);
  },

  async createTopic(payload: TopicPayload) {
    const res = await apiClient.post("/api/Topic/topic", payload);
    return unwrapData(res);
  },

  async updateTopic(id: string, payload: TopicPayload) {
    const res = await apiClient.put(`/api/Topic/topic/${id}`, payload);
    return unwrapData(res);
  },

  async deleteTopic(id: string) {
    const res = await apiClient.delete(`/api/Topic/topic/${id}`);
    return unwrapData(res);
  },

  // =========================
  // CRITERIA
  // =========================

  async getAllCriteria() {
    const res = await apiClient.get("/api/Criteria/criterion");
    return unwrapData(res);
  },

  async getCriterionById(id: string) {
    const res = await apiClient.get(`/api/Criteria/criterion/${id}`);
    return unwrapData(res);
  },

  async createCriterion(payload: CriterionPayload) {
    const res = await apiClient.post("/api/Criteria/criterion", payload);
    return unwrapData(res);
  },

  async updateCriterion(id: string, payload: CriterionPayload) {
    const res = await apiClient.put(`/api/Criteria/criterion/${id}`, payload);
    return unwrapData(res);
  },

  async deleteCriterion(id: string) {
    const res = await apiClient.delete(`/api/Criteria/criterion/${id}`);
    return unwrapData(res);
  },

  async restoreCriterion(id: string) {
    const res = await apiClient.put(`/api/Criteria/criterion/${id}/restore`);
    return unwrapData(res);
  },

  // =========================
  // CRITERIA SET
  // =========================

  async getAllCriteriaSets() {
    const res = await apiClient.get("/api/Criteria/set");
    return unwrapData(res);
  },

  async getCriteriaSetById(id: string) {
    const res = await apiClient.get(`/api/Criteria/set/${id}`);
    return unwrapData(res);
  },

  async createCriteriaSet(payload: CriteriaSetPayload) {
    const res = await apiClient.post("/api/Criteria/set", payload);
    return unwrapData(res);
  },

  async updateCriteriaSet(id: string, payload: CriteriaSetPayload) {
    const res = await apiClient.put(`/api/Criteria/set/${id}`, payload);
    return unwrapData(res);
  },

  async deleteCriteriaSet(id: string) {
    const res = await apiClient.delete(`/api/Criteria/set/${id}`);
    return unwrapData(res);
  },

  // =========================
  // TEACHER / JUDGE
  // =========================

  async createTeacher(payload: CreateTeacherPayload) {
    const res = await apiClient.post("/api/Teacher", payload);
    return unwrapData(res);
  },

  async assignTeacherToTrack(payload: TeacherListPayload) {
    const res = await apiClient.post("/api/TeacherList", payload);
    return unwrapData(res);
  },

  async getTeachersByTrack(trackId: string) {
    const res = await apiClient.get(`/api/TeacherList/track/${trackId}`);
    return unwrapData(res);
  },

  async updateTeacherInTrack(
    teacherId: string,
    trackId: string,
    payload: UpdateTeacherListPayload,
  ) {
    const res = await apiClient.put(
      `/api/TeacherList/teacher/${teacherId}/track/${trackId}`,
      payload,
    );
    return unwrapData(res);
  },

  async removeTeacherFromTrack(teacherId: string, trackId: string) {
    const res = await apiClient.delete(
      `/api/TeacherList/teacher/${teacherId}/track/${trackId}`,
    );
    return unwrapData(res);
  },

  // =========================
  // JUDGE ASSIGNMENT
  // =========================

  async addJudgeToTrack(trackId: string, judgeId: string) {
    const res = await apiClient.post(
      `/api/Judge/track/${trackId}/judge/${judgeId}`,
    );
    return unwrapData(res);
  },

  async removeJudgeFromTrack(trackId: string, judgeId: string) {
    const res = await apiClient.delete(
      `/api/Judge/track/${trackId}/judge/${judgeId}`,
    );
    return unwrapData(res);
  },

  async getJudgesByTrack(trackId: string) {
    const res = await apiClient.get(`/api/Judge/track/${trackId}`);
    return unwrapData(res);
  },

  // =========================
  // MENTOR ASSIGNMENT
  // =========================

  async addMentorToTrack(trackId: string, mentorId: string) {
    const res = await apiClient.post(
      `/api/Mentor/track/${trackId}/mentor/${mentorId}`,
    );
    return unwrapData(res);
  },

  async removeMentorFromTrack(trackId: string, mentorId: string) {
    const res = await apiClient.delete(
      `/api/Mentor/track/${trackId}/mentor/${mentorId}`,
    );
    return unwrapData(res);
  },

  async getMentorsByTrack(trackId: string) {
    const res = await apiClient.get(`/api/Mentor/track/${trackId}`);
    return unwrapData(res);
  },
};
