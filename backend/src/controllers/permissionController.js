import { permissionService } from '../services/permissionService.js';

export const permissionController = {
  async listAuthUsers(req, res) {
    try {
      const users = await permissionService.listAuthUsers();
      res.json({ success: true, users });
    } catch (error) {
      console.error('[permissions] listAuthUsers:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getByAuthUserId(req, res) {
    try {
      const { authUserId } = req.params;
      if (!authUserId) return res.status(400).json({ success: false, error: 'authUserId é obrigatório' });
      const result = await permissionService.getByAuthUserId(authUserId);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('[permissions] getByAuthUserId:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async setForAuthUser(req, res) {
    try {
      const { authUserId } = req.params;
      const { departamentos, userDepartamento, templateDepartamentos } = req.body || {};
      if (!authUserId) return res.status(400).json({ success: false, error: 'authUserId é obrigatório' });
      const result = await permissionService.setForAuthUser(
        authUserId,
        departamentos,
        userDepartamento,
        templateDepartamentos
      );
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('[permissions] setForAuthUser:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async setUserDepartamento(req, res) {
    try {
      const { authUserId } = req.params;
      const { userDepartamento } = req.body || {};
      if (!authUserId) return res.status(400).json({ success: false, error: 'authUserId é obrigatório' });
      const result = await permissionService.setUserDepartamento(authUserId, userDepartamento ?? null);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('[permissions] setUserDepartamento:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
