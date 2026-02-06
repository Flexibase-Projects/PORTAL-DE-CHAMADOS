import { kbService } from '../services/kbService.js';

export const kbController = {
  // Categories
  async getCategories(req, res) {
    try {
      const categories = await kbService.getCategories();
      res.json({ success: true, categories });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar categorias', message: error.message });
    }
  },

  async createCategory(req, res) {
    try {
      const category = await kbService.createCategory(req.body);
      res.status(201).json({ success: true, category });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Erro ao criar categoria', message: error.message });
    }
  },

  async updateCategory(req, res) {
    try {
      const category = await kbService.updateCategory(req.params.id, req.body);
      res.json({ success: true, category });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Erro ao atualizar categoria', message: error.message });
    }
  },

  async deleteCategory(req, res) {
    try {
      await kbService.deleteCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Erro ao excluir categoria', message: error.message });
    }
  },

  // Articles
  async getArticles(req, res) {
    try {
      const articles = await kbService.getArticles(req.query.categoria_id);
      res.json({ success: true, articles });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar artigos', message: error.message });
    }
  },

  async getArticleById(req, res) {
    try {
      const article = await kbService.getArticleById(req.params.id);
      if (!article) return res.status(404).json({ success: false, error: 'Artigo não encontrado' });
      res.json({ success: true, article });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar artigo', message: error.message });
    }
  },

  async createArticle(req, res) {
    try {
      const article = await kbService.createArticle(req.body);
      res.status(201).json({ success: true, article });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Erro ao criar artigo', message: error.message });
    }
  },

  async updateArticle(req, res) {
    try {
      const article = await kbService.updateArticle(req.params.id, req.body);
      res.json({ success: true, article });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Erro ao atualizar artigo', message: error.message });
    }
  },

  async deleteArticle(req, res) {
    try {
      await kbService.deleteArticle(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Erro ao excluir artigo', message: error.message });
    }
  },
};
