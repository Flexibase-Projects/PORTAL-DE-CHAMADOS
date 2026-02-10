import { permissionService } from '../services/permissionService.js';

export const permissionController = {
  async listAuthUsers(req, res) {
    try {
      const users = await permissionService.listAuthUsers();
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getByAuthUserId(req, res) {
    try {
      const { authUserId } = req.params;
      if (!authUserId) return res.status(400).json({ success: false, error: 'authUserId é obrigatório' });
      const permissions = await permissionService.getByAuthUserId(authUserId);
      res.json({ success: true, permissions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async setForAuthUser(req, res) {
    try {
      const { authUserId } = req.params;
      const { departamentos } = req.body || {};
      if (!authUserId) return res.status(400).json({ success: false, error: 'authUserId é obrigatório' });
      const permissions = await permissionService.setForAuthUser(authUserId, departamentos);
      res.json({ success: true, permissions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
