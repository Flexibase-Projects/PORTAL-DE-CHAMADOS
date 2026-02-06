import api from "./api";
import type { KBCategory, KBArticle } from "@/types/knowledge-base";

export const kbService = {
  // Categories
  async getCategories(): Promise<{ success: boolean; categories: KBCategory[] }> {
    const res = await api.get("/kb/categories");
    return res.data;
  },

  async createCategory(data: Partial<KBCategory>): Promise<{ success: boolean; category: KBCategory }> {
    const res = await api.post("/kb/categories", data);
    return res.data;
  },

  async updateCategory(id: string, data: Partial<KBCategory>): Promise<{ success: boolean; category: KBCategory }> {
    const res = await api.put(`/kb/categories/${id}`, data);
    return res.data;
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    const res = await api.delete(`/kb/categories/${id}`);
    return res.data;
  },

  // Articles
  async getArticles(categoryId?: string): Promise<{ success: boolean; articles: KBArticle[] }> {
    const params = categoryId ? { categoria_id: categoryId } : {};
    const res = await api.get("/kb/articles", { params });
    return res.data;
  },

  async getArticleById(id: string): Promise<{ success: boolean; article: KBArticle }> {
    const res = await api.get(`/kb/articles/${id}`);
    return res.data;
  },

  async createArticle(data: Partial<KBArticle>): Promise<{ success: boolean; article: KBArticle }> {
    const res = await api.post("/kb/articles", data);
    return res.data;
  },

  async updateArticle(id: string, data: Partial<KBArticle>): Promise<{ success: boolean; article: KBArticle }> {
    const res = await api.put(`/kb/articles/${id}`, data);
    return res.data;
  },

  async deleteArticle(id: string): Promise<{ success: boolean }> {
    const res = await api.delete(`/kb/articles/${id}`);
    return res.data;
  },
};
