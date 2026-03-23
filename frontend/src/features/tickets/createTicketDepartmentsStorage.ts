import { SETORES, type SetorMacro } from "@/constants/departamentos";

const STORAGE_KEY = "pdc-create-ticket-departments-v1";

export interface CreateTicketDepartmentsDraft {
  area_origem: string;
  setor_origem: SetorMacro;
  area_destino: string;
  setor_destino: SetorMacro;
}

function isSetorMacro(s: string): s is SetorMacro {
  return (SETORES as readonly string[]).includes(s);
}

export function saveCreateTicketDepartmentsDraft(draft: CreateTicketDepartmentsDraft): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota / private mode */
  }
}

export function readCreateTicketDepartmentsDraft(): CreateTicketDepartmentsDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<CreateTicketDepartmentsDraft>;
    if (
      typeof p.area_origem !== "string" ||
      typeof p.area_destino !== "string" ||
      typeof p.setor_origem !== "string" ||
      typeof p.setor_destino !== "string" ||
      !p.area_origem.trim() ||
      !p.area_destino.trim() ||
      !isSetorMacro(p.setor_origem) ||
      !isSetorMacro(p.setor_destino)
    ) {
      return null;
    }
    return {
      area_origem: p.area_origem.trim(),
      area_destino: p.area_destino.trim(),
      setor_origem: p.setor_origem,
      setor_destino: p.setor_destino,
    };
  } catch {
    return null;
  }
}

export function clearCreateTicketDepartmentsDraft(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
