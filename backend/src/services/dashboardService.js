import supabase from '../config/supabase.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { permissionService } from './permissionService.js';

/** Alinhado ao frontend: Comercial vazio no picker; deptos comerciais em Administrativo; dashboard agrega Comercial em Administrativo. */
const DEPARTAMENTOS_POR_SETOR = {
  Comercial: [],
  Administrativo: [
    'ASSESSORIA COMERCIAL',
    'ASSESSORIA PRIVADO',
    'CASAS DAS ATAS',
    'COMPRAS',
    'FINANCEIRO',
    'GESTÃO COMERCIAL',
    'LICITAÇÃO',
    'MAP',
    'MARKETING',
    'RECEPÇÃO',
    'REPRESENTANTES',
    'RH',
    'TI',
  ],
  Industrial: ['ALMOXARIFADO', 'ENGENHARIA', 'EXPEDIÇÃO', 'GESTÃO INDUSTRIAL', 'MARCENARIA', 'MANUTENÇÃO', 'NOVOS PRODUTOS', 'PCP', 'QUALIDADE', 'RH', 'SEG. DO TRABALHO', 'SERRALHERIA', 'TAPEÇARIA'],
};

const ORDEM_SETOR = ['Comercial', 'Administrativo', 'Industrial'];

function getSetorByArea(area) {
  if (!area || typeof area !== 'string') return null;
  const d = area.trim().toUpperCase();
  for (const setor of ORDEM_SETOR) {
    const depts = DEPARTAMENTOS_POR_SETOR[setor] || [];
    if (depts.some((x) => x.toUpperCase() === d)) return setor;
  }
  return null;
}

/** Donut e filtros globais: só Administrativo + Industrial (Comercial soma em Administrativo). */
function getSetorParaDashboard(area) {
  const s = getSetorByArea(area);
  if (s === 'Industrial') return 'Industrial';
  if (s === 'Administrativo' || s === 'Comercial') return 'Administrativo';
  return null;
}

const mesNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function ticketsForDashboardSetor(ticketList, filterSetor) {
  if (filterSetor == null) return ticketList;
  return ticketList.filter(
    (t) => getSetorParaDashboard(t.solicitante?.departamento ?? t.area_destino) === filterSetor
  );
}

function toDateStrDash(x) {
  return (x || '').toString().slice(0, 10);
}

/** Saldo ao fim de `dateStr`: criados até a data e ainda não concluídos naquele momento (inclui Pausado, Aberto, Em Andamento). */
function saldoNaoConcluidosAteData(base, dateStr) {
  return base.filter((t) => {
    const created = toDateStrDash(t.created_at);
    if (created > dateStr) return false;
    if (t.status !== 'Concluído' || !t.closed_at) return true;
    const closed = toDateStrDash(t.closed_at);
    return closed > dateStr;
  }).length;
}

function lastDayOfMonthString(ym) {
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(y, m, 0);
  return `${y}-${String(m).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
}

/** Snapshot alinhado ao gráfico por dia: tickets com status Pausado e criação até a data. */
function pausadosSnapshotAteData(base, dateStr) {
  return base.filter((t) => t.status === 'Pausado' && toDateStrDash(t.created_at) <= dateStr).length;
}

function expandMonthRange(sortedYms) {
  if (sortedYms.length === 0) return [];
  const toIdx = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    return y * 12 + m - 1;
  };
  const fromIdx = (idx) => {
    const m = (idx % 12) + 1;
    const y = Math.floor(idx / 12);
    return `${y}-${String(m).padStart(2, '0')}`;
  };
  const lo = toIdx(sortedYms[0]);
  const hi = toIdx(sortedYms[sortedYms.length - 1]);
  const out = [];
  for (let i = lo; i <= hi; i++) out.push(fromIdx(i));
  return out;
}

/**
 * Agrupa por mês: fechados = concluídos naquele mês; abertos = saldo não concluídos no último dia do mês (inclui pausados);
 * pausados = subset em Pausado na mesma data de corte. Usa departamento de origem (solicitante).
 */
function aggregateByMonth(ticketList, filterSetor = null) {
  const byMonthFechados = {};
  const monthSet = new Set();
  ticketList.forEach((t) => {
    const setor = getSetorParaDashboard(t.solicitante?.departamento ?? t.area_destino);
    if (filterSetor !== null && setor !== filterSetor) return;
    const created = t.created_at ? String(t.created_at).slice(0, 7) : null;
    if (created) monthSet.add(created);
    if (t.status === 'Concluído' && t.closed_at) {
      const closed = String(t.closed_at).slice(0, 7);
      if (closed) {
        byMonthFechados[closed] = (byMonthFechados[closed] || 0) + 1;
        monthSet.add(closed);
      }
    }
    if (t.status === 'Pausado' && created) monthSet.add(created);
  });
  const base = ticketsForDashboardSetor(ticketList, filterSetor);
  const sortedMonths = expandMonthRange([...monthSet].sort());
  return sortedMonths.map((ym) => {
    const [y, m] = ym.split('-').map(Number);
    const mesLabel = `${String(m).padStart(2, '0')}. ${mesNames[m - 1]}`;
    const endStr = lastDayOfMonthString(ym);
    return {
      mes: mesLabel,
      ym,
      abertos: saldoNaoConcluidosAteData(base, endStr),
      fechados: byMonthFechados[ym] || 0,
      pausados: pausadosSnapshotAteData(base, endStr),
    };
  });
}

/** Agrega por mês no intervalo [dateFrom, dateTo]; filtra meses dentro do range. */
function aggregateByMonthInRange(ticketList, filterSetor, dateFrom, dateTo) {
  const rangeStart = dateFrom.slice(0, 7);
  const rangeEnd = dateTo.slice(0, 7);
    return aggregateByMonth(ticketList, filterSetor)
    .filter((row) => row.ym >= rangeStart && row.ym <= rangeEnd)
    .map(({ mes, ym, abertos, fechados, pausados }) => ({
      mesKey: ym,
      mes: `${mes} ${ym.slice(0, 4)}`,
      abertos,
      fechados,
      pausados,
    }));
}

/** Contagem por setor para o donut. Usa departamento de origem (solicitante). */
function aggregateBySetor(ticketList) {
  const counts = { Administrativo: 0, Industrial: 0 };
  ticketList.forEach((t) => {
    const setor = getSetorParaDashboard(t.solicitante?.departamento ?? t.area_destino);
    if (setor && counts[setor] !== undefined) counts[setor]++;
  });
  return ['Administrativo', 'Industrial']
    .map((setor) => ({ setor, count: counts[setor] }))
    .filter((x) => x.count > 0);
}

/** Top usuários que mais abriram chamados no conjunto filtrado (permissão + período). */
function aggregateTopSolicitantes(ticketList, limit = 25) {
  const map = new Map();
  ticketList.forEach((t) => {
    const sid = t.solicitante_id;
    if (!sid) return;
    const nome = (t.solicitante?.nome || '').trim() || 'Usuário';
    const dept = (t.solicitante?.departamento || '').trim();
    if (!map.has(sid)) {
      map.set(sid, { usuario_id: sid, nome, departamento_origem: dept, count: 0 });
    }
    map.get(sid).count += 1;
  });
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}
const DBG = (msg, data) => {
  if (process.env.DEBUG_DASHBOARD) {
    console.log('[dashboardService]', msg, data || {});
  }
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
const DEFAULT_HISTORY_DAYS = 120;

function getStatsCacheKey(options) {
  const dateFrom = options.dateFrom ? String(options.dateFrom).slice(0, 10) : null;
  const dateTo = options.dateTo ? String(options.dateTo).slice(0, 10) : null;
  const authUserId = options.authUserId ? String(options.authUserId) : 'anon';
  const rangeKey = dateFrom && dateTo && dateFrom <= dateTo ? `range:${dateFrom}:${dateTo}` : 'default';
  return `${authUserId}:${rangeKey}`;
}

export const dashboardService = {
  clearStatsCache() {
    statsCache.key = null;
    statsCache.value = null;
    statsCache.expiresAt = 0;
  },

  async getStats(options = {}) {
    const cacheKey = getStatsCacheKey(options);
    const now = Date.now();
    if (statsCache.key === cacheKey && statsCache.expiresAt > now) {
      return statsCache.value;
    }

    DBG('getStats entry', {});

    const dateFrom = options.dateFrom ? String(options.dateFrom).slice(0, 10) : null;
    const dateTo = options.dateTo ? String(options.dateTo).slice(0, 10) : null;
    const useCustomRange = dateFrom && dateTo && dateFrom <= dateTo;
    const client = supabaseAdmin || supabase;
    /** Dashboard mostra chamados cujo area_destino é o departamento do usuário (PDC_users.departamento). */
    const authUserId = options.authUserId;
    if (!authUserId) {
      const empty = {
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
      statsCache.key = cacheKey;
      statsCache.value = empty;
      statsCache.expiresAt = Date.now() + STATS_CACHE_TTL_MS;
      return empty;
    }

    const { data, error } = await client.rpc('pdc_dashboard_stats', {
      p_auth_user_id: authUserId,
      p_date_from: useCustomRange ? dateFrom : null,
      p_date_to: useCustomRange ? dateTo : null,
    });
    if (error) throw new Error(error.message);
    const out = data || {
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

    statsCache.key = cacheKey;
    statsCache.value = out;
    statsCache.expiresAt = Date.now() + STATS_CACHE_TTL_MS;
    return out;
  },
};
