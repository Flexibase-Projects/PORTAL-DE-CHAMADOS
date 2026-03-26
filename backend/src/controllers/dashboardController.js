import { dashboardService } from '../services/dashboardService.js';

export const dashboardController = {
  async getStats(req, res) {
    try {
      const { dateFrom, dateTo } = req.query || {};
      const authUserId = req.auth?.user?.id || null;
      if (process.env.NODE_ENV !== 'production' && !authUserId) {
        console.debug('[dashboardController] getStats: usuário não autenticado');
      }
      const stats = await dashboardService.getStats({ dateFrom, dateTo, authUserId });
      res.json({ success: true, stats });
    } catch (error) {
      console.error('[dashboardController] getStats:', error?.message || error);
      res.status(500).json({ success: false, error: 'Erro ao carregar dashboard', message: error?.message || String(error) });
    }
  },
};
