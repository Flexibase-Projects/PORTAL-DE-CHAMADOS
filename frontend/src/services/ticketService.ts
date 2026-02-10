import api from "./api";
import { localStorageStorage } from "@/storage/localStorageStorage";
import type { Ticket } from "@/types/ticket";

const USE_LOCAL_STORAGE =
  import.meta.env.VITE_USE_LOCAL_STORAGE === "true";

export interface DashboardStats {
  total: number;
  abertos: number;
  em_andamento: number;
  concluidos: number;
  recentes: Ticket[];
  por_departamento: { area: string; count: number }[];
  por_dia: { date: string; count: number }[];
  por_dia_industria: { date: string; count: number }[];
  por_dia_administrativo: { date: string; count: number }[];
  /** Chamados por mês (geral / industria / administrativo - filtro no card) */
  por_mes_geral: { mes: string; count: number }[];
  por_mes_industria: { mes: string; count: number }[];
  por_mes_administrativo: { mes: string; count: number }[];
  /** Chamados por setor (donut: Industria, Administrativo, Comercial) */
  por_setor: { setor: string; count: number }[];
}

export const ticketService = {
  async create(data: Record<string, unknown>) {
    if (USE_LOCAL_STORAGE) {
      const ticket = localStorageStorage.createTicket(data);
      return { success: true, message: "Chamado criado com sucesso", ticket };
    }
    try {
      const res = await api.post("/tickets", data);
      return res.data;
    } catch {
      const ticket = localStorageStorage.createTicket(data);
      return { success: true, message: "Chamado criado com sucesso", ticket };
    }
  },

  async getAll() {
    if (USE_LOCAL_STORAGE) {
      const tickets = localStorageStorage.getTickets();
      return { success: true, tickets };
    }
    try {
      const res = await api.get("/tickets");
      return res.data;
    } catch {
      const tickets = localStorageStorage.getTickets();
      return { success: true, tickets };
    }
  },

  async getById(id: string) {
    if (USE_LOCAL_STORAGE) {
      const ticket = localStorageStorage.getTicketById(id);
      return ticket ? { success: true, ticket } : { success: false, error: "Chamado não encontrado" };
    }
    try {
      const res = await api.get(`/tickets/${id}`);
      return res.data;
    } catch {
      const ticket = localStorageStorage.getTicketById(id);
      return ticket ? { success: true, ticket } : { success: false, error: "Chamado não encontrado" };
    }
  },

  async getByName(nome: string) {
    const nomeTrim = nome.trim();
    if (USE_LOCAL_STORAGE) {
      const tickets = localStorageStorage.getTickets().filter(
        (t) => t.solicitante_nome?.toLowerCase() === nomeTrim.toLowerCase()
      );
      return { success: true, enviados: tickets, recebidos: [] };
    }
    try {
      const res = await api.get("/tickets/meus-chamados", { params: { nome: nomeTrim } });
      return res.data;
    } catch {
      const tickets = localStorageStorage.getTickets().filter(
        (t) => t.solicitante_nome?.toLowerCase() === nomeTrim.toLowerCase()
      );
      return { success: true, enviados: tickets, recebidos: [] };
    }
  },

  async getReceived() {
    if (USE_LOCAL_STORAGE) {
      const tickets = localStorageStorage.getTickets().filter((t) => t.status !== "Concluído");
      return { success: true, tickets };
    }
    try {
      const res = await api.get("/tickets/recebidos");
      return res.data;
    } catch {
      const tickets = localStorageStorage.getTickets().filter((t) => t.status !== "Concluído");
      return { success: true, tickets };
    }
  },

  async updateStatus(id: string, status: string) {
    if (USE_LOCAL_STORAGE) {
      const ticket = localStorageStorage.updateTicketStatus(id, status as Ticket["status"]);
      return ticket ? { success: true, message: "Status atualizado", ticket } : { success: false };
    }
    try {
      const res = await api.patch(`/tickets/${id}/status`, { status });
      return res.data;
    } catch {
      const ticket = localStorageStorage.updateTicketStatus(id, status as Ticket["status"]);
      return ticket ? { success: true, message: "Status atualizado", ticket } : { success: false };
    }
  },

  async addResponse(id: string, data: { mensagem: string; autor_id: string }) {
    if (USE_LOCAL_STORAGE) {
      const ticket = localStorageStorage.addTicketResponse(id, data);
      return ticket ? { success: true, message: "Resposta adicionada", ticket } : { success: false };
    }
    try {
      const res = await api.post(`/tickets/${id}/resposta`, data);
      return res.data;
    } catch {
      const ticket = localStorageStorage.addTicketResponse(id, data);
      return ticket ? { success: true, message: "Resposta adicionada", ticket } : { success: false };
    }
  },

  async getDashboardStats(options?: { dateFrom?: string; dateTo?: string }): Promise<{ success: boolean; stats: DashboardStats }> {
    if (USE_LOCAL_STORAGE) {
      const stats = localStorageStorage.getDashboardStats(options);
      return { success: true, stats };
    }
    try {
      const res = await api.get("/dashboard/stats", { params: options });
      return res.data;
    } catch {
      const stats = localStorageStorage.getDashboardStats(options);
      return { success: true, stats };
    }
  },
};
