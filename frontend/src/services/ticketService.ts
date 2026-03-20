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
  /** Por dia: abertos (linha) e fechados (barras). Fallback: count = abertos quando API antiga/localStorage. */
  por_dia: { date: string; dateKey?: string; abertos?: number; fechados?: number; count?: number }[];
  por_dia_industria: { date: string; dateKey?: string; abertos?: number; fechados?: number; count?: number }[];
  por_dia_administrativo: { date: string; dateKey?: string; abertos?: number; fechados?: number; count?: number }[];
  /** Por mês: abertos (linha) e fechados (barras). Fallback: count = abertos quando API antiga/localStorage. */
  por_mes_geral: { mes: string; mesKey?: string; abertos?: number; fechados?: number; count?: number }[];
  por_mes_industria: { mes: string; mesKey?: string; abertos?: number; fechados?: number; count?: number }[];
  por_mes_administrativo: { mes: string; mesKey?: string; abertos?: number; fechados?: number; count?: number }[];
  por_mes_geral_range?: { mes: string; mesKey?: string; abertos?: number; fechados?: number; count?: number }[];
  por_mes_industria_range?: { mes: string; mesKey?: string; abertos?: number; fechados?: number; count?: number }[];
  por_mes_administrativo_range?: { mes: string; mesKey?: string; abertos?: number; fechados?: number; count?: number }[];
  /** Chamados por setor (donut: Industria, Administrativo, Comercial) */
  por_setor: { setor: string; count: number }[];
  /** Quem mais abriu chamados no período (e escopo de permissão do dashboard). */
  top_solicitantes: {
    usuario_id: string;
    nome: string;
    count: number;
    departamento_origem?: string;
  }[];
}

const DASHBOARD_CACHE_TTL_MS = 60 * 1000;
let dashboardCache: { key: string; result: { success: boolean; stats: DashboardStats }; expiresAt: number } | null = null;

function getDashboardCacheKey(options?: { dateFrom?: string; dateTo?: string; auth_user_id?: string | null }): string {
  const range =
    options?.dateFrom && options?.dateTo && options.dateFrom <= options.dateTo
      ? `range:${options.dateFrom}:${options.dateTo}`
      : "default";
  return `${options?.auth_user_id ?? "anon"}:${range}`;
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

  /** Meus chamados por usuário autenticado. Envia auth_user_id e email na query para garantir que o backend receba mesmo se o header for perdido. */
  async getMeusChamadosByAuth(authUserId?: string | null, email?: string | null): Promise<{
    success: boolean;
    chamadosMeuDepartamento?: Ticket[];
    chamadosQueAbriOutros?: Ticket[];
    permissoesPorDepartamento?: Record<string, "view" | "view_edit" | "manage_templates">;
  }> {
    if (USE_LOCAL_STORAGE) {
      return { success: true, chamadosMeuDepartamento: [], chamadosQueAbriOutros: [] };
    }
    try {
      const params: Record<string, string> = {};
      if (authUserId) params.auth_user_id = authUserId;
      if (email) params.auth_user_email = email;
      const res = await api.get("/tickets/meus-chamados-by-auth", { params });
      return res.data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) throw new Error("Não foi possível identificar seu usuário. Faça login novamente.");
      throw err;
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

  async getReceived(authUserId?: string | null, email?: string | null) {
    if (USE_LOCAL_STORAGE) {
      const tickets = localStorageStorage.getTickets().filter((t) => t.status !== "Concluído");
      return { success: true, tickets };
    }
    try {
      const res = await api.get("/tickets/recebidos", {
        params: {
          ...(authUserId ? { auth_user_id: authUserId } : {}),
          ...(email ? { auth_user_email: email } : {}),
        },
      });
      return res.data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) throw new Error("Não foi possível identificar seu usuário. Faça login novamente.");
      throw err;
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

  async addResponse(
    id: string,
    data: { mensagem: string; autor_id: string; auth_user_id?: string | null; auth_user_email?: string | null }
  ) {
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

  async getDashboardStats(options?: {
    dateFrom?: string;
    dateTo?: string;
    auth_user_id?: string | null;
  }): Promise<{ success: boolean; stats: DashboardStats }> {
    if (USE_LOCAL_STORAGE) {
      const stats = localStorageStorage.getDashboardStats(options);
      return { success: true, stats };
    }
    const cacheKey = getDashboardCacheKey(options);
    const now = Date.now();
    if (dashboardCache?.key === cacheKey && dashboardCache.expiresAt > now) {
      return dashboardCache.result;
    }
    try {
      const params: Record<string, string> = {};
      if (options?.dateFrom) params.dateFrom = options.dateFrom;
      if (options?.dateTo) params.dateTo = options.dateTo;
      if (options?.auth_user_id) params.auth_user_id = options.auth_user_id;
      const res = await api.get("/dashboard/stats", { params });
      const result = res.data as { success: boolean; stats: DashboardStats };
      dashboardCache = { key: cacheKey, result, expiresAt: now + DASHBOARD_CACHE_TTL_MS };
      return result;
    } catch {
      const stats = localStorageStorage.getDashboardStats(options);
      return { success: true, stats };
    }
  },
};
