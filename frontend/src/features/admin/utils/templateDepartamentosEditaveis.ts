import { getAllDepartamentos } from "@/constants/departamentos";

export function canEditTemplateForDepartment(
  permissions: Record<string, string>,
  userDepartamento: string | null,
  departamento: string
): boolean {
  const d = departamento.trim();
  if (!d) return false;
  const p = permissions[d];
  if (p === "view_edit" || p === "manage_templates") return true;
  if (userDepartamento && userDepartamento.trim() === d) return true;
  return false;
}

/** Lista ordenada de departamentos em que o usuário pode editar template (chamado + lista explícita de templates). */
export function getDepartamentosComEdicaoTemplate(
  permissions: Record<string, string>,
  templateDepartamentos: string[],
  userDepartamento: string | null
): string[] {
  const allDepartamentos = getAllDepartamentos();
  const explicitTemplateSet = new Set((templateDepartamentos || []).map((d) => (d || "").trim().toUpperCase()));
  return allDepartamentos.filter((d) => {
    const hasExplicitTemplatePerm = explicitTemplateSet.has(d.trim().toUpperCase());
    return hasExplicitTemplatePerm || canEditTemplateForDepartment(permissions, userDepartamento, d);
  });
}
