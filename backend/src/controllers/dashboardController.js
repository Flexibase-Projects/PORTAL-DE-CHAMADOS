import { dashboardService } from '../services/dashboardService.js';

export const dashboardController = {
  async getStats(req, res) {
    try {
      const stats = await dashboardService.getStats();
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas', message: error.message });
    }
  },
};
