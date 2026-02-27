import { permissionService } from '../services/permissionService.js';

export const meController = {
  async getMe(req, res) {
    try {
      const authUserId = req.headers['x-auth-user-id'];
      if (!authUserId) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }
      const departamento = await permissionService.getDepartamentoByAuthUserId(authUserId);
      res.json({ success: true, departamento: departamento || null });
    } catch (error) {
      console.error('[me] getMe:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
