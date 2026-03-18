import supabase from '../config/supabase.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { permissionService } from './permissionService.js';
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

const mesNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Agrupa tickets por mês: { mes, abertos, fechados }. Usa departamento de origem (solicitante). */
function aggregateByMonth(ticketList, filterSetor = null) {
  const byMonthAbertos = {};
  const byMonthFechados = {};
  ticketList.forEach((t) => {
    const setor = getSetorByArea(t.solicitante?.departamento ?? t.area_destino);
    if (filterSetor !== null && setor !== filterSetor) return;
    const created = t.created_at ? String(t.created_at).slice(0, 7) : null;
    if (created) {
      byMonthAbertos[created] = (byMonthAbertos[created] || 0) + 1;
    }
    if (t.status === 'Concluído' && t.closed_at) {
      const closed = String(t.closed_at).slice(0, 7);
      if (closed) byMonthFechados[closed] = (byMonthFechados[closed] || 0) + 1;
    }
  });
  const allMonths = new Set([...Object.keys(byMonthAbertos), ...Object.keys(byMonthFechados)]);
  const sorted = [...allMonths].sort();
  return sorted.map((ym) => {
    const [y, m] = ym.split('-').map(Number);
    const mesLabel = `${String(m).padStart(2, '0')}. ${mesNames[m - 1]}`;
    return {
      mes: mesLabel,
      ym,
      abertos: byMonthAbertos[ym] || 0,
      fechados: byMonthFechados[ym] || 0,
    };
  });
}

/** Agrega por mês no intervalo [dateFrom, dateTo]; filtra meses dentro do range. */
function aggregateByMonthInRange(ticketList, filterSetor, dateFrom, dateTo) {
  const rangeStart = dateFrom.slice(0, 7);
  const rangeEnd = dateTo.slice(0, 7);
    return aggregateByMonth(ticketList, filterSetor)
    .filter((row) => row.ym >= rangeStart && row.ym <= rangeEnd)
    .map(({ mes, ym, abertos, fechados }) => ({
      mesKey: ym,
      mes: `${mes} ${ym.slice(0, 4)}`,
      abertos,
      fechados,
    }));
}

/** Contagem por setor para o donut. Usa departamento de origem (solicitante). */
function aggregateBySetor(ticketList) {
  const counts = { Comercial: 0, Administrativo: 0, Industrial: 0 };
  ticketList.forEach((t) => {
    const setor = getSetorByArea(t.solicitante?.departamento ?? t.area_destino);
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

/** Retorna Set com o departamento do usuário (PDC_users.departamento). Visibilidade sem exigir PDC_user_permissions. */
async function getPermittedDepartmentsForDashboard(authUserId) {
  const { userDepartamento } = await permissionService.getByAuthUserId(authUserId);
  const set = new Set();
  if (userDepartamento?.trim()) set.add(userDepartamento.trim().toUpperCase());
  return set;
}

/** Cache em memória para getStats: TTL 60s. Chave por opções (default vs dateFrom/dateTo) e authUserId. */
const STATS_CACHE_TTL_MS = 60 * 1000;
const statsCache = { key: null, value: null, expiresAt: 0 };

function getStatsCacheKey(options) {
  const dateFrom = options.dateFrom ? String(options.dateFrom).slice(0, 10) : null;
  const dateTo = options.dateTo ? String(options.dateTo).slice(0, 10) : null;
  const authUserId = options.authUserId ? String(options.authUserId) : 'anon';
  const rangeKey = dateFrom && dateTo && dateFrom <= dateTo ? `range:${dateFrom}:${dateTo}` : 'default';
  return `${authUserId}:${rangeKey}`;
}

export const dashboardService = {
  async getStats(options = {}) {
    const cacheKey = getStatsCacheKey(options);
    const now = Date.now();
    if (statsCache.key === cacheKey && statsCache.expiresAt > now) {
      return statsCache.value;
    }

    // #region agent log
    DBG('getStats entry', {}, 'H1');
    // #endregion

    const dateFrom = options.dateFrom ? String(options.dateFrom).slice(0, 10) : null;
    const dateTo = options.dateTo ? String(options.dateTo).slice(0, 10) : null;
    const useCustomRange = dateFrom && dateTo && dateFrom <= dateTo;

    const client = supabaseAdmin || supabase;
    const [ticketsResult, recentesResult] = await Promise.all([
      client.from('PDC_tickets').select('id, status, area_destino, created_at, closed_at, solicitante:PDC_users!solicitante_id(departamento)'),
      client.from('PDC_tickets').select(`*, solicitante:PDC_users!solicitante_id(nome, email, departamento)`).order('created_at', { ascending: false }).limit(10),
    ]);

    const { data: tickets, error } = ticketsResult;
    const { data: recentes, error: recentesError } = recentesResult;

    DBG('queries done', { error: error?.message, ticketsLen: (tickets || []).length, recentesError: recentesError?.message, recentesLen: (recentes || []).length }, 'H1,H2,H3,H4');

    if (error) throw new Error(error.message);

    let all = tickets || [];
    let recentesParaStats = recentes || [];
    /** Dashboard mostra chamados cujo area_destino é o departamento do usuário (PDC_users.departamento), sem exigir permissões. */
    const authUserId = options.authUserId;
    if (authUserId) {
      const permittedSet = await getPermittedDepartmentsForDashboard(authUserId);
      const areaMatch = (area) => permittedSet.has((area || '').trim().toUpperCase());
      all = all.filter((t) => areaMatch(t.area_destino));
      recentesParaStats = (recentes || []).filter((t) => areaMatch(t.area_destino));
    } else {
      /** Sem usuário autenticado: não exibir dados de outros departamentos. */
      all = [];
      recentesParaStats = [];
    }

    /** Quando useCustomRange, todas as estatísticas usam apenas tickets no intervalo. */
    const listForStats = useCustomRange
      ? all.filter((t) => {
          const created = (t.created_at || '').toString().slice(0, 10);
          return created >= dateFrom && created <= dateTo;
        })
      : all;

    const total = listForStats.length;
    const abertos = listForStats.filter(t => t.status === 'Aberto').length;
    const em_andamento = listForStats.filter(t => t.status === 'Em Andamento').length;
    const concluidos = listForStats.filter(t => t.status === 'Concluído').length;

    const areaOrigem = (t) => (t.solicitante?.departamento ?? t.area_destino ?? '').trim() || '(sem área)';
    const deptCounts = {};
    listForStats.forEach(t => {
      const area = areaOrigem(t);
      deptCounts[area] = (deptCounts[area] || 0) + 1;
    });
    const por_departamento = Object.entries(deptCounts)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);

    /** Por dia: "abertos" = saldo de abertos ao fim do dia (criados até o dia - fechados até o dia); "fechados" = quantidade fechada naquele dia. */
    const buildPorDia = (list, filterSetor = null) => {
      const base = filterSetor
        ? list.filter(t => getSetorByArea(t.solicitante?.departamento ?? t.area_destino) === filterSetor)
        : list;
      const out = [];
      const toDateStr = (x) => (x || '').toString().slice(0, 10);
      const fechadosNoDia = (dateStr) =>
        base.filter(t => t.status === 'Concluído' && t.closed_at && toDateStr(t.closed_at) === dateStr).length;
      const saldoAbertosFimDoDia = (dateStr) =>
        base.filter((t) => {
          const created = toDateStr(t.created_at);
          if (created > dateStr) return false;
          if (t.status !== 'Concluído' || !t.closed_at) return true;
          const closed = toDateStr(t.closed_at);
          return closed > dateStr;
        }).length;

      if (useCustomRange) {
        const parseYMD = (s) => {
          const p = String(s).slice(0, 10).split('-').map(Number);
          return { y: p[0], m: p[1], d: p[2] };
        };
        let { y, m, d } = parseYMD(dateFrom);
        const endYMD = parseYMD(dateTo);
        for (;;) {
          const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (dateStr < dateFrom.slice(0, 10) || dateStr > dateTo.slice(0, 10)) break;
          const loc = new Date(y, m - 1, d);
          out.push({
            dateKey: dateStr,
            date: loc.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
            abertos: saldoAbertosFimDoDia(dateStr),
            fechados: fechadosNoDia(dateStr),
          });
          if (dateStr === dateTo.slice(0, 10)) break;
          loc.setDate(loc.getDate() + 1);
          y = loc.getFullYear();
          m = loc.getMonth() + 1;
          d = loc.getDate();
        }
      } else {
        const hoje = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(hoje);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          out.push({
            date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            abertos: saldoAbertosFimDoDia(dateStr),
            fechados: fechadosNoDia(dateStr),
          });
        }
      }
      return out;
    };
    const por_dia = buildPorDia(all);
    const por_dia_industria = buildPorDia(all, 'Industrial');
    const por_dia_administrativo = buildPorDia(all, 'Administrativo');

    const por_mes_geral = aggregateByMonth(all);
    const por_mes_industria = aggregateByMonth(all, 'Industrial');
    const por_mes_administrativo = aggregateByMonth(all, 'Administrativo');
    const por_setor = aggregateBySetor(listForStats);

    /** Recentes: quando há período, filtrar por data e pegar os 10 mais recentes no intervalo. */
    const recentesRaw = recentesParaStats;
    const recentesFiltered = useCustomRange
      ? recentesRaw
          .filter((t) => {
            const created = (t.created_at || '').toString().slice(0, 10);
            return created >= dateFrom && created <= dateTo;
          })
          .slice(0, 10)
      : recentesRaw.slice(0, 10);

    const out = {
      total,
      abertos,
      em_andamento,
      concluidos,
      por_departamento,
      por_dia,
      por_dia_industria,
      por_dia_administrativo,
      recentes: recentesFiltered.map(t => ({
        ...t,
        solicitante_nome: t.solicitante?.nome,
        solicitante_email: t.solicitante?.email,
        departamento_origem: (t.solicitante?.departamento || '').trim() || t.area_destino || '—',
      })),
      por_mes_geral,
      por_mes_industria,
      por_mes_administrativo,
      por_setor,
    };
    if (useCustomRange) {
      out.por_mes_geral_range = aggregateByMonthInRange(listForStats, null, dateFrom, dateTo);
      out.por_mes_industria_range = aggregateByMonthInRange(listForStats, 'Industrial', dateFrom, dateTo);
      out.por_mes_administrativo_range = aggregateByMonthInRange(listForStats, 'Administrativo', dateFrom, dateTo);
    }

    statsCache.key = cacheKey;
    statsCache.value = out;
    statsCache.expiresAt = Date.now() + STATS_CACHE_TTL_MS;
    return out;
  },
};
