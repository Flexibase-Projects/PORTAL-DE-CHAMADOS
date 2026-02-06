export const SETORES = ["Administrativo", "Industrial"] as const;

export const DEPARTAMENTOS_POR_SETOR: Record<string, string[]> = {
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
  const admin = DEPARTAMENTOS_POR_SETOR.Administrativo ?? [];
  const ind = DEPARTAMENTOS_POR_SETOR.Industrial ?? [];
  return [...new Set([...admin, ...ind])].sort();
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
