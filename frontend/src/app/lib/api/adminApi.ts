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
  async createAdmin(data: Admin): Promise<Admin> {
    const res = await apiClient.post("/api/Admin", data);
    return res.data;
  },

  async createTeacher(data: Teacher): Promise<Teacher> {
    const res = await apiClient.post("/api/Teacher", data);
    return res.data;
  },
};
