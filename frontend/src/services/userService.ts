import api from "./api";
import { localStorageStorage } from "@/storage/localStorageStorage";
import type { User, Role } from "@/types/user";

const USE_LOCAL_STORAGE =
  import.meta.env.VITE_USE_LOCAL_STORAGE === "true";

export const userService = {
  async getAll(): Promise<{ success: boolean; users: User[] }> {
    if (USE_LOCAL_STORAGE) {
      const users = localStorageStorage.getUsers().map((u) => ({
        ...u,
        role: localStorageStorage.getRoles().find((r) => r.id === u.role_id),
      }));
      return { success: true, users };
    }
    try {
      const res = await api.get("/users");
      return res.data;
    } catch {
      const users = localStorageStorage.getUsers().map((u) => ({
        ...u,
        role: localStorageStorage.getRoles().find((r) => r.id === u.role_id),
      }));
      return { success: true, users };
    }
  },

  async getById(id: string): Promise<{ success: boolean; user: User }> {
    if (USE_LOCAL_STORAGE) {
      const user = localStorageStorage.getUserById(id);
      return user ? { success: true, user } : { success: false, user: null as unknown as User };
    }
    try {
      const res = await api.get(`/users/${id}`);
      return res.data;
    } catch {
      const user = localStorageStorage.getUserById(id);
      return user ? { success: true, user } : { success: false, user: null as unknown as User };
    }
  },

  async create(data: Partial<User>): Promise<{ success: boolean; user: User }> {
    if (USE_LOCAL_STORAGE) {
      const user = localStorageStorage.createUser(data);
      return { success: true, user };
    }
    try {
      const res = await api.post("/users", data);
      return res.data;
    } catch {
      const user = localStorageStorage.createUser(data);
      return { success: true, user };
    }
  },

  async update(id: string, data: Partial<User>): Promise<{ success: boolean; user: User }> {
    if (USE_LOCAL_STORAGE) {
      const user = localStorageStorage.updateUser(id, data);
      return user ? { success: true, user } : { success: false, user: null as unknown as User };
    }
    try {
      const res = await api.put(`/users/${id}`, data);
      return res.data;
    } catch {
      const user = localStorageStorage.updateUser(id, data);
      return user ? { success: true, user } : { success: false, user: null as unknown as User };
    }
  },

  async toggleActive(id: string): Promise<{ success: boolean; user: User }> {
    if (USE_LOCAL_STORAGE) {
      const user = localStorageStorage.toggleUserActive(id);
      return user ? { success: true, user } : { success: false, user: null as unknown as User };
    }
    try {
      const res = await api.patch(`/users/${id}/toggle-active`);
      return res.data;
    } catch {
      const user = localStorageStorage.toggleUserActive(id);
      return user ? { success: true, user } : { success: false, user: null as unknown as User };
    }
  },

  async getRoles(): Promise<{ success: boolean; roles: Role[] }> {
    if (USE_LOCAL_STORAGE) {
      const roles = localStorageStorage.getRoles();
      return { success: true, roles };
    }
    try {
      const res = await api.get("/roles");
      return res.data;
    } catch {
      const roles = localStorageStorage.getRoles();
      return { success: true, roles };
    }
  },
};
