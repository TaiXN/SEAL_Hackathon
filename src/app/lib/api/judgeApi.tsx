import apiClient from "./apiClient";

// Định nghĩa Interface của đối tượng Giám khảo (để map dữ liệu trả về từ GET)
export interface Judge {
  id: string;
  name: string;
  email: string;
  phone: string;
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
export const judgeApi = {
  async assignJudge(trackId: string, judgeId: string): Promise<Judge> {
    const res = await apiClient.post(
      `/api/Judge/track/${trackId}/judge/${judgeId}`,
    );
    return res.data;
  },

  async removeJudge(trackId: string, judgeId: string): Promise<void> {
    const res = await apiClient.delete(
      `/api/Judge/track/${trackId}/judge/${judgeId}`,
    );
    return res.data;
  },

  async getJudgesByTrack(trackId: string): Promise<Judge[]> {
    const res = await apiClient.get(`/api/Judge/track/${trackId}`);
    return res.data;
  },
};
