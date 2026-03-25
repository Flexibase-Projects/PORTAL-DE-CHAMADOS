import { dashboardService } from '../services/dashboardService.js';

export const dashboardController = {
  async getStats(req, res) {
    try {
      const { dateFrom, dateTo, auth_user_id: queryAuthUserId } = req.query || {};
      const authUserId = req.headers['x-auth-user-id'] || queryAuthUserId || null;
      if (process.env.NODE_ENV !== 'production' && !authUserId) {
        console.debug('[dashboardController] getStats: x-auth-user-id ausente — dashboard retornará vazio para usuário logado');
      }
      const stats = await dashboardService.getStats({ dateFrom, dateTo, authUserId });
      res.json({ success: true, stats });
    } catch (error) {
      const emptyStats = {
        total: 0,
        abertos: 0,
        em_andamento: 0,
        pausados: 0,
        concluidos: 0,
        por_departamento: [],
        por_dia: [],
        por_dia_industria: [],
        por_dia_administrativo: [],
        por_mes_geral: [],
        por_mes_industria: [],
        por_mes_administrativo: [],
        por_setor: [],
        top_solicitantes: [],
      };
      console.error('[dashboardController] fallback stats:', error?.message || error);
      res.json({ success: true, stats: emptyStats, degraded: true });
    }
  },
};
