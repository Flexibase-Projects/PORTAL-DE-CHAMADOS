import supabase from '../config/supabase.js';
import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const LOG_DIR = join(rootDir, '.cursor');
const LOG_PATH = join(LOG_DIR, 'debug.log');

/** Mapa departamento -> setor. Ex-Comercial alinhado ao frontend (em Administrativo). */
const DEPARTAMENTOS_POR_SETOR = {
  Administrativo: ['ASSESSORIA COMERCIAL', 'ASSESSORIA PRIVADO', 'CASAS DAS ATAS', 'COMPRAS', 'FINANCEIRO', 'GESTÃO COMERCIAL', 'LICITAÇÃO', 'MAP', 'MARKETING', 'RECEPÇÃO', 'REPRESENTANTES', 'RH', 'TI'],
  Industrial: ['ALMOXARIFADO', 'ENGENHARIA', 'EXPEDIÇÃO', 'GESTÃO INDUSTRIAL', 'MARCENARIA', 'MANUTENÇÃO', 'NOVOS PRODUTOS', 'PCP', 'QUALIDADE', 'RH', 'SEG. DO TRABALHO', 'SERRALHERIA', 'TAPEÇARIA'],
};

function getSetorByArea(area) {
  if (!area || typeof area !== 'string') return null;
  const d = area.trim().toUpperCase();
  for (const [setor, depts] of Object.entries(DEPARTAMENTOS_POR_SETOR)) {
    if (depts.some((x) => x.toUpperCase() === d)) return setor;
  }
  return null;
}

/** Agrupa tickets por mês (mes = "MMM/yy") e retorna array ordenado { mes, count }. */
function aggregateByMonth(ticketList, filterSetor = null) {
  const byMonth = {};
  ticketList.forEach((t) => {
    const setor = getSetorByArea(t.area_destino);
    if (filterSetor !== null && setor !== filterSetor) return;
    const created = t.created_at ? String(t.created_at).slice(0, 7) : null; // YYYY-MM
    if (!created) return;
    if (!byMonth[created]) byMonth[created] = 0;
    byMonth[created]++;
  });
  const sorted = Object.keys(byMonth).sort();
  const mesNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return sorted.map((ym) => {
    const [y, m] = ym.split('-').map(Number);
    const mesLabel = `${mesNames[m - 1]}/${String(y).slice(-2)}`;
    return { mes: mesLabel, count: byMonth[ym] };
  });
}

/** Agrega por mês apenas tickets no intervalo [dateFrom, dateTo] (YYYY-MM-DD). */
function aggregateByMonthInRange(ticketList, filterSetor, dateFrom, dateTo) {
  const filtered = ticketList.filter((t) => {
    const created = (t.created_at || '').toString().slice(0, 10);
    return created >= dateFrom && created <= dateTo;
  });
  return aggregateByMonth(filtered, filterSetor);
}

/** Contagem por setor para o donut. */
function aggregateBySetor(ticketList) {
  const counts = { Comercial: 0, Administrativo: 0, Industrial: 0 };
  ticketList.forEach((t) => {
    const setor = getSetorByArea(t.area_destino);
    if (setor && counts[setor] !== undefined) counts[setor]++;
  });
  return ['Comercial', 'Administrativo', 'Industrial']
    .map((setor) => ({ setor, count: counts[setor] }))
    .filter((x) => x.count > 0);
}
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
  async getStats(options = {}) {
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

    // Por dia: últimos 7 dias OU intervalo customizado (dateFrom, dateTo)
    const dateFrom = options.dateFrom ? String(options.dateFrom).slice(0, 10) : null;
    const dateTo = options.dateTo ? String(options.dateTo).slice(0, 10) : null;
    const useCustomRange = dateFrom && dateTo && dateFrom <= dateTo;

    const buildPorDia = (list, filterSetor = null) => {
      const out = [];
      if (useCustomRange) {
        const start = new Date(dateFrom);
        const end = new Date(dateTo);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const filtered = filterSetor
            ? list.filter(t => getSetorByArea(t.area_destino) === filterSetor)
            : list;
          const count = filtered.filter(t => (t.created_at || '').toString().startsWith(dateStr)).length;
          out.push({
            date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            count,
          });
        }
      } else {
        const hoje = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(hoje);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const filtered = filterSetor
            ? list.filter(t => getSetorByArea(t.area_destino) === filterSetor)
            : list;
          const count = filtered.filter(t => (t.created_at || '').toString().startsWith(dateStr)).length;
          out.push({
            date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            count,
          });
        }
      }
      return out;
    };
    const por_dia = buildPorDia(all);
    const por_dia_industria = buildPorDia(all, 'Industrial');
    const por_dia_administrativo = buildPorDia(all, 'Administrativo');

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

    const por_mes_geral = aggregateByMonth(all);
    const por_mes_industria = aggregateByMonth(all, 'Industrial');
    const por_mes_administrativo = aggregateByMonth(all, 'Administrativo');
    const por_setor = aggregateBySetor(all);

    const out = {
      total,
      abertos,
      em_andamento,
      concluidos,
      por_departamento,
      por_dia,
      por_dia_industria,
      por_dia_administrativo,
      recentes: (recentes || []).map(t => ({
        ...t,
        solicitante_nome: t.solicitante?.nome,
        solicitante_email: t.solicitante?.email,
      })),
      por_mes_geral,
      por_mes_industria,
      por_mes_administrativo,
      por_setor,
    };
    if (useCustomRange) {
      out.por_mes_geral_range = aggregateByMonthInRange(all, null, dateFrom, dateTo);
      out.por_mes_industria_range = aggregateByMonthInRange(all, 'Industrial', dateFrom, dateTo);
      out.por_mes_administrativo_range = aggregateByMonthInRange(all, 'Administrativo', dateFrom, dateTo);
    }
    return out;
  },
};
