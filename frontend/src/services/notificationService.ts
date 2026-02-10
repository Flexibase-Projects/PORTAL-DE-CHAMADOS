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
  async list(unreadOnly = false): Promise<{
    success: boolean;
    notifications: NotificationItem[];
    unreadCount: number;
  }> {
    const res = await api.get("/notifications", { params: { unread_only: unreadOnly } });
    return res.data;
  },

  async markRead(id: string): Promise<{ success: boolean }> {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllRead(): Promise<{ success: boolean }> {
    const res = await api.post("/notifications/mark-all-read");
    return res.data;
  },
};
