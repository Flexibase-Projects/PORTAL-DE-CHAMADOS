import supabase from '../config/supabase.js';

export const dashboardService = {
  async getStats() {
    // Total por status
    const { data: tickets, error } = await supabase
      .from('PDC_tickets')
      .select('id, status, area_destino, created_at');

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
      const count = all.filter(t => t.created_at.startsWith(dateStr)).length;
      por_dia.push({
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        count,
      });
    }

    // Recentes
    const { data: recentes } = await supabase
      .from('PDC_tickets')
      .select(`*, solicitante:PDC_users!solicitante_id(nome, email)`)
      .order('created_at', { ascending: false })
      .limit(10);

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
