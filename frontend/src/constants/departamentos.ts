export const SETORES = ["Comercial", "Administrativo", "Industrial"] as const;

export type SetorMacro = (typeof SETORES)[number];

/** Título no picker de departamentos (UI). */
export const SETOR_LABEL_PICKER: Record<SetorMacro, string> = {
  Comercial: "Comercial",
  Administrativo: "Administrativo",
  Industrial: "Indústria",
};

/** Cor de destaque por macro-setor (picker de departamentos). */
export const SETOR_ACCENT_PICKER: Record<SetorMacro, string> = {
  Comercial: "#2563eb",
  Administrativo: "#7c3aed",
  Industrial: "#ea580c",
};

/**
 * Setores usados em filtros legados onde só havia Admin + Industrial (ex.: algumas regras antigas).
 * O picker de criar chamado usa `SETORES` completo (inclui Comercial).
 */
export const SETORES_CHAMADO = ["Administrativo", "Industrial"] as const;

/** Fatias do donut e filtros globais do dashboard: só Administrativo e Industrial (Comercial agrega em Administrativo). */
export const SETORES_DASHBOARD = ["Administrativo", "Industrial"] as const;
export type SetorDashboard = (typeof SETORES_DASHBOARD)[number];

export const DEPARTAMENTOS_POR_SETOR: Record<string, string[]> = {
  /** Vazio por enquanto; departamentos comerciais ficam em Administrativo (como antes da coluna Comercial). */
  Comercial: [],
  Administrativo: [
    "ASSESSORIA COMERCIAL",
    "ASSESSORIA PRIVADO",
    "CASAS DAS ATAS",
    "COMPRAS",
    "FINANCEIRO",
    "GESTÃO COMERCIAL",
    "LICITAÇÃO",
    "MAP",
    "MARKETING",
    "RECEPÇÃO",
    "REPRESENTANTES",
    "RH",
    "TI",
  ].sort(),
  Industrial: [
    "ALMOXARIFADO",
    "ENGENHARIA",
    "EXPEDIÇÃO",
    "GESTÃO INDUSTRIAL",
    "MARCENARIA",
    "MANUTENÇÃO",
    "NOVOS PRODUTOS",
    "PCP",
    "QUALIDADE",
    "RH",
    "SEG. DO TRABALHO",
    "SERRALHERIA",
    "TAPEÇARIA",
  ].sort(),
};

export function getAllDepartamentos(): string[] {
  const comercial = DEPARTAMENTOS_POR_SETOR.Comercial ?? [];
  const admin = DEPARTAMENTOS_POR_SETOR.Administrativo ?? [];
  const ind = DEPARTAMENTOS_POR_SETOR.Industrial ?? [];
  return [...new Set([...comercial, ...admin, ...ind])].sort();
}

/** Retorna o setor real (Comercial, Administrativo, Industrial) do departamento, ou null. */
export function getSetorByDepartamento(departamento: string): string | null {
  if (!departamento?.trim()) return null;
  const d = departamento.trim().toUpperCase();
  const ordem: SetorMacro[] = ["Comercial", "Administrativo", "Industrial"];
  for (const setor of ordem) {
    const depts = DEPARTAMENTOS_POR_SETOR[setor] ?? [];
    if (depts.some((x) => x.toUpperCase() === d)) return setor;
  }
  return null;
}

/**
 * Para dashboard e filtros “por setor” com duas categorias: Comercial conta junto com Administrativo.
 */
export function getSetorParaDashboard(departamento: string): SetorDashboard | null {
  const s = getSetorByDepartamento(departamento);
  if (!s) return null;
  if (s === "Industrial") return "Industrial";
  if (s === "Administrativo" || s === "Comercial") return "Administrativo";
  return null;
}

export const TIPOS_SUPORTE_TI = [
  "Camera CRTV",
  "E-mail",
  "Equip. Reunião",
  "Hardware",
  "Impressora",
  "Internet",
  "Lib. De Acesso",
  "Manut. T.I",
  "Rede",
  "Sites de integração",
  "Sistema ERP",
  "Software",
  "Telefonia",
  "Windows/Office",
].sort((a, b) => a.localeCompare(b, "pt-BR"));
