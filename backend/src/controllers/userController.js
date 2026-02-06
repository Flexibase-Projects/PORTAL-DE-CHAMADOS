import { userService } from '../services/userService.js';

export const userController = {
  async getAll(req, res) {
    try {
      const users = await userService.getAll();
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar usuários', message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const user = await userService.getById(req.params.id);
      if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar usuário', message: error.message });
    }
  },

  async create(req, res) {
    try {
      const user = await userService.create(req.body);
      res.status(201).json({ success: true, user });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Erro ao criar usuário', message: error.message });
    }
  },

  async update(req, res) {
    try {
      const user = await userService.update(req.params.id, req.body);
      res.json({ success: true, user });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Erro ao atualizar usuário', message: error.message });
    }
  },

  async toggleActive(req, res) {
    try {
      const user = await userService.toggleActive(req.params.id);
      res.json({ success: true, user });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Erro ao alterar status', message: error.message });
    }
  },

  async getRoles(req, res) {
    try {
      const roles = await userService.getRoles();
      res.json({ success: true, roles });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar perfis', message: error.message });
    }
  },
};
