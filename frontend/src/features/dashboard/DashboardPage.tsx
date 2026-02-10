import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { StatsCards } from "./components/StatsCards";
import { RecentTickets } from "./components/RecentTickets";
import {
  ChamadosPorPeriodoChart,
  DepartmentBarChart,
  TicketsBySetorDonut,
} from "./components/Charts";
import { getSetorByDepartamento } from "@/constants/departamentos";
import { ticketService, type DashboardStats } from "@/services/ticketService";

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
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [filterSetorGlobal, setFilterSetorGlobal] = useState<string | null>(null);
  const [customRangeData, setCustomRangeData] = useState<{
    por_dia: { date: string; count: number }[];
    por_dia_industria: { date: string; count: number }[];
    por_dia_administrativo: { date: string; count: number }[];
    por_mes_geral_range?: { mes: string; count: number }[];
    por_mes_industria_range?: { mes: string; count: number }[];
    por_mes_administrativo_range?: { mes: string; count: number }[];
  } | null>(null);

  useEffect(() => {
    ticketService
      .getDashboardStats()
      .then((res) => {
        if (res.success) setStats(res.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCustomRangeChange = (dateFrom: string, dateTo: string) => {
    ticketService
      .getDashboardStats({ dateFrom, dateTo })
      .then((res) => {
        if (res.success) {
          const s = res.stats as DashboardStats & {
            por_mes_geral_range?: { mes: string; count: number }[];
            por_mes_industria_range?: { mes: string; count: number }[];
            por_mes_administrativo_range?: { mes: string; count: number }[];
          };
          setCustomRangeData({
            por_dia: s.por_dia,
            por_dia_industria: s.por_dia_industria,
            por_dia_administrativo: s.por_dia_administrativo,
            por_mes_geral_range: s.por_mes_geral_range,
            por_mes_industria_range: s.por_mes_industria_range,
            por_mes_administrativo_range: s.por_mes_administrativo_range,
          });
        }
      })
      .catch(() => setCustomRangeData(null));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
        <Box>
          <Skeleton variant="text" width={180} height={36} />
          <Skeleton variant="text" width={260} height={20} />
        </Box>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" } }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={88} />
          ))}
        </Box>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
          <Skeleton variant="rounded" height={260} />
          <Skeleton variant="rounded" height={260} />
        </Box>
        <Skeleton variant="rounded" height={280} />
        <Skeleton variant="rounded" height={240} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ flex: "1 1 auto" }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 0.25 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visao geral do Portal de Chamados.
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 150 }}>
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
        total={stats.total}
        abertos={stats.abertos}
        emAndamento={stats.em_andamento}
        concluidos={stats.concluidos}
      />

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        }}
      >
        <ChamadosPorPeriodoChart
          dataDia={
            filterSetorGlobal === "Industrial"
              ? stats.por_dia_industria
              : filterSetorGlobal === "Administrativo"
                ? stats.por_dia_administrativo
                : stats.por_dia
          }
          dataMes={
            filterSetorGlobal === "Industrial"
              ? stats.por_mes_industria
              : filterSetorGlobal === "Administrativo"
                ? stats.por_mes_administrativo
                : stats.por_mes_geral
          }
          dataDiaCustom={
            customRangeData
              ? filterSetorGlobal === "Industrial"
                ? customRangeData.por_dia_industria
                : filterSetorGlobal === "Administrativo"
                  ? customRangeData.por_dia_administrativo
                  : customRangeData.por_dia
              : null
          }
          dataMesCustom={
            customRangeData
              ? filterSetorGlobal === "Industrial"
                ? (customRangeData.por_mes_industria_range ?? null)
                : filterSetorGlobal === "Administrativo"
                  ? (customRangeData.por_mes_administrativo_range ?? null)
                  : (customRangeData.por_mes_geral_range ?? null)
              : null
          }
          onCustomRangeChange={handleCustomRangeChange}
        />
        <TicketsBySetorDonut data={stats.por_setor} />
      </Box>

      <DepartmentBarChart
        data={stats.por_departamento}
        filterSetor={filterSetorGlobal}
        getSetor={getSetorByDepartamento}
      />

      <RecentTickets tickets={stats.recentes} />
    </Box>
  );
}
