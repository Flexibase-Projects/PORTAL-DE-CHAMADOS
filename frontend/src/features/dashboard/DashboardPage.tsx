import { useEffect, useState } from "react";
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
import { Calendar } from "lucide-react";
import { StatsCards } from "./components/StatsCards";
import { RecentTickets } from "./components/RecentTickets";
import {
  ChamadosPorPeriodoChart,
  DepartmentBarChart,
  TicketsBySetorDonut,
  ResolvidosGauge,
} from "./components/Charts";
import {
  getDateRangeForPeriod,
  PERIOD_LABELS,
  type PeriodKey,
} from "./dashboardPeriod";
import { getSetorByDepartamento } from "@/constants/departamentos";
import { ticketService, type DashboardStats } from "@/services/ticketService";
import { useAuth } from "@/contexts/AuthContext";

const emptyStats: DashboardStats = {
  total: 0,
  abertos: 0,
  em_andamento: 0,
  concluidos: 0,
  recentes: [],
  por_departamento: [],
  por_dia: [],
  por_dia_industria: [],
  por_dia_administrativo: [],
  por_mes_geral: [],
  por_mes_industria: [],
  por_mes_administrativo: [],
  por_setor: [],
};

export function DashboardPage() {
  const { loading: authLoading, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [filterSetorGlobal, setFilterSetorGlobal] = useState<string | null>(null);
  const [periodKey, setPeriodKey] = useState<PeriodKey>("7d");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [customViewMode, setCustomViewMode] = useState<"dia" | "mes">("dia");
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

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
    if (authLoading) return;
    if (periodKey === "custom") {
      if (customDateFrom && customDateTo && customDateFrom <= customDateTo) {
        loadStats({ dateFrom: customDateFrom, dateTo: customDateTo });
      } else {
        setStats(emptyStats);
        setLoading(false);
      }
      return;
    }
    const range = getDateRangeForPeriod(periodKey);
    if (range) loadStats(range);
  }, [authLoading, periodKey, customDateFrom, customDateTo, user?.id]);

  const handlePeriodChange = (key: PeriodKey) => {
    setPeriodKey(key);
  };

  const applyCustomRange = () => {
    if (customDateFrom && customDateTo && customDateFrom <= customDateTo) {
      setPopoverAnchor(null);
    }
  };

  const todayStr = () => new Date().toISOString().split("T")[0];

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
              lg: "repeat(4, 1fr)",
            },
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={88} />
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, sm: 2, md: 2.5 } }}>
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
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 }, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={periodKey}
            label="Período"
            onChange={(e) => handlePeriodChange(e.target.value as PeriodKey)}
          >
            <MenuItem value="7d">{PERIOD_LABELS["7d"]}</MenuItem>
            <MenuItem value="mes_atual">{PERIOD_LABELS.mes_atual}</MenuItem>
            <MenuItem value="ano_atual">{PERIOD_LABELS.ano_atual}</MenuItem>
            <MenuItem value="custom">{PERIOD_LABELS.custom}</MenuItem>
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
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 }, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
          <InputLabel>Filtrar por setor</InputLabel>
          <Select
            value={filterSetorGlobal ?? ""}
            label="Filtrar por setor"
            onChange={(e) => setFilterSetorGlobal(e.target.value || null)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="Administrativo">Administrativo</MenuItem>
            <MenuItem value="Industrial">Industrial</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <StatsCards
        total={stats.total ?? 0}
        abertos={stats.abertos ?? 0}
        emAndamento={stats.em_andamento ?? 0}
        concluidos={stats.concluidos ?? 0}
      />

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <ChamadosPorPeriodoChart
          dataDia={
            (filterSetorGlobal === "Industrial"
              ? stats.por_dia_industria
              : filterSetorGlobal === "Administrativo"
                ? stats.por_dia_administrativo
                : stats.por_dia) ?? []
          }
          dataMes={
            (filterSetorGlobal === "Industrial"
              ? stats.por_mes_industria
              : filterSetorGlobal === "Administrativo"
                ? stats.por_mes_administrativo
                : stats.por_mes_geral) ?? []
          }
          periodKey={periodKey}
          customViewMode={customViewMode}
          onCustomViewModeChange={setCustomViewMode}
        />
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            minWidth: 0,
          }}
        >
          <TicketsBySetorDonut data={stats.por_setor ?? []} />
          <ResolvidosGauge total={stats.total ?? 0} concluidos={stats.concluidos ?? 0} />
        </Box>
      </Box>

      <DepartmentBarChart
        data={stats.por_departamento ?? []}
        filterSetor={filterSetorGlobal}
        getSetor={getSetorByDepartamento}
      />

      <RecentTickets tickets={stats.recentes ?? []} />
    </Box>
  );
}
