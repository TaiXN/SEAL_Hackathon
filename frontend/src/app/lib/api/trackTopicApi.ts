import apiClient from "./apiClient";

export interface Track {
  trackID?: string; // Thêm id
  eventId: string;
  trackName: string;
}

export interface Topic {
  topicID?: string; // Thêm id
  trackID: string;
  topicDetail: string;
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
export const trackTopicApi = {
  // Track
  getAllTracks: async (): Promise<Track[]> => {
    const res = await apiClient.get("/api/Track");
    return res.data;
  },
  getTrackById: async (id: string): Promise<Track> => {
    const res = await apiClient.get(`/api/Track/${id}`);
    return res.data;
  },

  createTrack: async (data: Partial<Track>): Promise<Track> => {
    const res = await apiClient.post("/api/Track", data);
    return res.data;
  },
  updateTrack: async (id: string, data: Partial<Track>): Promise<Track> => {
    const res = await apiClient.put(`/api/Track/${id}`, data);
    return res.data;
  },
  deleteTrack: async (id: string): Promise<void> => {
    const res = await apiClient.delete(`/api/Track/${id}`);
    return res.data;
  },

  // Topic
  getAllTopics: async (): Promise<Topic[]> => {
    const res = await apiClient.get("/api/Topic/topic");
    return res.data;
  },
  getTopicById: async (id: string): Promise<Topic> => {
    const res = await apiClient.get(`/api/Topic/topic/${id}`);
    return res.data;
  },
  createTopic: async (data: Partial<Topic>): Promise<Topic> => {
    const res = await apiClient.post("/api/Topic/topic", data);
    return res.data;
  },
  updateTopic: async (id: string, data: Partial<Topic>): Promise<Topic> => {
    const res = await apiClient.put(`/api/Topic/topic/${id}`, data);
    return res.data;
  },
  deleteTopic: async (id: string): Promise<void> => {
    const res = await apiClient.delete(`/api/Topic/topic/${id}`);
    return res.data;
  },
};
