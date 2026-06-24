import apiClient from "./apiClient";

export interface TeacherListAssignment {
  teacherID: string;
  trackID: string;
  isMentor: boolean;
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
export const teacherListApi = {
  async assignTeacher(
    data: TeacherListAssignment,
  ): Promise<TeacherListAssignment> {
    const res = await apiClient.post("/api/TeacherList", data);
    return res.data;
  },

  async getTeachersByTrack(trackId: string): Promise<TeacherListAssignment[]> {
    const res = await apiClient.get(`/api/TeacherList/track/${trackId}`);
    return res.data;
  },

  async updateTeacherStatus(
    teacherId: string,
    trackId: string,
    data: { isMentor: boolean },
  ): Promise<TeacherListAssignment> {
    const res = await apiClient.put(
      `/api/TeacherList/teacher/${teacherId}/track/${trackId}`,
      data,
    );
    return res.data;
  },

  async removeTeacherFromTrack(
    teacherId: string,
    trackId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/api/TeacherList/teacher/${teacherId}/track/${trackId}`,
    );
  },
};
