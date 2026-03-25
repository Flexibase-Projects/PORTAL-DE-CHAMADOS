import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { alpha, useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { ChartFullscreenDialog } from "@/features/dashboard/components/ChartFullscreenDialog";
import { TicketStatusTimelineDialog } from "@/features/tickets/components/TicketStatusTimelineDialog";
import { formatDate } from "@/lib/utils";
import { ticketService } from "@/services/ticketService";
import { localStorageStorage } from "@/storage/localStorageStorage";
import { useAuth } from "@/contexts/AuthContext";
import type { Ticket } from "@/types/ticket";
import {
  DASHBOARD_GAUGE_GREEN_END,
  DASHBOARD_GAUGE_GREEN_START,
  STATUS_COLOR_ABERTO,
  STATUS_COLOR_CONCLUIDO,
  STATUS_COLOR_EM_ANDAMENTO,
  STATUS_COLOR_PAUSADO,
  statusColorForLeadBar,
  statusLabelForLegend,
} from "@/constants/ticketStatusColors";

const USE_LOCAL_STORAGE = import.meta.env.VITE_USE_LOCAL_STORAGE === "true";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

/** Máximo de faixas empilhadas por semana (cada faixa pode atravessar vários dias). */
const MAX_VISIBLE_LEAD_BARS = 15;

/** Recuo das faixas nas células (~8px), no estilo do mock. */
const LEAD_TRACK_CELL_INSET = 1;

const LEAD_BAR_HEIGHT_PX = 28;
/** Modo retraído: traços mínimos só para indicar presença de leads. */
const COLLAPSED_LEAD_BAR_HEIGHT_PX = 6;
const COLLAPSED_VISIBLE_LEAD_CAP = 10;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function firstOfMonth(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}

function startOfWeekSunday(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return x;
}

/**
 * Converte timestamp ISO (ou YYYY-MM-DD) no dia civil **local** do usuário.
 * Evita misturar data UTC (`toISOString`) com a grade do calendário (local).
 */
function parseYmd(iso: string | undefined): Date | null {
  if (!iso) return null;
  const s = String(iso).trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (dateOnly) {
    const y = Number(dateOnly[1]);
    const m = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    if (!y || !m || !day) return null;
    return startOfDay(new Date(y, m - 1, day));
  }
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return null;
  return startOfDay(new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
}

function formatMonthYearLabel(d: Date): string {
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function formatDayHeading(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Chave YYYY-MM-DD no fuso local (nunca UTC via toISOString). */
function dateKey(d: Date): string {
  const x = startOfDay(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Diferença em dias civis locais entre `from` e `to` (ignora hora; estável com DST). */
function localCalendarDaysBetween(from: Date, to: Date): number {
  const a = startOfDay(from);
  const b = startOfDay(to);
  const ta = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const tb = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((tb - ta) / 86400000);
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Lead time: abertura até fechamento ou hoje. */
function ticketLeadRange(t: Ticket, today: Date): { start: Date; end: Date } | null {
  const created = parseYmd(t.created_at);
  if (!created) return null;
  let end = startOfDay(today);
  if (t.status === "Concluído" && t.closed_at) {
    const c = parseYmd(t.closed_at);
    if (c) end = c;
  }
  if (end.getTime() < created.getTime()) end = created;
  return { start: created, end };
}

type MonthCell = { date: Date; inMonth: boolean };

function buildMonthGrid(monthAny: Date): MonthCell[] {
  const first = firstOfMonth(monthAny);
  const y = first.getFullYear();
  const m = first.getMonth();
  const lastCal = new Date(y, m + 1, 0);
  const gridStart = startOfWeekSunday(first);
  const gridEndWeekStart = startOfWeekSunday(lastCal);
  const gridEnd = startOfDay(new Date(gridEndWeekStart));
  gridEnd.setDate(gridEnd.getDate() + 6);

  const cells: MonthCell[] = [];
  const cur = new Date(gridStart);
  while (cur.getTime() <= gridEnd.getTime()) {
    cells.push({
      date: new Date(cur),
      inMonth: cur.getMonth() === m && cur.getFullYear() === y,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return cells;
}

function chunkWeeks(cells: MonthCell[]): MonthCell[][] {
  const weeks: MonthCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

type DayLeadItem = {
  ticket: Ticket;
  color: string;
  label: string;
};

/** Chamados cujo lead time intersecta o dia civil `day` (aberto naquele dia ou atravessando-o). */
function ticketsActiveOnCalendarDay(tickets: Ticket[], day: Date, today: Date): DayLeadItem[] {
  const d = startOfDay(day).getTime();
  const out: DayLeadItem[] = [];

  for (const t of tickets) {
    const r = ticketLeadRange(t, today);
    if (!r) continue;
    if (r.end.getTime() < d || r.start.getTime() > d) continue;

    out.push({
      ticket: t,
      color: statusColorForLeadBar(t.status),
      label: (t.assunto || "Sem assunto").trim() || "Sem assunto",
    });
  }

  out.sort((a, b) => new Date(a.ticket.created_at).getTime() - new Date(b.ticket.created_at).getTime());
  return out;
}

type BarSlice = {
  ticket: Ticket;
  startCol: number;
  endCol: number;
  color: string;
  label: string;
};

/** Trechos visíveis na semana (dom–sáb): uma barra por chamado, colunas = dias da semana. */
function ticketsOverlappingWeek(tickets: Ticket[], weekStart: Date, today: Date): BarSlice[] {
  const ws = startOfDay(weekStart).getTime();
  const we = new Date(ws);
  we.setDate(we.getDate() + 7);
  const weekEndMs = we.getTime() - 1;

  const out: BarSlice[] = [];

  for (const t of tickets) {
    const r = ticketLeadRange(t, today);
    if (!r) continue;

    const startMs = r.start.getTime();
    const endMs = r.end.getTime();
    if (endMs < ws || startMs > weekEndMs) continue;

    const visStart = new Date(Math.max(startMs, ws));
    const visEnd = new Date(Math.min(endMs, weekEndMs));
    const w0 = startOfDay(weekStart);
    const startCol = localCalendarDaysBetween(w0, visStart);
    const endCol = localCalendarDaysBetween(w0, visEnd);
    const sc = Math.max(0, Math.min(6, startCol));
    const ec = Math.max(0, Math.min(6, endCol));
    if (sc > ec) continue;

    out.push({
      ticket: t,
      startCol: sc,
      endCol: ec,
      color: statusColorForLeadBar(t.status),
      label: (t.assunto || "Sem assunto").trim() || "Sem assunto",
    });
  }

  out.sort((a, b) => new Date(a.ticket.created_at).getTime() - new Date(b.ticket.created_at).getTime());
  return out;
}

/** Texto sobre fundo pastel do corpo da pílula (mock). */
function barLabelColor(_barColor: string): string {
  return "rgba(0,0,0,0.82)";
}

function barLabelSx(barColor: string, theme: Theme) {
  const fg =
    theme.palette.mode === "dark"
      ? theme.palette.grey[100]
      : barLabelColor(barColor);
  return { color: fg, lineHeight: 1.2, fontSize: "0.7rem" as const };
}

/**
 * Pílula: só gradiente suave (sem tarja escura à esquerda); concluído = cores do velocímetro em pastel.
 */
function leadBarBodyBackground(theme: Theme, barColor: string): string {
  const dark = theme.palette.mode === "dark";
  if (barColor === STATUS_COLOR_CONCLUIDO) {
    return dark
      ? `linear-gradient(90deg, ${alpha(DASHBOARD_GAUGE_GREEN_START, 0.38)} 0%, ${alpha(DASHBOARD_GAUGE_GREEN_END, 0.28)} 100%)`
      : `linear-gradient(90deg, ${alpha(DASHBOARD_GAUGE_GREEN_START, 0.34)} 0%, ${alpha(DASHBOARD_GAUGE_GREEN_END, 0.2)} 100%)`;
  }
  if (barColor === STATUS_COLOR_PAUSADO) {
    return dark
      ? `linear-gradient(90deg, ${alpha(STATUS_COLOR_PAUSADO, 0.42)} 0%, ${alpha(STATUS_COLOR_PAUSADO, 0.22)} 100%)`
      : `linear-gradient(90deg, ${alpha(STATUS_COLOR_PAUSADO, 0.28)} 0%, ${alpha(STATUS_COLOR_PAUSADO, 0.12)} 100%)`;
  }
  return dark
    ? `linear-gradient(90deg, ${alpha(barColor, 0.38)} 0%, ${alpha(barColor, 0.22)} 100%)`
    : `linear-gradient(90deg, ${alpha(barColor, 0.26)} 0%, ${alpha(barColor, 0.12)} 100%)`;
}

function leadBarOuterBorder(barColor: string, theme: Theme): string {
  if (barColor === STATUS_COLOR_CONCLUIDO) {
    return alpha(DASHBOARD_GAUGE_GREEN_END, theme.palette.mode === "dark" ? 0.45 : 0.28);
  }
  if (barColor === STATUS_COLOR_PAUSADO) {
    return alpha(STATUS_COLOR_PAUSADO, theme.palette.mode === "dark" ? 0.45 : 0.3);
  }
  return alpha(barColor, theme.palette.mode === "dark" ? 0.35 : 0.22);
}

/** Barra em pílula só com gradiente (sem faixa sólida escura). */
function LeadBarTrack({
  b,
  onOpen,
  gridRow,
  compact,
}: {
  b: BarSlice;
  onOpen: (id: string) => void;
  gridRow: number;
  /** Sem título; altura mínima (modo calendário retraído). */
  compact?: boolean;
}) {
  const theme = useTheme();
  const gridStart = b.startCol + 1;
  const gridEnd = b.endCol + 2;
  const h = compact ? COLLAPSED_LEAD_BAR_HEIGHT_PX : LEAD_BAR_HEIGHT_PX;
  const pillR = h / 2;

  return (
    <Box
      onClick={(e) => {
        e.stopPropagation();
        onOpen(b.ticket.id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onOpen(b.ticket.id);
        }
      }}
      sx={{
        gridColumn: `${gridStart} / ${gridEnd}`,
        gridRow,
        height: h,
        borderRadius: `${pillR}px`,
        mx: LEAD_TRACK_CELL_INSET,
        justifySelf: "stretch",
        width: "auto",
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        px: compact ? 0 : 0.85,
        cursor: "pointer",
        overflow: "hidden",
        border: compact
          ? `1px solid ${alpha(leadBarOuterBorder(b.color, theme), theme.palette.mode === "dark" ? 0.65 : 0.55)}`
          : `1px solid ${leadBarOuterBorder(b.color, theme)}`,
        backgroundImage: leadBarBodyBackground(theme, b.color),
        bgcolor: "transparent",
        transition: (t) =>
          t.transitions.create(["height", "padding", "border-radius", "filter"], {
            duration: 260,
            easing: t.transitions.easing.easeInOut,
          }),
        "@media (prefers-reduced-motion: reduce)": {
          transition: "filter 0.12s ease",
        },
        "&:hover": {
          filter: "brightness(1.03)",
        },
      }}
      aria-label={`Chamado: ${b.label}`}
      title={b.label}
    >
      {!compact && (
        <Typography variant="caption" fontWeight={600} noWrap sx={barLabelSx(b.color, theme)}>
          {b.label}
        </Typography>
      )}
    </Box>
  );
}

export function ChamadosLeadTimeCalendar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const dayDetailTitleId = useId();
  const [anchorDate, setAnchorDate] = useState(() => firstOfMonth(new Date()));
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailDayKey, setDetailDayKey] = useState<string | null>(null);
  const [timelineTicketId, setTimelineTicketId] = useState<string | null>(null);
  const [cellsCollapsed, setCellsCollapsed] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id && !USE_LOCAL_STORAGE) {
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (USE_LOCAL_STORAGE) {
        setTickets(localStorageStorage.getTickets());
        setLoading(false);
        return;
      }
      const res = await ticketService.getMeusChamadosByAuth(user?.id ?? undefined, user?.email ?? undefined);
      if (!res.success) {
        setTickets([]);
        return;
      }
      // Só chamados recebidos pelo departamento do usuário (area_destino), não os que ele abriu para outros.
      setTickets([...(res.chamadosMeuDepartamento ?? [])]);
    } catch {
      setError("Não foi possível carregar os chamados.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  const monthFirst = useMemo(() => firstOfMonth(anchorDate), [anchorDate]);
  const monthCells = useMemo(() => buildMonthGrid(monthFirst), [monthFirst]);
  const weeks = useMemo(() => chunkWeeks(monthCells), [monthCells]);

  const today = startOfDay(new Date());

  const dayTicketsMap = useMemo(() => {
    const m = new Map<string, DayLeadItem[]>();
    for (const cell of monthCells) {
      const key = dateKey(cell.date);
      m.set(key, ticketsActiveOnCalendarDay(tickets, cell.date, today));
    }
    return m;
  }, [monthCells, tickets, today]);

  const weeksWithBars = useMemo(() => {
    return weeks.map((row) => {
      const ws = startOfWeekSunday(row[0]!.date);
      return {
        weekKey: dateKey(ws),
        row,
        bars: ticketsOverlappingWeek(tickets, ws, today),
      };
    });
  }, [weeks, tickets, today]);

  const goPrev = () => {
    const d = firstOfMonth(anchorDate);
    d.setMonth(d.getMonth() - 1);
    setAnchorDate(d);
  };

  const goNext = () => {
    const d = firstOfMonth(anchorDate);
    d.setMonth(d.getMonth() + 1);
    setAnchorDate(d);
  };

  const goToday = () => {
    setAnchorDate(firstOfMonth(new Date()));
  };

  const openTicket = (id: string) => navigate(`/meus-chamados/${id}`);

  const openTicketFromDialog = useCallback(
    (id: string) => {
      setDetailDayKey(null);
      navigate(`/meus-chamados/${id}`);
    },
    [navigate]
  );

  const closeDetailDialog = useCallback(() => {
    setDetailDayKey(null);
  }, []);

  const detailDayItems = useMemo(() => {
    if (!detailDayKey) return [];
    return dayTicketsMap.get(detailDayKey) ?? [];
  }, [detailDayKey, dayTicketsMap]);

  const detailDayDate = useMemo(() => {
    if (!detailDayKey) return null;
    return parseYmd(detailDayKey);
  }, [detailDayKey]);

  const legendItems: { color: string; label: string }[] = [
    { color: STATUS_COLOR_ABERTO, label: statusLabelForLegend("Aberto") },
    { color: STATUS_COLOR_EM_ANDAMENTO, label: statusLabelForLegend("Em Andamento") },
    { color: STATUS_COLOR_PAUSADO, label: statusLabelForLegend("Pausado") },
    { color: STATUS_COLOR_CONCLUIDO, label: statusLabelForLegend("Concluído") },
  ];

  const dark = theme.palette.mode === "dark";
  const dashboardBlue = dark ? "#4f86ff" : "#111184";
  const dashboardBlueDark = dark ? "#60a5fa" : "#132937";
  const secondaryC = theme.palette.secondary;

  /** Botões da barra do calendário: borda primary suave, hover com secondary (harmonia com o restante do portal). */
  const calendarToolbarOutlinedSx: SxProps<Theme> = {
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.8125rem",
    borderRadius: "10px",
    py: 0.5,
    boxShadow: "none",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: alpha(dashboardBlue, dark ? 0.42 : 0.22),
    color: dark ? dashboardBlueDark : dashboardBlue,
    bgcolor: alpha(dashboardBlue, dark ? 0.12 : 0.06),
    "&:hover": {
      borderColor: secondaryC.main,
      bgcolor: alpha(secondaryC.main, dark ? 0.2 : 0.12),
      color: dark ? dashboardBlueDark : dashboardBlueDark,
    },
  };

  const calendarToolbarTodaySx: SxProps<Theme> = {
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.8125rem",
    borderRadius: "10px",
    py: 0.5,
    px: 1.5,
    color: dark ? secondaryC.light : secondaryC.dark,
    "&:hover": {
      bgcolor: alpha(secondaryC.main, dark ? 0.16 : 0.1),
    },
  };

  const periodTitle = formatMonthYearLabel(monthFirst);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={goPrev}
            aria-label="Mês anterior"
            sx={[calendarToolbarOutlinedSx, { minWidth: 40, px: 0.75 }] as SxProps<Theme>}
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </Button>
          <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 200, textAlign: "center", textTransform: "capitalize" }}>
            {periodTitle}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={goNext}
            aria-label="Próximo mês"
            sx={[calendarToolbarOutlinedSx, { minWidth: 40, px: 0.75 }] as SxProps<Theme>}
          >
            <ChevronRight size={20} strokeWidth={2} />
          </Button>
          <Button size="small" variant="text" onClick={goToday} sx={calendarToolbarTodaySx}>
            Hoje
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setCellsCollapsed((v) => !v)}
            startIcon={cellsCollapsed ? <Maximize2 size={16} strokeWidth={2} /> : <Minimize2 size={16} strokeWidth={2} />}
            sx={[calendarToolbarOutlinedSx, { px: 1.25 }] as SxProps<Theme>}
          >
            {cellsCollapsed ? "Expandir células" : "Retrair células"}
          </Button>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
          {legendItems.map((item) => (
            <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box
                sx={{
                  width: 24,
                  height: 11,
                  borderRadius: "6px",
                  flexShrink: 0,
                  overflow: "hidden",
                  border: `1px solid ${leadBarOuterBorder(item.color, theme)}`,
                  backgroundImage: leadBarBodyBackground(theme, item.color),
                  bgcolor: "transparent",
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          borderRadius: 1.25,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === "dark" ? theme.palette.background.paper : "#ffffff",
        }}
      >
        <Box
          sx={{
            height: 10,
            background: `linear-gradient(90deg, ${dashboardBlue} 0%, ${dashboardBlueDark} 100%)`,
          }}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 0,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === "dark" ? alpha(theme.palette.background.paper, 0.85) : "#ffffff",
            py: 1.1,
            px: 0.5,
          }}
        >
          {WEEK_DAYS.map((d) => (
            <Typography
              key={d}
              variant="caption"
              fontWeight={800}
              textAlign="center"
              sx={{ color: dashboardBlue, fontSize: "0.72rem", letterSpacing: "0.02em" }}
            >
              {d}
            </Typography>
          ))}
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 0,
              p: 0.5,
            }}
          >
            {Array.from({ length: 35 }, (_, i) => (
              <Skeleton key={i} variant="rounded" height={96} sx={{ m: 0.25 }} />
            ))}
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {weeksWithBars.map(({ weekKey, row, bars }) => {
              const visibleBars =
                bars.length > MAX_VISIBLE_LEAD_BARS ? bars.slice(-MAX_VISIBLE_LEAD_BARS) : bars;
              const barsForRender = cellsCollapsed
                ? visibleBars.slice(-Math.min(COLLAPSED_VISIBLE_LEAD_CAP, visibleBars.length))
                : visibleBars;
              const dayOverflowCounts = row.map((cell) => {
                const n = dayTicketsMap.get(dateKey(cell.date))?.length ?? 0;
                return n > MAX_VISIBLE_LEAD_BARS ? n - MAX_VISIBLE_LEAD_BARS : 0;
              });
              const hasDayOverflowRow = dayOverflowCounts.some((c) => c > 0);
              const trackRows = barsForRender.length + (hasDayOverflowRow ? 1 : 0);
              const showLeadOverlay = bars.length > 0 || hasDayOverflowRow;

              return (
                <Box
                  key={weekKey}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    gridTemplateRows: { xs: "minmax(0, auto)", sm: "minmax(0, auto)" },
                    columnGap: 0,
                    rowGap: 0,
                    isolation: "isolate",
                    minHeight: cellsCollapsed ? { xs: 72, sm: 78 } : { xs: 96, sm: 112 },
                    transition: (t) =>
                      t.transitions.create("min-height", {
                        duration: 320,
                        easing: t.transitions.easing.easeInOut,
                      }),
                    "@media (prefers-reduced-motion: reduce)": {
                      transition: "none",
                    },
                  }}
                >
                  {row.map(({ date, inMonth }, colIdx) => {
                    const isToday = isSameCalendarDay(date, today);
                    const isLastCol = colIdx === 6;
                    const isWeekend = colIdx === 0 || colIdx === 6;
                    const dk = dateKey(date);
                    const dayItems = dayTicketsMap.get(dk) ?? [];

                    return (
                      <Box
                        key={dk}
                        onClick={() => {
                          if (dayItems.length > 0) setDetailDayKey(dk);
                        }}
                        title={dayItems.length > 0 ? "Ver todos os chamados deste dia" : undefined}
                        sx={{
                          gridColumn: colIdx + 1,
                          gridRow: 1,
                          borderRight: isLastCol ? "none" : `1px solid ${theme.palette.divider}`,
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          p: cellsCollapsed ? 0.35 : 0.5,
                          display: "flex",
                          flexDirection: "column",
                          minWidth: 0,
                          bgcolor: !inMonth
                            ? alpha(theme.palette.action.hover, theme.palette.mode === "dark" ? 0.14 : 0.07)
                            : isWeekend
                              ? theme.palette.mode === "dark"
                                ? alpha(theme.palette.common.white, 0.04)
                                : theme.palette.grey[50]
                              : theme.palette.mode === "dark"
                                ? alpha(theme.palette.background.default, 0.35)
                                : theme.palette.background.paper,
                          outline: isToday ? `2px solid ${dashboardBlue}` : "none",
                          outlineOffset: -1,
                          borderRadius: isToday ? 0.5 : 0,
                          cursor: dayItems.length > 0 ? "pointer" : "default",
                          transition: (t) =>
                            t.transitions.create(["background-color", "padding"], {
                              duration: 220,
                              easing: t.transitions.easing.easeInOut,
                            }),
                          ...(dayItems.length > 0 && {
                            "&:hover": {
                              bgcolor: alpha(dashboardBlue, theme.palette.mode === "dark" ? 0.12 : 0.08),
                            },
                          }),
                        }}
                        aria-label={
                          dayItems.length > 0
                            ? `Abrir lista de ${formatDayHeading(date)} (${dayItems.length} chamados)`
                            : undefined
                        }
                      >
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          sx={{
                            // Retraído: número no topo para não competir com os micro-leads no rodapé da célula.
                            alignSelf: cellsCollapsed ? "flex-start" : "flex-end",
                            ml: cellsCollapsed ? "auto" : 0,
                            color: inMonth ? "text.primary" : "text.disabled",
                            lineHeight: 1.2,
                            fontSize: cellsCollapsed ? "0.78rem" : "0.75rem",
                            transition: (t) =>
                              t.transitions.create("font-size", {
                                duration: 220,
                                easing: t.transitions.easing.easeInOut,
                              }),
                            "@media (prefers-reduced-motion: reduce)": {
                              transition: "none",
                            },
                          }}
                        >
                          {date.getDate()}
                        </Typography>
                      </Box>
                    );
                  })}

                  {showLeadOverlay && (
                    <Box
                      sx={{
                        gridColumn: "1 / -1",
                        gridRow: 1,
                        zIndex: 1,
                        display: "grid",
                        gridTemplateColumns: "subgrid",
                        "@supports not (grid-template-columns: subgrid)": {
                          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                        },
                        gridTemplateRows: `repeat(${Math.max(trackRows, 1)}, auto)`,
                        columnGap: 0,
                        rowGap: cellsCollapsed ? 0.35 : 0.65,
                        alignSelf: "stretch",
                        minHeight: 0,
                        alignContent: "end",
                        justifyItems: "stretch",
                        px: 0,
                        pt: cellsCollapsed ? 1.75 : 2.25,
                        pb: cellsCollapsed ? 0.35 : 0.5,
                        pointerEvents: "none",
                        "& > *": { pointerEvents: "auto" },
                        transition: (t) =>
                          t.transitions.create(["padding-top", "padding-bottom", "row-gap"], {
                            duration: 260,
                            easing: t.transitions.easing.easeInOut,
                          }),
                        "@media (prefers-reduced-motion: reduce)": {
                          transition: "none",
                        },
                      }}
                    >
                      {barsForRender.map((b, i) => (
                        <LeadBarTrack
                          key={`${b.ticket.id}-${weekKey}`}
                          b={b}
                          onOpen={openTicket}
                          gridRow={barsForRender.length - i}
                          compact={cellsCollapsed}
                        />
                      ))}
                      {hasDayOverflowRow &&
                        row.map((cell, colIdx) => {
                          const dk = dateKey(cell.date);
                          const plus = dayOverflowCounts[colIdx] ?? 0;
                          if (plus <= 0) return null;
                          return (
                            <Box
                              key={`day-more-${weekKey}-${dk}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailDayKey(dk);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setDetailDayKey(dk);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              sx={{
                                gridColumn: colIdx + 1,
                                gridRow: trackRows,
                                justifySelf: "stretch",
                                width: "auto",
                                minWidth: 0,
                                mx: LEAD_TRACK_CELL_INSET,
                                boxSizing: "border-box",
                                height: cellsCollapsed ? COLLAPSED_LEAD_BAR_HEIGHT_PX + 4 : LEAD_BAR_HEIGHT_PX,
                                borderRadius: `${(cellsCollapsed ? COLLAPSED_LEAD_BAR_HEIGHT_PX + 4 : LEAD_BAR_HEIGHT_PX) / 2}px`,
                                px: cellsCollapsed ? 0.35 : 0.65,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                bgcolor: alpha(dashboardBlue, theme.palette.mode === "dark" ? 0.14 : 0.08),
                                border: `1px dashed ${alpha(dashboardBlue, 0.38)}`,
                                transition: "background-color 0.12s ease",
                                "&:hover": {
                                  bgcolor: alpha(dashboardBlue, theme.palette.mode === "dark" ? 0.2 : 0.12),
                                },
                              }}
                              aria-label={`Mais ${plus} chamados neste dia`}
                            >
                              <Typography
                                variant="caption"
                                fontWeight={700}
                                sx={{ fontSize: cellsCollapsed ? "0.58rem" : "0.68rem" }}
                                noWrap
                              >
                                {cellsCollapsed ? `+${plus}` : `+${plus} mais`}
                              </Typography>
                            </Box>
                          );
                        })}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <Typography variant="caption" color="text.secondary">
        Lead time (só chamados recebidos pelo seu departamento): cada faixa atravessa os dias em que o chamado esteve
        aberto (até conclusão ou até hoje).
        Com células retraídas, as faixas ficam bem finas e sem título (passe o mouse para ver o assunto).
        Em cada coluna do dia, “+N mais” aparece só naquele dia quando há mais de {MAX_VISIBLE_LEAD_BARS} chamados
        ativos nele; toque na célula do dia ou em “+N mais” para ver a lista completa daquele dia.
      </Typography>

      <ChartFullscreenDialog
        open={Boolean(detailDayKey && detailDayItems.length > 0)}
        onClose={closeDetailDialog}
        title={detailDayDate ? `Chamados em ${formatDayHeading(detailDayDate)}` : "Chamados do dia"}
        titleId={dayDetailTitleId}
      >
        {detailDayItems.length > 0 && (
          <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", pr: 0.5 }}>
            <List dense disablePadding>
              {detailDayItems.map((b) => (
                <ListItem
                  key={b.ticket.id}
                  disablePadding
                  secondaryAction={
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 0.75, mr: 0.5, flexShrink: 0, whiteSpace: "nowrap" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTimelineTicketId(b.ticket.id);
                      }}
                    >
                      Conferir timeline
                    </Button>
                  }
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    border: `1px solid ${theme.palette.divider}`,
                    alignItems: "flex-start",
                    ...(b.color === STATUS_COLOR_CONCLUIDO
                      ? {
                          backgroundImage: `linear-gradient(90deg, ${alpha(DASHBOARD_GAUGE_GREEN_START, 0.22)} 0%, ${alpha(DASHBOARD_GAUGE_GREEN_END, 0.12)} 68%, transparent 100%)`,
                          bgcolor: alpha(DASHBOARD_GAUGE_GREEN_END, theme.palette.mode === "dark" ? 0.1 : 0.06),
                        }
                      : b.color === STATUS_COLOR_PAUSADO
                        ? {
                            backgroundImage: `linear-gradient(90deg, ${alpha(STATUS_COLOR_PAUSADO, 0.18)} 0%, ${alpha(STATUS_COLOR_PAUSADO, 0.06)} 65%, transparent 100%)`,
                            bgcolor: alpha(STATUS_COLOR_PAUSADO, theme.palette.mode === "dark" ? 0.08 : 0.04),
                          }
                        : {
                            backgroundImage: `linear-gradient(90deg, ${alpha(b.color, 0.12)} 0%, ${alpha(b.color, 0.04)} 65%, transparent 100%)`,
                            bgcolor: alpha(b.color, theme.palette.mode === "dark" ? 0.06 : 0.03),
                          }),
                  }}
                >
                  <ListItemButton
                    onClick={() => openTicketFromDialog(b.ticket.id)}
                    alignItems="flex-start"
                    sx={{
                      pr: { xs: 2, sm: 20 },
                      py: 1,
                      borderRadius: 1,
                      transition: "background-color 0.12s ease",
                      "&:hover": {
                        bgcolor:
                          b.color === STATUS_COLOR_CONCLUIDO
                            ? alpha(DASHBOARD_GAUGE_GREEN_END, theme.palette.mode === "dark" ? 0.16 : 0.1)
                            : b.color === STATUS_COLOR_PAUSADO
                              ? alpha(STATUS_COLOR_PAUSADO, theme.palette.mode === "dark" ? 0.14 : 0.09)
                              : alpha(b.color, theme.palette.mode === "dark" ? 0.11 : 0.07),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 22,
                        height: 12,
                        borderRadius: "6px",
                        flexShrink: 0,
                        mt: 0.85,
                        mr: 1.25,
                        overflow: "hidden",
                        border: `1px solid ${leadBarOuterBorder(b.color, theme)}`,
                        backgroundImage: leadBarBodyBackground(theme, b.color),
                        bgcolor: "transparent",
                      }}
                    />
                    <ListItemText
                      primary={b.label}
                      primaryTypographyProps={{ fontWeight: 600, variant: "body2" }}
                      secondary={
                        <>
                          <Typography component="span" variant="caption" color="text.secondary" display="block">
                            {b.ticket.numero_protocolo} · {b.ticket.status}
                          </Typography>
                          <Typography component="span" variant="caption" color="text.secondary" display="block">
                            Abertura {formatDate(b.ticket.created_at)}
                            {b.ticket.closed_at ? ` · Encerramento ${formatDate(b.ticket.closed_at)}` : ""}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </ChartFullscreenDialog>

      <TicketStatusTimelineDialog
        open={Boolean(timelineTicketId)}
        onClose={() => setTimelineTicketId(null)}
        ticketId={timelineTicketId}
      />
    </Box>
  );
}
