import apiClient from "./apiClient";

export interface EventItem {
  id: string;
  name: string; // UI đang dùng .name
  semester: string; // UI đang dùng .semester
  year: number;
  currentRound: number;
  EventName?: string;
  Season?: string;
  Year?: number;
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
export const eventApi = {
  async getAllEvents(): Promise<EventItem[]> {
    const res = await apiClient.get("/api/Event");
    const activeEvents = res.data.filter((item: any) => item.isActive === true);
    return activeEvents.map((item: any) => ({
      id: item.eventId,
      name: item.eventName, // Map eventName của Backend -> name của UI
      semester: item.season, // Map season của Backend -> semester của UI
      year: item.year,
      currentRound: item.currentRound || 0,
    }));
  },

  async getEventById(id: string): Promise<EventItem> {
    const res = await apiClient.get(`/api/Event/${id}`);
    const item = res.data;
    return {
      id: item.id,
      name: item.eventName,
      semester: item.season,
      year: item.year,
      currentRound: item.currentRound,
    };
  },

  async createEvent(data: Partial<EventItem>): Promise<EventItem> {
    const res = await apiClient.post("/api/Event", data);
    return res.data;
  },

  async updateEvent(id: string, data: Partial<EventItem>): Promise<EventItem> {
    const res = await apiClient.put(`/api/Event/${id}`, data);
    return res.data;
  },

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/api/Event/${id}`);
  },
  nextRound: async (eventId: string): Promise<EventItem> => {
    const res = await apiClient.put(`/api/Event/${eventId}/nextround`);
    return res.data;
  },
};
