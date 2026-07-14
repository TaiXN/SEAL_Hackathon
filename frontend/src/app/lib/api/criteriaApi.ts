import apiClient from "./apiClient";

export interface Criterion {
  criteriaID?: string; // Thêm id
  criteriaName: string;
  description: string;
}
<<<<<<< HEAD
=======

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

>>>>>>> Tri-dev-pr
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
<<<<<<< HEAD
export interface CriteriaSet {
  setID?: string; // Thêm id
  setName: string;
  isDefault: boolean;
  criteriaList: { criteriaId: string; score: number }[]; // Sửa lại đúng cấu trúc mapping}
}
export const criteriaApi = {
=======

export const criteriaApi = {
  // ==========================================
  // API TIÊU CHÍ (CRITERION)
  // ==========================================
>>>>>>> Tri-dev-pr
  async getAllCriteria(): Promise<Criterion[]> {
    const res = await apiClient.get("/api/Criteria/criterion");
    return res.data;
  },
<<<<<<< HEAD
=======

>>>>>>> Tri-dev-pr
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

<<<<<<< HEAD
=======
  // ==========================================
  // API BỘ TIÊU CHÍ (CRITERIA SET)
  // ==========================================
>>>>>>> Tri-dev-pr
  async getAllSet(): Promise<CriteriaSet[]> {
    const res = await apiClient.get("/api/Criteria/set");
    return res.data;
  },

<<<<<<< HEAD
  async getSetById(id: string): Promise<CriteriaSet> {
=======
  async getSetById(id: string): Promise<any> {
>>>>>>> Tri-dev-pr
    const res = await apiClient.get(`/api/Criteria/set/${id}`);
    return res.data;
  },

  async createSet(data: CriteriaSet): Promise<CriteriaSet> {
    const res = await apiClient.post("/api/Criteria/set", data);
    return res.data;
  },

<<<<<<< HEAD
=======
  // API MỚI: Cập nhật bộ tiêu chí
>>>>>>> Tri-dev-pr
  async updateSet(id: string, data: CriteriaSet): Promise<CriteriaSet> {
    const res = await apiClient.put(`/api/Criteria/set/${id}`, data);
    return res.data;
  },

<<<<<<< HEAD
=======
  // API MỚI: Xóa bộ tiêu chí
>>>>>>> Tri-dev-pr
  async deleteSet(id: string): Promise<void> {
    await apiClient.delete(`/api/Criteria/set/${id}`);
  },
};
