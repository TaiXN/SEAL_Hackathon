import apiClient from "./apiClient";

export interface Criterion {
  criteriaID?: string; // Thêm id
  criteriaName: string;
  description: string;
}

export interface CriteriaMappingItem {
  criteriaId: string;
  score: number;
}

export interface CriteriaSet {
  setID?: string; // Thêm id
  setName: string;
  isDefault: boolean;
  criteriaList?: CriteriaMappingItem[];
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

export const criteriaApi = {
  // ==========================================
  // API TIÊU CHÍ (CRITERION)
  // ==========================================
  async getAllCriteria(): Promise<Criterion[]> {
    const res = await apiClient.get("/api/Criteria/criterion");
    return res.data;
  },
  async getCriteriaById(id: string): Promise<Criterion> {
    const res = await apiClient.get(`/api/Criteria/criterion/${id}`);
    return res.data;
  },

  async createCriterion(data: Criterion): Promise<Criterion> {
    const res = await apiClient.post("/api/Criteria/criterion", data);
    return res.data;
  },

  async updateCriterion(id: string, data: Criterion): Promise<Criterion> {
    const res = await apiClient.put(`/api/Criteria/criterion/${id}`, data);
    return res.data;
  },

  async deleteCriterion(id: string): Promise<void> {
    await apiClient.delete(`/api/Criteria/criterion/${id}`);
  },

  async restoreCriterion(id: string): Promise<void> {
    await apiClient.put(`/api/Criteria/criterion/${id}/restore`);
  },

  // ==========================================
  // API BỘ TIÊU CHÍ (CRITERIA SET)
  // ==========================================
  async getAllSet(): Promise<CriteriaSet[]> {
    const res = await apiClient.get("/api/Criteria/set");
    return res.data;
  },

  async getSetById(id: string): Promise<any> {
    const res = await apiClient.get(`/api/Criteria/set/${id}`);
    return res.data;
  },

  async createSet(data: CriteriaSet): Promise<CriteriaSet> {
    const res = await apiClient.post("/api/Criteria/set", data);
    return res.data;
  },

  // API MỚI: Xóa bộ tiêu chí
  async deleteSet(id: string): Promise<void> {
    await apiClient.delete(`/api/Criteria/set/${id}`);
  },
  // Cập nhật bộ tiêu chí (đã đổi endpoint và payload theo chuẩn mới)
  updateSet: async (
    setId: string,
    payload: {
      setName: string;
      isDefault: boolean;
      criteriaList: { criteriaId: string; score: number }[];
    },
  ) => {
    return await apiClient.put(`/api/Criteria/set/${setId}`, payload);
  },
};
