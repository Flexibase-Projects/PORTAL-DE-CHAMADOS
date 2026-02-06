import api from "./api";
import type { User, Role } from "@/types/user";

export const userService = {
  async getAll(): Promise<{ success: boolean; users: User[] }> {
    const res = await api.get("/users");
    return res.data;
  },

  async getById(id: string): Promise<{ success: boolean; user: User }> {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },

  async create(data: Partial<User>): Promise<{ success: boolean; user: User }> {
    const res = await api.post("/users", data);
    return res.data;
  },

  async update(id: string, data: Partial<User>): Promise<{ success: boolean; user: User }> {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },

  async toggleActive(id: string): Promise<{ success: boolean; user: User }> {
    const res = await api.patch(`/users/${id}/toggle-active`);
    return res.data;
  },

  async getRoles(): Promise<{ success: boolean; roles: Role[] }> {
    const res = await api.get("/roles");
    return res.data;
  },
};
