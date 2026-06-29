import apiClient from "./apiClient";

export interface Mentor {
  id: string;
  name: string;
  email: string;
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
export const mentorApi = {
  async assignMentor(trackId: string, mentorId: string): Promise<Mentor> {
    const res = await apiClient.post(
      `/api/Mentor/track/${trackId}/mentor/${mentorId}`,
    );
    return res.data;
  },

  async removeMentor(trackId: string, mentorId: string): Promise<void> {
    const res = await apiClient.delete(
      `/api/Mentor/track/${trackId}/mentor/${mentorId}`,
    );
    return res.data;
  },

  async getMentorsByTrack(trackId: string): Promise<Mentor[]> {
    const res = await apiClient.get(`/api/Mentor/track/${trackId}`);
    return res.data;
  },
};
