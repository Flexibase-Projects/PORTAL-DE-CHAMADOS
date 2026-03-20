import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { alpha, useTheme } from "@mui/material/styles";
import { ticketService } from "@/services/ticketService";
import { localStorageStorage } from "@/storage/localStorageStorage";
import { useAuth } from "@/contexts/AuthContext";
import type { Ticket } from "@/types/ticket";
import {
  STATUS_COLOR_ABERTO,
  STATUS_COLOR_CONCLUIDO,
  STATUS_COLOR_EM_ANDAMENTO,
  statusColorForLeadBar,
  statusLabelForLegend,
} from "@/constants/ticketStatusColors";

const USE_LOCAL_STORAGE = import.meta.env.VITE_USE_LOCAL_STORAGE === "true";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

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

function parseYmd(iso: string | undefined): Date | null {
  if (!iso) return null;
  const s = String(iso).slice(0, 10);
  const [y, m, day] = s.split("-").map(Number);
  if (!y || !m || !day) return null;
  return startOfDay(new Date(y, m - 1, day));
}

function formatMonthYearLabel(d: Date): string {
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
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

type BarSlice = {
  ticket: Ticket;
  startCol: number;
  endCol: number;
  color: string;
  label: string;
};

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
    const startCol = Math.floor((visStart.getTime() - ws) / 86400000);
    const endCol = Math.floor((visEnd.getTime() - ws) / 86400000);
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

function barLabelColor(barColor: string): string {
  if (barColor === STATUS_COLOR_ABERTO || barColor === STATUS_COLOR_CONCLUIDO) return "#fff";
  return "rgba(0,0,0,0.87)";
}

/** Barra sobre a mesma linha dos dias: `gridColumn` alinha a dom–sáb; `gridRow` empilha várias barras. */
function LeadBarTrack({
  b,
  onOpen,
  gridRow,
}: {
  b: BarSlice;
  onOpen: (id: string) => void;
  /** Linha dentro da subgrid de leads (1 = mais acima; maior = mais perto da base da semana). */
  gridRow: number;
}) {
  const gridStart = b.startCol + 1;
  const gridEnd = b.endCol + 2;
  const fg = barLabelColor(b.color);

  return (
    <Box
      onClick={() => onOpen(b.ticket.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(b.ticket.id);
        }
      }}
      sx={{
        gridColumn: `${gridStart} / ${gridEnd}`,
        gridRow,
        height: 26,
        borderRadius: "6px",
        px: 0.75,
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        overflow: "hidden",
        bgcolor: alpha(b.color, 0.34),
        transition: "filter 0.15s ease, transform 0.12s ease",
        "&:hover": {
          filter: "brightness(1.05)",
          transform: "scale(1.005)",
        },
      }}
      aria-label={`Chamado: ${b.label}`}
      title={b.label}
    >
      <Typography variant="caption" fontWeight={600} noWrap sx={{ color: fg, lineHeight: 1.2, fontSize: "0.7rem" }}>
        {b.label}
      </Typography>
    </Box>
  );
}

export function ChamadosLeadTimeCalendar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [anchorDate, setAnchorDate] = useState(() => firstOfMonth(new Date()));
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      const map = new Map<string, Ticket>();
      for (const t of res.chamadosMeuDepartamento ?? []) map.set(t.id, t);
      for (const t of res.chamadosQueAbriOutros ?? []) map.set(t.id, t);
      setTickets([...map.values()]);
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

  const weeksWithBars = useMemo(() => {
    return weeks.map((row) => {
      const weekStart = row[0]!.date;
      const ws = startOfWeekSunday(weekStart);
      return {
        weekKey: ws.toISOString().slice(0, 10),
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

  const legendItems: { color: string; label: string }[] = [
    { color: STATUS_COLOR_ABERTO, label: statusLabelForLegend("Aberto") },
    { color: STATUS_COLOR_EM_ANDAMENTO, label: statusLabelForLegend("Em Andamento") },
    { color: STATUS_COLOR_CONCLUIDO, label: statusLabelForLegend("Concluído") },
  ];

  const periodTitle = formatMonthYearLabel(monthFirst);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          <Button size="small" variant="outlined" onClick={goPrev} aria-label="Mês anterior" sx={{ minWidth: 40, px: 1 }}>
            <ChevronLeft size={20} />
          </Button>
          <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 200, textAlign: "center", textTransform: "capitalize" }}>
            {periodTitle}
          </Typography>
          <Button size="small" variant="outlined" onClick={goNext} aria-label="Próximo mês" sx={{ minWidth: 40, px: 1 }}>
            <ChevronRight size={20} />
          </Button>
          <Button size="small" variant="text" onClick={goToday}>
            Hoje
          </Button>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
          {legendItems.map((item) => (
            <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: item.color,
                  flexShrink: 0,
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
          borderRadius: 2,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.08 : 0.04),
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 0,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            py: 1,
            px: 0.5,
          }}
        >
          {WEEK_DAYS.map((d) => (
            <Typography key={d} variant="caption" fontWeight={700} textAlign="center" color="text.secondary">
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
            {weeksWithBars.map(({ weekKey, row, bars }) => (
              <Box
                key={weekKey}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gridTemplateRows: { xs: "minmax(96px, auto)", sm: "minmax(112px, auto)" },
                  columnGap: 0,
                  rowGap: 0,
                  isolation: "isolate",
                }}
              >
                {row.map(({ date, inMonth }, colIdx) => {
                  const isToday = isSameCalendarDay(date, today);
                  const isLastCol = colIdx === 6;
                  const isWeekend = colIdx === 0 || colIdx === 6;
                  return (
                    <Box
                      key={date.toISOString().slice(0, 10)}
                      sx={{
                        gridColumn: colIdx + 1,
                        gridRow: 1,
                        borderRight: isLastCol ? "none" : `1px solid ${theme.palette.divider}`,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        p: 0.5,
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: !inMonth
                          ? alpha(theme.palette.action.hover, 0.06)
                          : isWeekend
                            ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.1 : 0.06)
                            : "transparent",
                        outline: isToday ? `2px solid ${theme.palette.primary.main}` : "none",
                        outlineOffset: -1,
                        borderRadius: isToday ? 0.5 : 0,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{
                          alignSelf: "flex-end",
                          color: inMonth ? "text.primary" : "text.disabled",
                          lineHeight: 1.2,
                        }}
                      >
                        {date.getDate()}
                      </Typography>
                    </Box>
                  );
                })}

                {bars.length > 0 && (
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
                      gridTemplateRows: `repeat(${bars.length}, auto)`,
                      columnGap: 0,
                      rowGap: 0.45,
                      alignSelf: "stretch",
                      minHeight: 0,
                      alignContent: "end",
                      justifyItems: "stretch",
                      px: 0,
                      pt: 2.25,
                      pb: 0.5,
                      pointerEvents: "none",
                      "& > *": { pointerEvents: "auto" },
                    }}
                  >
                    {bars.map((b, i) => (
                      <LeadBarTrack
                        key={`${b.ticket.id}-${weekKey}`}
                        b={b}
                        onOpen={openTicket}
                        gridRow={bars.length - i}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Typography variant="caption" color="text.secondary">
        Lead time: as barras ficam sobre as células dos dias (mesma grade, colunas domingo a sábado) e atravessam os dias
        em que o chamado esteve aberto, até conclusão ou até hoje. Semanas longas geram um trecho por linha da semana.
      </Typography>
    </Box>
  );
}
