import { permissionService } from '../services/permissionService.js';

export const meController = {
  async getMe(req, res) {
    try {
      const authUserId = req.auth?.user?.id;
      if (!authUserId) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }
      const { permissions, userDepartamento, templateDepartamentos } = await permissionService.getByAuthUserId(authUserId);
      res.json({
        success: true,
        departamento: userDepartamento || null,
        permissions: permissions || {},
        templateDepartamentos: templateDepartamentos || [],
      });
    } catch (error) {
      console.error('[me] getMe:', error.message);
      res.status(500).json({ success: false, error: 'Erro ao carregar perfil', message: error.message });
    }
  },
};
