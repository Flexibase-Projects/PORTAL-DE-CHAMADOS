import { useEffect, useState, useRef, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Popover from "@mui/material/Popover";
import { useTheme, alpha } from "@mui/material/styles";
import { Building2, Calendar, CalendarDays, CalendarRange, Clock3, Factory, LayoutGrid } from "lucide-react";
import { StatsCards } from "./components/StatsCards";
import {
  ChamadosPorPeriodoChart,
  DepartmentBarChart,
  TicketsBySetorDonut,
} from "./components/Charts";
import { TopTicketCreatorsCard } from "./components/TopTicketCreatorsCard";
import {
  getDateRangeForPeriod,
  PERIOD_LABELS,
  type PeriodKey,
} from "./dashboardPeriod";
import { getSetorParaDashboard } from "@/constants/departamentos";
import { ticketService, type DashboardStats } from "@/services/ticketService";
import { useAuth } from "@/contexts/AuthContext";

const emptyStats: DashboardStats = {
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

const DASHBOARD_MENU_ITEM_SX = {
  borderRadius: "10px",
  mx: 0.5,
  my: 0.125,
  minHeight: 40,
  fontSize: "0.875rem",
  transition: "background-color 0.18s ease, color 0.18s ease, transform 0.12s ease",
  "&:active": { transform: "scale(0.98)" },
} as const;

export function DashboardPage() {
  const theme = useTheme();
  const { loading: authLoading, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [filterSetorGlobal, setFilterSetorGlobal] = useState<string | null>(null);
  const [periodKey, setPeriodKey] = useState<PeriodKey>("7d");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [customViewMode, setCustomViewMode] = useState<"dia" | "mes">("dia");
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  /** Intervalo customizado só busca ao Aplicar; rascunho no popover não dispara load. */
  const [customRangeApplied, setCustomRangeApplied] = useState(false);
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");
  const prevPeriodKeyRef = useRef<PeriodKey>(periodKey);

  const loadStats = (options?: { dateFrom?: string; dateTo?: string }) => {
    setLoading(true);
    const params = { ...options, auth_user_id: user?.id ?? undefined };
    ticketService
      .getDashboardStats(params)
      .then((res) => {
        if (res.success && res.stats) setStats(res.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (prevPeriodKeyRef.current !== periodKey) {
      if (periodKey === "custom") {
        setCustomRangeApplied(false);
        setAppliedDateFrom("");
        setAppliedDateTo("");
      }
      prevPeriodKeyRef.current = periodKey;
    }
  }, [periodKey]);

  useEffect(() => {
    if (authLoading) return;
    if (periodKey === "custom") {
      if (!customRangeApplied || !appliedDateFrom || !appliedDateTo || appliedDateFrom > appliedDateTo) {
        setStats(emptyStats);
        setLoading(false);
        return;
      }
      loadStats({ dateFrom: appliedDateFrom, dateTo: appliedDateTo });
      return;
    }
    const range = getDateRangeForPeriod(periodKey);
    if (range) loadStats(range);
  }, [authLoading, periodKey, customRangeApplied, appliedDateFrom, appliedDateTo, user?.id]);

  useEffect(() => {
    if (!user?.id || authLoading) return;
    const onRealtime = () => {
      if (periodKey === "custom") {
        if (!customRangeApplied || !appliedDateFrom || !appliedDateTo || appliedDateFrom > appliedDateTo) return;
        loadStats({ dateFrom: appliedDateFrom, dateTo: appliedDateTo });
        return;
      }
      const range = getDateRangeForPeriod(periodKey);
      if (range) loadStats(range);
    };
    window.addEventListener("tickets-realtime-update", onRealtime);
    return () => window.removeEventListener("tickets-realtime-update", onRealtime);
  }, [user?.id, authLoading, periodKey, customRangeApplied, appliedDateFrom, appliedDateTo]);

  const handlePeriodChange = (key: PeriodKey) => {
    setPeriodKey(key);
  };

  const applyCustomRange = () => {
    if (customDateFrom && customDateTo && customDateFrom <= customDateTo) {
      setAppliedDateFrom(customDateFrom);
      setAppliedDateTo(customDateTo);
      setCustomRangeApplied(true);
      setPopoverAnchor(null);
    }
  };

  const todayStr = () => new Date().toISOString().split("T")[0];

  const filterMenuProps = useMemo(
    () => ({
      transitionDuration: 220,
      slotProps: {
        paper: {
          elevation: 0,
          sx: {
            mt: 1,
            borderRadius: "14px",
            minWidth: 216,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.background.paper, 0.98)
                : alpha("#ffffff", 0.98),
            backdropFilter: "blur(14px)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 20px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)"
                : `0 12px 40px ${alpha(theme.palette.primary.main, 0.14)}, 0 4px 14px rgba(0,0,0,0.06)`,
            overflow: "hidden",
            "& .MuiMenu-list": { py: 1, px: 0.25 },
          },
        },
        backdrop: {
          invisible: false,
          sx: {
            backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.08),
            backdropFilter: "blur(6px)",
          },
        },
      },
    }),
    [theme]
  );

  const filterFormControlSx = useMemo(
    () => ({
      minWidth: { xs: "100%", sm: 168 },
      flex: { xs: "1 1 100%", sm: "0 0 auto" },
      "& .MuiOutlinedInput-root": {
        borderRadius: "12px",
        backgroundColor: alpha(theme.palette.background.paper, 0.92),
        backdropFilter: "blur(10px)",
        transition: theme.transitions.create(["box-shadow", "border-color", "transform"], {
          duration: theme.transitions.duration.shorter,
        }),
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: alpha(theme.palette.primary.main, 0.25),
        },
        "&:hover": {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
          },
          boxShadow: `0 4px 18px ${alpha(theme.palette.primary.main, 0.16)}`,
        },
        "&.Mui-focused": {
          "& .MuiOutlinedInput-notchedOutline": {
            borderWidth: "2px",
          },
          boxShadow: `0 6px 22px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
      },
      "& .MuiInputLabel-root": {
        fontWeight: 600,
      },
    }),
    [theme]
  );

  const menuItemSelectedSx = useMemo(
    () => ({
      ...DASHBOARD_MENU_ITEM_SX,
      "&.Mui-selected": {
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.12),
        color: theme.palette.primary.main,
        fontWeight: 700,
        "&:hover": {
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.36 : 0.18),
        },
      },
    }),
    [theme]
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, sm: 2, md: 2.5 } }}>
        <Box>
          <Skeleton variant="text" width={180} height={36} />
          <Skeleton variant="text" width={260} height={20} />
        </Box>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(3, 1fr)",
              lg: "repeat(5, 1fr)",
            },
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" height={108} />
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <Skeleton variant="rounded" height={260} />
          <Skeleton variant="rounded" height={260} />
        </Box>
        <Skeleton variant="rounded" height={280} />
        <Skeleton variant="rounded" height={240} />
      </Box>
    );
  }

  const dashboardShellSx = {
    display: "flex",
    flexDirection: "column",
    gap: { xs: 1.5, sm: 2, md: 2.5 },
    p: { xs: 1, sm: 1.25, md: 1.5 },
    borderRadius: 2,
    bgcolor: theme.palette.mode === "dark" ? alpha(theme.palette.background.paper, 0.28) : alpha("#ffffff", 0.32),
    "& .MuiCard-root": {
      border: "none",
      borderWidth: 0,
      outline: "none",
      transform: "perspective(900px) translateZ(0) scale(1)",
      transformOrigin: "center center",
      willChange: "transform, box-shadow",
      boxShadow:
        theme.palette.mode === "dark"
          ? "0 6px 18px rgba(0,0,0,0.38)"
          : "0 6px 18px rgba(15, 23, 42, 0.1), 0 2px 6px rgba(15, 23, 42, 0.08)",
      transition: "box-shadow 0.26s ease, transform 0.26s ease",
      "&:hover": {
        transform: "perspective(900px) translateY(-2px) translateZ(10px) scale(1.01)",
        boxShadow:
          theme.palette.mode === "dark"
            ? `0 0 26px ${alpha(theme.palette.primary.main, 0.32)}, 0 0 52px ${alpha(theme.palette.primary.main, 0.16)}`
            : `0 0 26px ${alpha("#111184", 0.22)}, 0 0 52px ${alpha("#111184", 0.1)}`,
      },
      "@media (prefers-reduced-motion: reduce)": {
        transition: "box-shadow 0.12s ease",
        transform: "none",
        "&:hover": { transform: "none" },
      },
    },
  } as const;

  return (
    <Box sx={dashboardShellSx}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: { xs: 1, sm: 1.5 },
        }}
      >
        <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 0.25, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visao geral do Portal de Chamados.
          </Typography>
        </Box>
        <FormControl size="small" sx={filterFormControlSx}>
          <InputLabel id="dashboard-period-label">Período</InputLabel>
          <Select
            labelId="dashboard-period-label"
            value={periodKey}
            label="Período"
            onChange={(e) => handlePeriodChange(e.target.value as PeriodKey)}
            MenuProps={filterMenuProps}
            renderValue={(value) => {
              const key = value as PeriodKey;
              const PeriodIcon =
                key === "7d"
                  ? Clock3
                  : key === "mes_atual"
                    ? CalendarDays
                    : key === "ano_atual"
                      ? CalendarRange
                      : Calendar;
              return (
                <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}>
                  <PeriodIcon size={17} strokeWidth={2} style={{ opacity: 0.9, flexShrink: 0 }} aria-hidden />
                  {PERIOD_LABELS[key]}
                </Box>
              );
            }}
            sx={{ "& .MuiSelect-select": { py: 1, display: "flex", alignItems: "center" } }}
          >
            <MenuItem value="7d" sx={menuItemSelectedSx}>
              {PERIOD_LABELS["7d"]}
            </MenuItem>
            <MenuItem value="mes_atual" sx={menuItemSelectedSx}>
              {PERIOD_LABELS.mes_atual}
            </MenuItem>
            <MenuItem value="ano_atual" sx={menuItemSelectedSx}>
              {PERIOD_LABELS.ano_atual}
            </MenuItem>
            <MenuItem value="custom" sx={menuItemSelectedSx}>
              {PERIOD_LABELS.custom}
            </MenuItem>
          </Select>
        </FormControl>
        {periodKey === "custom" && (
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Calendar size={18} />}
              onClick={(e) => setPopoverAnchor(e.currentTarget)}
              sx={{ color: "primary.main" }}
            >
              {customDateFrom && customDateTo ? `${customDateFrom} → ${customDateTo}` : "Selecionar datas"}
            </Button>
            <Popover
              open={Boolean(popoverAnchor)}
              anchorEl={popoverAnchor}
              onClose={() => setPopoverAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              slotProps={{ paper: { sx: { p: 2, minWidth: 280 } } }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Intervalo
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  label="Data inicial"
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: customDateTo || todayStr() }}
                />
                <TextField
                  size="small"
                  fullWidth
                  label="Data final"
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: customDateFrom, max: todayStr() }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={applyCustomRange}
                  disabled={!customDateFrom || !customDateTo || customDateFrom > customDateTo}
                >
                  Aplicar
                </Button>
              </Box>
            </Popover>
          </>
        )}
        <FormControl size="small" sx={filterFormControlSx}>
          <InputLabel id="dashboard-setor-label" shrink>
            Filtrar por setor
          </InputLabel>
          <Select
            labelId="dashboard-setor-label"
            value={filterSetorGlobal ?? ""}
            displayEmpty
            label="Filtrar por setor"
            onChange={(e) => setFilterSetorGlobal(e.target.value || null)}
            MenuProps={filterMenuProps}
            renderValue={(value) => {
              const label =
                value === "Administrativo"
                  ? "Administrativo"
                  : value === "Industrial"
                    ? "Industrial"
                    : "Todos";
              const SetorIcon =
                value === "Administrativo" ? Building2 : value === "Industrial" ? Factory : LayoutGrid;
              return (
                <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}>
                  <SetorIcon size={17} strokeWidth={2} style={{ opacity: 0.9, flexShrink: 0 }} aria-hidden />
                  {label}
                </Box>
              );
            }}
            sx={{ "& .MuiSelect-select": { py: 1, display: "flex", alignItems: "center" } }}
          >
            <MenuItem value="" sx={menuItemSelectedSx}>
              Todos
            </MenuItem>
            <MenuItem value="Administrativo" sx={menuItemSelectedSx}>
              Administrativo
            </MenuItem>
            <MenuItem value="Industrial" sx={menuItemSelectedSx}>
              Industrial
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      <StatsCards
        total={stats.total ?? 0}
        abertos={stats.abertos ?? 0}
        emAndamento={stats.em_andamento ?? 0}
        pausados={stats.pausados ?? 0}
        concluidos={stats.concluidos ?? 0}
      />

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(3, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
          },
        }}
      >
        <Box sx={{ minWidth: 0, gridColumn: { xs: "1", sm: "span 1", md: "span 2", lg: "span 4" } }}>
          <ChamadosPorPeriodoChart
            dataDia={
              (filterSetorGlobal === "Industrial"
                ? stats.por_dia_industria
                : filterSetorGlobal === "Administrativo"
                  ? stats.por_dia_administrativo
                  : stats.por_dia) ?? []
            }
            dataMes={
              periodKey === "custom"
                ? (filterSetorGlobal === "Industrial"
                    ? stats.por_mes_industria_range
                    : filterSetorGlobal === "Administrativo"
                      ? stats.por_mes_administrativo_range
                      : stats.por_mes_geral_range) ?? []
                : (filterSetorGlobal === "Industrial"
                    ? stats.por_mes_industria
                    : filterSetorGlobal === "Administrativo"
                      ? stats.por_mes_administrativo
                      : stats.por_mes_geral) ?? []
            }
            periodKey={periodKey}
            customViewMode={customViewMode}
            onCustomViewModeChange={setCustomViewMode}
          />
        </Box>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: "1fr",
            minWidth: 0,
            gridColumn: { xs: "1", sm: "span 1", md: "span 1", lg: "span 1" },
            "& .MuiCard-root": {
              width: "100%",
            },
          }}
        >
          <TicketsBySetorDonut data={stats.por_setor ?? []} />
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          alignItems: "stretch",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <Box sx={{ minWidth: 0, width: "100%", display: "flex", flexDirection: "column" }}>
          <DepartmentBarChart
            data={stats.por_departamento ?? []}
            filterSetor={filterSetorGlobal}
            getSetor={getSetorParaDashboard}
          />
        </Box>
        <Box sx={{ minWidth: 0, width: "100%", display: "flex", flexDirection: "column" }}>
          <TopTicketCreatorsCard
            data={stats.top_solicitantes ?? []}
            filterSetor={filterSetorGlobal}
            getSetor={getSetorParaDashboard}
          />
        </Box>
      </Box>
    </Box>
  );
}
