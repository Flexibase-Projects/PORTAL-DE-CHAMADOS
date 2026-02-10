export const SETORES = ["Comercial", "Administrativo", "Industrial"] as const;

/** Setores disponíveis no formulário de chamado (apenas Administrativo e Industrial). */
export const SETORES_CHAMADO = ["Administrativo", "Industrial"] as const;

export const DEPARTAMENTOS_POR_SETOR: Record<string, string[]> = {
  Comercial: [], // departamentos ex-Comercial foram movidos para Administrativo
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

/** Retorna o setor (Comercial, Administrativo, Industrial) do departamento, ou null. */
export function getSetorByDepartamento(departamento: string): string | null {
  if (!departamento?.trim()) return null;
  const d = departamento.trim().toUpperCase();
  for (const [setor, depts] of Object.entries(DEPARTAMENTOS_POR_SETOR)) {
    if (depts.some((x) => x.toUpperCase() === d)) return setor;
  }
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
