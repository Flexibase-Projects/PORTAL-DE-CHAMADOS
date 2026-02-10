import { dashboardService } from '../services/dashboardService.js';
import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '../../..');
const LOG_DIR = join(rootDir, '.cursor');
const LOG_PATH = join(LOG_DIR, 'debug.log');
const DBG = (msg, data, hypothesisId) => {
  const payload = { location: 'dashboardController.js', message: msg, data: data || {}, hypothesisId, timestamp: Date.now() };
  const line = JSON.stringify(payload) + '\n';
  try { if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true }); appendFileSync(LOG_PATH, line); } catch (_) {}
  if (process.env.DEBUG_DASHBOARD) console.log('[DBG]', payload);
  fetch('http://127.0.0.1:7242/ingest/176f700b-f851-4563-bfe2-b8f27d41c301', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location: 'dashboardController.js', message: msg, data: data || {}, hypothesisId, timestamp: Date.now() }),
  }).catch(() => {});
};

export const dashboardController = {
  async getStats(req, res) {
    // #region agent log
    DBG('getStats entry', {}, 'H1');
    // #endregion
    try {
      const { dateFrom, dateTo } = req.query || {};
      const stats = await dashboardService.getStats({ dateFrom, dateTo });
      // #region agent log
      DBG('getStats success', { hasStats: !!stats }, 'H1');
      // #endregion
      res.json({ success: true, stats });
    } catch (error) {
      // #region agent log
      DBG('getStats catch', {
        message: error?.message,
        stack: error?.stack?.slice(0, 300),
        name: error?.name,
      }, 'H1');
      // #endregion
      res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas', message: error.message });
    }
  },
};
