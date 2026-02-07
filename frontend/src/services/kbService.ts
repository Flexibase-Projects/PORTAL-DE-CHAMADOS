import api from "./api";
import { localStorageStorage } from "@/storage/localStorageStorage";
import type { KBCategory, KBArticle } from "@/types/knowledge-base";

const USE_LOCAL_STORAGE =
  import.meta.env.VITE_USE_LOCAL_STORAGE === "true";

export const kbService = {
  async getCategories(): Promise<{ success: boolean; categories: KBCategory[] }> {
    if (USE_LOCAL_STORAGE) {
      const categories = localStorageStorage.getCategories();
      return { success: true, categories };
    }
    try {
      const res = await api.get("/kb/categories");
      return res.data;
    } catch {
      const categories = localStorageStorage.getCategories();
      return { success: true, categories };
    }
  },

  async createCategory(data: Partial<KBCategory>): Promise<{ success: boolean; category: KBCategory }> {
    if (USE_LOCAL_STORAGE) {
      const category = localStorageStorage.createCategory(data);
      return { success: true, category };
    }
    try {
      const res = await api.post("/kb/categories", data);
      return res.data;
    } catch {
      const category = localStorageStorage.createCategory(data);
      return { success: true, category };
    }
  },

  async updateCategory(id: string, data: Partial<KBCategory>): Promise<{ success: boolean; category: KBCategory }> {
    if (USE_LOCAL_STORAGE) {
      const category = localStorageStorage.updateCategory(id, data);
      return category ? { success: true, category } : { success: false, category: null as unknown as KBCategory };
    }
    try {
      const res = await api.put(`/kb/categories/${id}`, data);
      return res.data;
    } catch {
      const category = localStorageStorage.updateCategory(id, data);
      return category ? { success: true, category } : { success: false, category: null as unknown as KBCategory };
    }
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    if (USE_LOCAL_STORAGE) {
      localStorageStorage.deleteCategory(id);
      return { success: true };
    }
    try {
      const res = await api.delete(`/kb/categories/${id}`);
      return res.data;
    } catch {
      localStorageStorage.deleteCategory(id);
      return { success: true };
    }
  },

  async getArticles(categoryId?: string): Promise<{ success: boolean; articles: KBArticle[] }> {
    if (USE_LOCAL_STORAGE) {
      const articles = localStorageStorage.getArticles(categoryId);
      return { success: true, articles };
    }
    try {
      const params = categoryId ? { categoria_id: categoryId } : {};
      const res = await api.get("/kb/articles", { params });
      return res.data;
    } catch {
      const articles = localStorageStorage.getArticles(categoryId);
      return { success: true, articles };
    }
  },

  async getArticleById(id: string): Promise<{ success: boolean; article: KBArticle }> {
    if (USE_LOCAL_STORAGE) {
      const article = localStorageStorage.getArticleById(id);
      return article ? { success: true, article } : { success: false, article: null as unknown as KBArticle };
    }
    try {
      const res = await api.get(`/kb/articles/${id}`);
      return res.data;
    } catch {
      const article = localStorageStorage.getArticleById(id);
      return article ? { success: true, article } : { success: false, article: null as unknown as KBArticle };
    }
  },

  async createArticle(data: Partial<KBArticle>): Promise<{ success: boolean; article: KBArticle }> {
    if (USE_LOCAL_STORAGE) {
      const article = localStorageStorage.createArticle(data);
      return { success: true, article };
    }
    try {
      const res = await api.post("/kb/articles", data);
      return res.data;
    } catch {
      const article = localStorageStorage.createArticle(data);
      return { success: true, article };
    }
  },

  async updateArticle(id: string, data: Partial<KBArticle>): Promise<{ success: boolean; article: KBArticle }> {
    if (USE_LOCAL_STORAGE) {
      const article = localStorageStorage.updateArticle(id, data);
      return article ? { success: true, article } : { success: false, article: null as unknown as KBArticle };
    }
    try {
      const res = await api.put(`/kb/articles/${id}`, data);
      return res.data;
    } catch {
      const article = localStorageStorage.updateArticle(id, data);
      return article ? { success: true, article } : { success: false, article: null as unknown as KBArticle };
    }
  },

  async deleteArticle(id: string): Promise<{ success: boolean }> {
    if (USE_LOCAL_STORAGE) {
      localStorageStorage.deleteArticle(id);
      return { success: true };
    }
    try {
      const res = await api.delete(`/kb/articles/${id}`);
      return res.data;
    } catch {
      localStorageStorage.deleteArticle(id);
      return { success: true };
    }
  },
};
