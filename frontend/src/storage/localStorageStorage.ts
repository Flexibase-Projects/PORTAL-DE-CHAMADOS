/**
 * Armazenamento local em localStorage (fallback quando Supabase está offline)
 * Usa o mesmo formato de dados retornado pela API
 */

import { generateProtocol } from "@/lib/utils";
import { getSetorByDepartamento } from "@/constants/departamentos";
import type { Ticket } from "@/types/ticket";
import type { User, Role } from "@/types/user";
import type { TemplateField } from "@/types/template";

const KEYS = {
  TICKETS: "PDC_tickets",
  USERS: "PDC_users",
  ROLES: "PDC_roles",
  TEMPLATES: "PDC_templates",
} as const;

function get<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function set(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function genId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

const INITIAL_ROLES: Role[] = [
  { id: "1", nome: "admin", descricao: "Administrador", nivel: 4 },
  { id: "2", nome: "gestor_area", descricao: "Gestor de Área", nivel: 3 },
  { id: "3", nome: "tecnico", descricao: "Técnico/Suporte", nivel: 2 },
  { id: "4", nome: "usuario", descricao: "Usuário", nivel: 1 },
];

export const localStorageStorage = {
  // Roles
  getRoles(): Role[] {
    const roles = get<Role[]>(KEYS.ROLES, []);
    if (roles.length === 0) {
      set(KEYS.ROLES, INITIAL_ROLES);
      return INITIAL_ROLES;
    }
    return roles;
  },

  // Users
  getUsers(): User[] {
    return get<User[]>(KEYS.USERS, []);
  },
  getUserById(id: string): User | null {
    return this.getUsers().find((u) => u.id === id) ?? null;
  },
  getUserByEmail(email: string): User | null {
    return this.getUsers().find((u) => u.email === email) ?? null;
  },
  createUser(data: Partial<User>): User {
    const users = this.getUsers();
    const user: User = {
      id: genId(),
      nome: data.nome ?? "",
      email: data.email ?? "",
      setor: data.setor ?? "",
      departamento: data.departamento ?? "",
      ramal: data.ramal,
      role_id: data.role_id ?? INITIAL_ROLES[3].id,
      role: INITIAL_ROLES.find((r) => r.id === data.role_id) ?? INITIAL_ROLES[3],
      ativo: true,
      created_at: now(),
      updated_at: now(),
    };
    users.push(user);
    set(KEYS.USERS, users);
    return user;
  },
  updateUser(id: string, data: Partial<User>): User | null {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...data, updated_at: now() };
    set(KEYS.USERS, users);
    return users[idx];
  },
  toggleUserActive(id: string): User | null {
    const user = this.getUserById(id);
    if (!user) return null;
    return this.updateUser(id, { ativo: !user.ativo });
  },

  // Tickets
  getTickets(): Ticket[] {
    return get<Ticket[]>(KEYS.TICKETS, []);
  },
  getTicketById(id: string): Ticket | null {
    const t = this.getTickets().find((t) => t.id === id) ?? null;
    if (!t) return null;
    const atividades = [...(t.respostas || [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((r) => ({
        id: r.id,
        tipo: "comentario" as const,
        autor_nome: r.autor_nome,
        created_at: r.created_at,
        detalhes: { mensagem: (r.mensagem || "").slice(0, 300) },
      }));
    atividades.unshift({
      id: `${t.id}-criado`,
      tipo: "criado",
      autor_nome: t.solicitante_nome,
      created_at: t.created_at,
      detalhes: {},
    });
    return { ...t, atividades };
  },
  createTicket(data: Record<string, unknown>): Ticket {
    const tickets = this.getTickets();
    const users = this.getUsers();
    let user = users.find((u) => u.email === data.email);
    if (!user) {
      user = this.createUser({
        nome: (data.nome as string) ?? "Usuário",
        email: data.email as string,
        setor: (data.setor as string) ?? "Administrativo",
        departamento: (data.area as string) ?? "TI",
        ramal: data.ramal as string,
      });
    }
    const ticket: Ticket = {
      id: genId(),
      numero_protocolo: generateProtocol(),
      solicitante_id: user.id,
      solicitante_nome: user.nome,
      solicitante_email: user.email,
      area_destino: (data.area as string) ?? "",
      setor: (data.setor as string) ?? "",
      assunto: (data.assunto as string) ?? "",
      mensagem: (data.mensagem as string) ?? "",
      tipo_suporte: (data.tipoSuporte as string) ?? (data.tipo_suporte as string),
      dados_extras: (data.dadosExtras ?? data.dados_extras ?? {}) as Record<string, unknown>,
      status: "Aberto",
      prioridade: (data.prioridade as Ticket["prioridade"]) ?? "Normal",
      created_at: now(),
      updated_at: now(),
      respostas: [],
    };
    tickets.unshift(ticket);
    set(KEYS.TICKETS, tickets);
    return ticket;
  },
  updateTicketStatus(id: string, status: Ticket["status"]): Ticket | null {
    const tickets = this.getTickets();
    const idx = tickets.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    tickets[idx] = {
      ...tickets[idx],
      status,
      updated_at: now(),
      closed_at: status === "Concluído" ? now() : undefined,
    };
    set(KEYS.TICKETS, tickets);
    return tickets[idx];
  },
  addTicketResponse(
    ticketId: string,
    data: { mensagem: string; autor_id: string }
  ): Ticket | null {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) return null;
    const respostas = ticket.respostas ?? [];
    const autor = this.getUserById(data.autor_id);
    respostas.push({
      id: genId(),
      ticket_id: ticketId,
      autor_id: data.autor_id,
      autor_nome: autor?.nome ?? "Administrador",
      mensagem: data.mensagem,
      created_at: now(),
    });
    const tickets = this.getTickets();
    const idx = tickets.findIndex((t) => t.id === ticketId);
    if (idx === -1) return null;
    tickets[idx] = {
      ...tickets[idx],
      respostas,
      status: ticket.status === "Aberto" ? "Em Andamento" : ticket.status,
      updated_at: now(),
    };
    set(KEYS.TICKETS, tickets);
    return tickets[idx];
  },

  // Templates
  getTemplate(departamento: string): { departamento: string; fields: TemplateField[] } {
    const templates = get<Array<{ departamento: string; fields: TemplateField[] }>>(
      KEYS.TEMPLATES,
      []
    );
    const t = templates.find((x) => x.departamento === departamento);
    return t ?? { departamento, fields: [] };
  },
  saveTemplate(
    departamento: string,
    fields: TemplateField[]
  ): { departamento: string; fields: TemplateField[] } {
    const templates = get<Array<{ id?: string; departamento: string; fields: TemplateField[] }>>(
      KEYS.TEMPLATES,
      []
    );
    const idx = templates.findIndex((x) => x.departamento === departamento);
    const item = {
      id: idx >= 0 ? templates[idx].id : genId(),
      departamento,
      fields,
      ativo: true,
      created_at: idx >= 0 ? templates[idx].created_at : now(),
      updated_at: now(),
    };
    if (idx >= 0) templates[idx] = item;
    else templates.push(item as never);
    set(KEYS.TEMPLATES, templates);
    return { departamento, fields };
  },

  // Dashboard stats (opcional: dateFrom e dateTo para intervalo customizado em por_dia)
  getDashboardStats(options?: { dateFrom?: string; dateTo?: string }) {
    const tickets = this.getTickets();
    const abertos = tickets.filter((t) => t.status === "Aberto").length;
    const em_andamento = tickets.filter((t) => t.status === "Em Andamento").length;
    const concluidos = tickets.filter((t) => t.status === "Concluído").length;
    const deptCounts: Record<string, number> = {};
    tickets.forEach((t) => {
      const area = t.area_destino || "Outros";
      deptCounts[area] = (deptCounts[area] || 0) + 1;
    });
    const por_departamento = Object.entries(deptCounts).map(([area, count]) => ({ area, count }));

    const dateFrom = options?.dateFrom ? String(options.dateFrom).slice(0, 10) : null;
    const dateTo = options?.dateTo ? String(options.dateTo).slice(0, 10) : null;
    const useCustomRange = Boolean(dateFrom && dateTo && dateFrom <= dateTo);

    const ticketsForTopStats =
      dateFrom && dateTo && dateFrom <= dateTo
        ? tickets.filter((t) => {
            const c = (t.created_at ?? "").toString().slice(0, 10);
            return c >= dateFrom && c <= dateTo;
          })
        : tickets;
    const users = this.getUsers();
    const topSolicitantesMap = new Map<
      string,
      { usuario_id: string; nome: string; departamento_origem: string; count: number }
    >();
    ticketsForTopStats.forEach((t) => {
      const sid = t.solicitante_id;
      if (!sid) return;
      const u = users.find((x) => x.id === sid);
      const nome = (t.solicitante_nome || u?.nome || "").trim() || "Usuário";
      const dept = (u?.departamento || "").trim();
      if (!topSolicitantesMap.has(sid)) {
        topSolicitantesMap.set(sid, { usuario_id: sid, nome, departamento_origem: dept, count: 0 });
      }
      const row = topSolicitantesMap.get(sid)!;
      row.count += 1;
    });
    const top_solicitantes = [...topSolicitantesMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    const buildPorDia = (
      list: Ticket[],
      filterSetor: string | null = null
    ): { date: string; count: number }[] => {
      const out: { date: string; count: number }[] = [];
      if (useCustomRange && dateFrom && dateTo) {
        const parseYMD = (s: string) => {
          const p = s.slice(0, 10).split("-").map(Number);
          return { y: p[0], m: p[1], d: p[2] };
        };
        let { y, m, d } = parseYMD(dateFrom);
        for (;;) {
          const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          if (dateStr < dateFrom.slice(0, 10) || dateStr > dateTo.slice(0, 10)) break;
          const filtered =
            filterSetor === null
              ? list
              : list.filter((t) => getSetorByDepartamento(t.area_destino ?? "") === filterSetor);
          const count = filtered.filter((t) =>
            (t.created_at ?? "").toString().startsWith(dateStr)
          ).length;
          const loc = new Date(y, m - 1, d);
          out.push({
            dateKey: dateStr,
            date: loc.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }),
            count,
          });
          if (dateStr === dateTo.slice(0, 10)) break;
          loc.setDate(loc.getDate() + 1);
          y = loc.getFullYear();
          m = loc.getMonth() + 1;
          d = loc.getDate();
        }
      } else {
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const filtered =
            filterSetor === null
              ? list
              : list.filter((t) => getSetorByDepartamento(t.area_destino ?? "") === filterSetor);
          const count = filtered.filter((t) =>
            (t.created_at ?? "").toString().startsWith(dateStr)
          ).length;
          out.push({
            date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            count,
          });
        }
      }
      return out;
    };
    const por_dia = buildPorDia(tickets);
    const por_dia_industria = buildPorDia(tickets, "Industrial");
    const por_dia_administrativo = buildPorDia(tickets, "Administrativo");
    const mesNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const aggregateByMonth = (
      list: Ticket[],
      filterSetor: string | null = null
    ): { mes: string; count: number }[] => {
      const byMonth: Record<string, number> = {};
      list.forEach((t) => {
        const setor = getSetorByDepartamento(t.area_destino ?? "");
        if (filterSetor !== null && setor !== filterSetor) return;
        const created = (t.created_at ?? "").toString().slice(0, 7);
        if (!created) return;
        byMonth[created] = (byMonth[created] ?? 0) + 1;
      });
      return Object.keys(byMonth)
        .sort()
        .map((ym) => {
          const [y, m] = ym.split("-").map(Number);
          return { mes: `${mesNames[m - 1]}/${String(y).slice(-2)}`, count: byMonth[ym] };
        });
    };
    const aggregateByMonthInRange = (
      list: Ticket[],
      filterSetor: string | null,
      rangeFrom: string,
      rangeTo: string
    ): { mes: string; mesKey: string; count: number }[] => {
      const rangeStart = rangeFrom.slice(0, 7);
      const rangeEnd = rangeTo.slice(0, 7);
      const filtered = list.filter((t) => {
        const created = (t.created_at ?? "").toString().slice(0, 10);
        return created >= rangeFrom && created <= rangeTo;
      });
      const byMonth: Record<string, number> = {};
      filtered.forEach((t) => {
        const setor = getSetorByDepartamento(t.area_destino ?? "");
        if (filterSetor !== null && setor !== filterSetor) return;
        const created = (t.created_at ?? "").toString().slice(0, 7);
        if (!created) return;
        byMonth[created] = (byMonth[created] ?? 0) + 1;
      });
      return Object.keys(byMonth)
        .sort()
        .filter((ym) => ym >= rangeStart && ym <= rangeEnd)
        .map((ym) => {
          const [y, m] = ym.split("-").map(Number);
          return {
            mesKey: ym,
            mes: `${mesNames[m - 1]}/${String(y).slice(-2)}`,
            count: byMonth[ym],
          };
        });
    };
    const aggregateBySetor = (): { setor: string; count: number }[] => {
      const counts: Record<string, number> = { Comercial: 0, Administrativo: 0, Industrial: 0 };
      tickets.forEach((t) => {
        const setor = getSetorByDepartamento(t.area_destino ?? "");
        if (setor && setor in counts) counts[setor]++;
      });
      return (["Comercial", "Administrativo", "Industrial"] as const)
        .map((setor) => ({ setor, count: counts[setor] }))
        .filter((x) => x.count > 0);
    };

    const base = {
      total: tickets.length,
      abertos,
      em_andamento,
      concluidos,
      por_departamento,
      por_dia,
      por_dia_industria,
      por_dia_administrativo,
      por_mes_geral: aggregateByMonth(tickets),
      por_mes_industria: aggregateByMonth(tickets, "Industrial"),
      por_mes_administrativo: aggregateByMonth(tickets, "Administrativo"),
      por_setor: aggregateBySetor(),
      top_solicitantes,
    };
    if (useCustomRange && dateFrom && dateTo) {
      return {
        ...base,
        por_mes_geral_range: aggregateByMonthInRange(tickets, null, dateFrom, dateTo),
        por_mes_industria_range: aggregateByMonthInRange(tickets, "Industrial", dateFrom, dateTo),
        por_mes_administrativo_range: aggregateByMonthInRange(tickets, "Administrativo", dateFrom, dateTo),
      };
    }
    return base;
  },
};
