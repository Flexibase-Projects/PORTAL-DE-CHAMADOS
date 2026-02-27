/** Chave do período selecionado no dashboard (aplica a todos os gráficos). */
export type PeriodKey =
  | "7d"
  | "mes_atual"
  | "mes_anterior"
  | "ano_atual"
  | "ano_anterior"
  | "custom";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  "7d": "Últimos 7 dias",
  mes_atual: "Mês atual",
  mes_anterior: "Mês anterior",
  ano_atual: "Ano atual",
  ano_anterior: "Ano anterior",
  custom: "Intervalo customizado",
};

const todayStr = () => new Date().toISOString().split("T")[0];

/** Retorna dateFrom e dateTo (YYYY-MM-DD) para o período. Para "custom" retorna null. */
export function getDateRangeForPeriod(
  key: PeriodKey
): { dateFrom: string; dateTo: string } | null {
  const today = new Date();
  const to = todayStr();
  if (key === "custom") return null;
  let from: string;
  if (key === "7d") {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    from = d.toISOString().split("T")[0];
  } else if (key === "mes_atual") {
    from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  } else if (key === "mes_anterior") {
    const y = today.getFullYear();
    const m = today.getMonth();
    const firstPrev = new Date(y, m - 1, 1);
    const lastPrev = new Date(y, m, 0);
    from = firstPrev.toISOString().split("T")[0];
    return { dateFrom: from, dateTo: lastPrev.toISOString().split("T")[0] };
  } else if (key === "ano_anterior") {
    const y = today.getFullYear() - 1;
    from = `${y}-01-01`;
    return { dateFrom: from, dateTo: `${y}-12-31` };
  } else {
    from = `${today.getFullYear()}-01-01`;
  }
  return { dateFrom: from, dateTo: to };
}
