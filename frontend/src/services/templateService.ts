import api from "./api";
import { localStorageStorage } from "@/storage/localStorageStorage";
import type { TemplateField } from "@/types/template";

const USE_LOCAL_STORAGE =
  import.meta.env.VITE_USE_LOCAL_STORAGE === "true";

export const templateService = {
  async getTemplate(departamento: string) {
    if (USE_LOCAL_STORAGE) {
      const template = localStorageStorage.getTemplate(departamento);
      return { success: true, template };
    }
    try {
      const res = await api.get(`/templates/${encodeURIComponent(departamento)}`);
      return res.data;
    } catch {
      const template = localStorageStorage.getTemplate(departamento);
      return { success: true, template };
    }
  },

  async saveTemplate(departamento: string, fields: unknown[]) {
    if (USE_LOCAL_STORAGE) {
      const template = localStorageStorage.saveTemplate(departamento, (fields ?? []) as TemplateField[]);
      return { success: true, template };
    }
    try {
      const res = await api.put("/templates", { departamento, fields });
      return res.data;
    } catch {
      const template = localStorageStorage.saveTemplate(departamento, (fields ?? []) as TemplateField[]);
      return { success: true, template };
    }
  },
};
