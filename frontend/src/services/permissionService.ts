import api from "./api";

export interface AuthUserListItem {
  id: string;
  email?: string;
  nome?: string;
  created_at?: string;
  departamento?: string | null;
}

export type PermissaoTipo = "view" | "view_edit";

export const permissionService = {
  async listAuthUsers(): Promise<{ success: boolean; users: AuthUserListItem[] }> {
    const res = await api.get("/admin/permissions/auth-users");
    return res.data;
  },

  async getByAuthUserId(
    authUserId: string
  ): Promise<{ success: boolean; permissions: Record<string, PermissaoTipo>; userDepartamento: string | null }> {
    const res = await api.get(`/admin/permissions/${authUserId}`);
    return res.data;
  },

  async setForAuthUser(
    authUserId: string,
    payload: { departamentos: Record<string, PermissaoTipo>; userDepartamento?: string | null }
  ): Promise<{ success: boolean; permissions: Record<string, PermissaoTipo>; userDepartamento: string | null }> {
    const res = await api.put(`/admin/permissions/${authUserId}`, payload);
    return res.data;
  },

  async setUserDepartamento(
    authUserId: string,
    userDepartamento: string | null
  ): Promise<{ success: boolean; userDepartamento: string | null }> {
    const res = await api.patch(`/admin/permissions/${authUserId}/departamento`, {
      userDepartamento: userDepartamento || null,
    });
    return res.data;
  },
};
