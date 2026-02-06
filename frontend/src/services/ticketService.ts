import api from "./api";
import type { Ticket } from "@/types/ticket";

export interface DashboardStats {
  total: number;
  abertos: number;
  em_andamento: number;
  concluidos: number;
  recentes: Ticket[];
  por_departamento: { area: string; count: number }[];
  por_dia: { date: string; count: number }[];
}

export const ticketService = {
  async create(data: Record<string, unknown>) {
    const res = await api.post("/tickets", data);
    return res.data;
  },

  async getAll() {
    const res = await api.get("/tickets");
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get(`/tickets/${id}`);
    return res.data;
  },

  async getByEmail(email: string) {
    const res = await api.get("/tickets/meus-chamados", { params: { email } });
    return res.data;
  },

  async getReceived() {
    const res = await api.get("/tickets/recebidos");
    return res.data;
  },

  async updateStatus(id: string, status: string) {
    const res = await api.patch(`/tickets/${id}/status`, { status });
    return res.data;
  },

  async addResponse(id: string, data: { mensagem: string; autor_id: string }) {
    const res = await api.post(`/tickets/${id}/resposta`, data);
    return res.data;
  },

  async getDashboardStats(): Promise<{ success: boolean; stats: DashboardStats }> {
    const res = await api.get("/dashboard/stats");
    return res.data;
  },
};
