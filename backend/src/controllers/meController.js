import { permissionService } from '../services/permissionService.js';

export const meController = {
  async getMe(req, res) {
    try {
      const authUserId = req.headers['x-auth-user-id'];
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
      // 200 degradado: front continua utilizável (RLS/Supabase indisponível na demo).
      res.status(200).json({
        success: true,
        departamento: null,
        permissions: {},
        templateDepartamentos: [],
        degraded: true,
        message: error.message,
      });
    }
  },
};
