import supabase from '../config/supabase.js';
import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const LOG_DIR = join(rootDir, '.cursor');
const LOG_PATH = join(LOG_DIR, 'debug.log');
const DBG = (msg, data, hypothesisId) => {
  const payload = { location: 'dashboardService.js', message: msg, data: data || {}, hypothesisId, timestamp: Date.now() };
  const line = JSON.stringify(payload) + '\n';
  try { if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true }); appendFileSync(LOG_PATH, line); } catch (_) {}
  if (process.env.DEBUG_DASHBOARD) console.log('[DBG]', payload);
  fetch('http://127.0.0.1:7242/ingest/176f700b-f851-4563-bfe2-b8f27d41c301', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location: 'dashboardService.js', message: msg, data: data || {}, hypothesisId, timestamp: Date.now() }),
  }).catch(() => {});
};

export const dashboardService = {
  async getStats() {
    // #region agent log
    DBG('getStats entry', {}, 'H1');
    // #endregion
    // Total por status
    const { data: tickets, error } = await supabase
      .from('PDC_tickets')
      .select('id, status, area_destino, created_at');

    // #region agent log
    DBG('first query done', { error: error?.message, ticketsLen: (tickets || []).length, sampleCreatedAt: tickets?.[0]?.created_at, sampleCreatedAtType: typeof tickets?.[0]?.created_at }, 'H1,H2,H3,H4');
    // #endregion
    if (error) throw new Error(error.message);

    const all = tickets || [];
    const total = all.length;
    const abertos = all.filter(t => t.status === 'Aberto').length;
    const em_andamento = all.filter(t => t.status === 'Em Andamento').length;
    const concluidos = all.filter(t => t.status === 'Concluído').length;

    // Por departamento
    const deptCounts = {};
    all.forEach(t => {
      deptCounts[t.area_destino] = (deptCounts[t.area_destino] || 0) + 1;
    });
    const por_departamento = Object.entries(deptCounts)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);

    // Por dia (últimos 7 dias)
    const hoje = new Date();
    const por_dia = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      // #region agent log
      const firstT = all[0];
      if (i === 6 && firstT) DBG('por_dia loop', { dateStr, firstCreatedAt: firstT.created_at, firstCreatedAtType: typeof firstT.created_at }, 'H3');
      // #endregion
      const count = all.filter(t => t.created_at.startsWith(dateStr)).length;
      por_dia.push({
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        count,
      });
    }

    // Recentes
    // #region agent log
    DBG('before recentes query', {}, 'H2');
    // #endregion
    const { data: recentes, error: recentesError } = await supabase
      .from('PDC_tickets')
      .select(`*, solicitante:PDC_users!solicitante_id(nome, email)`)
      .order('created_at', { ascending: false })
      .limit(10);

    // #region agent log
    DBG('recentes query done', { recentesError: recentesError?.message, recentesLen: (recentes || []).length }, 'H2');
    // #endregion

    return {
      total,
      abertos,
      em_andamento,
      concluidos,
      por_departamento,
      por_dia,
      recentes: (recentes || []).map(t => ({
        ...t,
        solicitante_nome: t.solicitante?.nome,
        solicitante_email: t.solicitante?.email,
      })),
    };
  },
};
