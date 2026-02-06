import api from "./api";

export const templateService = {
  async getTemplate(departamento: string) {
    const res = await api.get(`/templates/${encodeURIComponent(departamento)}`);
    return res.data;
  },

  async saveTemplate(departamento: string, fields: unknown[]) {
    const res = await api.put("/templates", { departamento, fields });
    return res.data;
  },
};
