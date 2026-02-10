import api from "./api";

export interface AuthUserListItem {
  id: string;
  email?: string;
  nome?: string;
  created_at?: string;
}

export type PermissaoTipo = "view" | "view_edit";

export const permissionService = {
  async listAuthUsers(): Promise<{ success: boolean; users: AuthUserListItem[] }> {
    const res = await api.get("/admin/permissions/auth-users");
    return res.data;
  },

  async getByAuthUserId(authUserId: string): Promise<{ success: boolean; permissions: Record<string, PermissaoTipo> }> {
    const res = await api.get(`/admin/permissions/${authUserId}`);
    return res.data;
  },

  async setForAuthUser(
    authUserId: string,
    departamentos: Record<string, PermissaoTipo>
  ): Promise<{ success: boolean; permissions: Record<string, PermissaoTipo> }> {
    const res = await api.put(`/admin/permissions/${authUserId}`, { departamentos });
    return res.data;
  },
};
