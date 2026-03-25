import type { TicketStatus } from "@/types/ticket";

/** Card "Total" do dashboard. */
export const DASHBOARD_TOTAL_BLUE = "#0ea5e9";

/** Mesmas cores dos cards de status do dashboard + calendário de lead time. */
/** Vermelho legível em cards e barras do calendário. */
export const STATUS_COLOR_ABERTO = "#dc2626";
/** Âmbar/amarelo legível sobre fundo claro (cards do dashboard). */
export const STATUS_COLOR_EM_ANDAMENTO = "#ca8a04";
/** Verde para concluído (substitui o cinza anterior). */
export const STATUS_COLOR_CONCLUIDO = "#16a34a";
/** Roxo para pausado (dashboard, calendário e gráficos). */
export const STATUS_COLOR_PAUSADO = "#9333ea";

/**
 * Mesmas cores do gradiente do velocímetro “Resolvidos” (ResolvidosGauge em Charts.tsx).
 * linearGradient x1→x2 equivale a ~90deg no CSS.
 */
export const DASHBOARD_GAUGE_GREEN_START = "#03ff6c";
export const DASHBOARD_GAUGE_GREEN_END = "#0E8C43";

export function dashboardGaugeGreenGradientCss(angleDeg: number = 90): string {
  return `linear-gradient(${angleDeg}deg, ${DASHBOARD_GAUGE_GREEN_START} 0%, ${DASHBOARD_GAUGE_GREEN_END} 100%)`;
}

export function statusColorForLeadBar(status: string): string {
  switch (status as TicketStatus) {
    case "Aberto":
      return STATUS_COLOR_ABERTO;
    case "Em Andamento":
      return STATUS_COLOR_EM_ANDAMENTO;
    case "Pausado":
      return STATUS_COLOR_PAUSADO;
    case "Concluído":
      return STATUS_COLOR_CONCLUIDO;
    default:
      return "#64748b";
  }
}

export function statusLabelForLegend(status: TicketStatus): string {
  switch (status) {
    case "Aberto":
      return "Aberto";
    case "Em Andamento":
      return "Em andamento";
    case "Pausado":
      return "Pausado";
    case "Concluído":
      return "Concluído";
    default:
      return status;
  }
}
