import apiClient from "./apiClient";

export interface Admin {
  email: string;
  password: string;
  fullName: string;
  address: string;
  phone: string;
}

export interface Teacher {
  email: string;
  password: string;
  fullName: string;
  address: string;
  phone: string;
  isGuest: boolean;
}

export const adminApi = {
  // ================= ADMIN =================
  async createAdmin(data: Admin): Promise<Admin> {
    const res = await apiClient.post("/api/Admin", data);
    return res.data;
  },

  // ================= TEACHER =================
  async createTeacher(data: Teacher): Promise<Teacher> {
    const res = await apiClient.post("/api/Teacher", data);
    return res.data;
  },

  async getAllTeacherList() {
    const res = await apiClient.get("/api/Teacher");
    return res.data;
  },

  async getAllAvailableTeachers() {
    const res = await apiClient.get("/api/Teacher/available");
    return res.data;
  },

  async getTeacherById(id: string) {
    const res = await apiClient.get(`/api/Teacher/${id}`);
    return res.data;
  },

  async updateTeacher(id: string, data: Partial<Teacher>) {
    const res = await apiClient.put(`/api/Teacher/${id}`, data);
    return res.data;
  },

  async deleteTeacher(id: string) {
    const res = await apiClient.delete(`/api/Teacher/${id}`);
    return res.data;
  },
};
