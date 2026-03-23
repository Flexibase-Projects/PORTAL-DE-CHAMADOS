import api from "./api";

export interface NotificationItem {
  id: string;
  auth_user_id: string;
  tipo: string;
  ticket_id?: string;
  titulo?: string;
  mensagem?: string;
  lida: boolean;
  created_at: string;
}

export const notificationService = {
  async list(
    unreadOnly = false,
    authUserId?: string
  ): Promise<{
    success: boolean;
    notifications: NotificationItem[];
    unreadCount: number;
  }> {
    const params: Record<string, string | boolean> = { unread_only: unreadOnly };
    if (authUserId) params.auth_user_id = authUserId;
    const res = await api.get("/notifications", { params });
    return res.data;
  },

  async markRead(id: string, authUserId?: string): Promise<{ success: boolean }> {
    const res = await api.patch(`/notifications/${id}/read`, undefined, {
      params: authUserId ? { auth_user_id: authUserId } : undefined,
    });
    return res.data;
  },

  async markAllRead(authUserId?: string): Promise<{ success: boolean }> {
    const res = await api.post("/notifications/mark-all-read", {}, {
      params: authUserId ? { auth_user_id: authUserId } : undefined,
    });
    return res.data;
  },

  async markReadByTicket(ticketId: string, authUserId?: string): Promise<{ success: boolean }> {
    const res = await api.post(`/notifications/mark-read-by-ticket/${ticketId}`, {}, {
      params: authUserId ? { auth_user_id: authUserId } : undefined,
    });
    return res.data;
  },
};
