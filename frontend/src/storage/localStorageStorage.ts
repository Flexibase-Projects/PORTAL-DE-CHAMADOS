/**
 * Armazenamento local em localStorage (fallback quando Supabase está offline)
 * Usa o mesmo formato de dados retornado pela API
 */

import { generateProtocol } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";
import type { User, Role } from "@/types/user";
import type { KBCategory, KBArticle } from "@/types/knowledge-base";
import type { TemplateField } from "@/types/template";

const KEYS = {
  TICKETS: "PDC_tickets",
  USERS: "PDC_users",
  ROLES: "PDC_roles",
  TEMPLATES: "PDC_templates",
  KB_CATEGORIES: "PDC_kb_categories",
  KB_ARTICLES: "PDC_kb_articles",
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
    return this.getTickets().find((t) => t.id === id) ?? null;
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

  // KB Categories
  getCategories(): KBCategory[] {
    const cats = get<KBCategory[]>(KEYS.KB_CATEGORIES, []);
    const articlesRaw = get<KBArticle[]>(KEYS.KB_ARTICLES, []);
    return cats.map((c) => ({
      ...c,
      article_count: articlesRaw.filter((a) => a.categoria_id === c.id).length,
    }));
  },
  createCategory(data: Partial<KBCategory>): KBCategory {
    const cats = this.getCategories();
    const cat: KBCategory = {
      id: genId(),
      nome: data.nome ?? "",
      descricao: data.descricao,
      icone: data.icone ?? "folder",
      ordem: data.ordem ?? 0,
      created_at: now(),
      updated_at: now(),
    };
    cats.push(cat);
    set(KEYS.KB_CATEGORIES, cats);
    return cat;
  },
  updateCategory(id: string, data: Partial<KBCategory>): KBCategory | null {
    const cats = get<KBCategory[]>(KEYS.KB_CATEGORIES, []);
    const idx = cats.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    cats[idx] = { ...cats[idx], ...data, updated_at: now() };
    set(KEYS.KB_CATEGORIES, cats);
    return cats[idx];
  },
  deleteCategory(id: string): boolean {
    const cats = get<KBCategory[]>(KEYS.KB_CATEGORIES, []).filter((c) => c.id !== id);
    set(KEYS.KB_CATEGORIES, cats);
    const articlesRaw = get<KBArticle[]>(KEYS.KB_ARTICLES, []).filter((a) => a.categoria_id !== id);
    set(KEYS.KB_ARTICLES, articlesRaw);
    return true;
  },

  // KB Articles
  getArticles(categoriaId?: string): KBArticle[] {
    const articles = get<KBArticle[]>(KEYS.KB_ARTICLES, []);
    let list = articles;
    if (categoriaId) list = articles.filter((a) => a.categoria_id === categoriaId);
    const cats = get<KBCategory[]>(KEYS.KB_CATEGORIES, []);
    return list.map((a) => ({
      ...a,
      categoria_nome: cats.find((c) => c.id === a.categoria_id)?.nome,
    }));
  },
  getArticleById(id: string): KBArticle | null {
    const articles = this.getArticles();
    return articles.find((a) => a.id === id) ?? null;
  },
  createArticle(data: Partial<KBArticle>): KBArticle {
    const articles = get<KBArticle[]>(KEYS.KB_ARTICLES, []);
    const article: KBArticle = {
      id: genId(),
      categoria_id: data.categoria_id ?? "",
      titulo: data.titulo ?? "",
      conteudo: data.conteudo ?? "",
      autor_id: data.autor_id,
      publicado: data.publicado !== false,
      created_at: now(),
      updated_at: now(),
    };
    articles.push(article);
    set(KEYS.KB_ARTICLES, articles);
    return article;
  },
  updateArticle(id: string, data: Partial<KBArticle>): KBArticle | null {
    const articles = get<KBArticle[]>(KEYS.KB_ARTICLES, []);
    const idx = articles.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    articles[idx] = { ...articles[idx], ...data, updated_at: now() };
    set(KEYS.KB_ARTICLES, articles);
    return articles[idx];
  },
  deleteArticle(id: string): boolean {
    const articles = this.getArticles().filter((a) => a.id !== id);
    set(KEYS.KB_ARTICLES, articles);
    return true;
  },

  // Dashboard stats
  getDashboardStats() {
    const tickets = this.getTickets();
    const today = new Date().toISOString().split("T")[0];
    const abertos = tickets.filter((t) => t.status === "Aberto").length;
    const em_andamento = tickets.filter((t) => t.status === "Em Andamento").length;
    const concluidos = tickets.filter((t) => t.status === "Concluído").length;
    const deptCounts: Record<string, number> = {};
    tickets.forEach((t) => {
      const area = t.area_destino || "Outros";
      deptCounts[area] = (deptCounts[area] || 0) + 1;
    });
    const por_departamento = Object.entries(deptCounts).map(([area, count]) => ({ area, count }));
    const por_dia: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = tickets.filter((t) =>
        (t.created_at ?? "").toString().startsWith(dateStr)
      ).length;
      por_dia.push({
        date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        count,
      });
    }
    const recentes = [...tickets]
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
      .slice(0, 10);
    return {
      total: tickets.length,
      abertos,
      em_andamento,
      concluidos,
      por_departamento,
      por_dia,
      recentes,
    };
  },
};
