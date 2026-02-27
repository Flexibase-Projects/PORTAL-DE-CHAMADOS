import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
// --- Card unificado: Chamados por dia / por mês (período controlado pelo dashboard) ---

import type { PeriodKey } from "../dashboardPeriod";

const PERIODO_COLORS = { dia: "#0ea5e9", mes: "#2563eb" };

interface ChamadosPorPeriodoChartProps {
  dataDia: { date: string; count: number }[];
  dataMes: { mes: string; count: number }[];
  /** Período selecionado no topo do dashboard (define visualização dia/mês). */
  periodKey: PeriodKey;
  /** Apenas para periodKey === "custom": exibir por dia ou por mês. */
  customViewMode?: "dia" | "mes";
  onCustomViewModeChange?: (mode: "dia" | "mes") => void;
}

export function ChamadosPorPeriodoChart({
  dataDia,
  dataMes,
  periodKey,
  customViewMode = "dia",
  onCustomViewModeChange,
}: ChamadosPorPeriodoChartProps) {
  const theme = useTheme();
  const secondaryColor = theme.palette.secondary.main;
  const [viewMode, setViewMode] = useState<"dia" | "mes">(customViewMode);

  const effectiveViewMode: "dia" | "mes" =
    periodKey === "custom"
      ? viewMode
      : periodKey === "7d" || periodKey === "mes_atual" || periodKey === "mes_anterior"
        ? "dia"
        : "mes";
  const chartDataDia = dataDia;
  const chartDataMes = dataMes;
  const isEmpty =
    effectiveViewMode === "dia" ? chartDataDia.length === 0 : chartDataMes.length === 0;
  const colorMes = PERIODO_COLORS.mes;
  const showLineChart = effectiveViewMode === "mes";

  const handleViewModeChange = (mode: "dia" | "mes") => {
    setViewMode(mode);
    onCustomViewModeChange?.(mode);
  };

  return (
    <Card
      sx={{
        "&:hover": {
          boxShadow: `0 0 24px ${alpha(secondaryColor, 0.28)}, 0 0 48px ${alpha(secondaryColor, 0.12)}`,
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 1.5, sm: 2 },
          pt: { xs: 1.5, sm: 2 },
          pb: 0,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{
            flex: "0 1 auto",
            minWidth: 0,
            maxWidth: { xs: "100%", sm: 160 },
            fontSize: { xs: "0.875rem", sm: "0.9375rem" },
          }}
        >
          Chamados por período
        </Typography>
        {periodKey === "custom" && (
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v != null && handleViewModeChange(v)}
            size="small"
          >
            <ToggleButton value="dia">Por dia</ToggleButton>
            <ToggleButton value="mes">Por mês</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>
      <CardContent sx={{ pt: 0 }}>
        {isEmpty ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={6}>
            Sem dados disponíveis.
          </Typography>
        ) : showLineChart ? (
          <Box sx={{ width: "100%", height: { xs: 220, sm: 250 } }}>
            <ResponsiveContainer>
              <LineChart data={chartDataMes} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(_, payload) => (payload?.[0]?.payload?.mes ?? "")}
                  formatter={(value: number) => [value, "Chamados"]}
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    boxShadow: theme.shadows[2],
                  }}
                />
                <Line type="monotone" dataKey="count" name="Chamados" stroke={colorMes} strokeWidth={2} dot={{ fill: colorMes, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ width: "100%", height: { xs: 220, sm: 250 } }}>
            <ResponsiveContainer>
              <AreaChart data={chartDataDia}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(_, payload) => (payload?.[0]?.payload?.date ?? "")}
                  formatter={(value: number) => [value, "Chamados"]}
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    boxShadow: theme.shadows[2],
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Chamados"
                  fill={secondaryColor}
                  fillOpacity={0.3}
                  stroke={secondaryColor}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

interface BarChartProps {
  data: { area: string; count: number }[];
  filterSetor: string | null;
  getSetor: (area: string) => string | null;
}

export function DepartmentBarChart({ data, filterSetor, getSetor }: BarChartProps) {
  const theme = useTheme();
  const secondaryColor = theme.palette.secondary.main;

  const filteredData = filterSetor
    ? data.filter((row) => getSetor(row.area) === filterSetor)
    : data;

  return (
    <Card
      sx={{
        "&:hover": {
          boxShadow: `0 0 24px ${alpha(secondaryColor, 0.28)}, 0 0 48px ${alpha(secondaryColor, 0.12)}`,
        },
      }}
    >
      <CardHeader
        title={
          <Typography variant="subtitle1" fontWeight={600}>
            Por Departamento
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {filteredData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={6}>
            Sem dados disponíveis.
          </Typography>
        ) : (
          <Box sx={{ width: "100%", height: { xs: 220, sm: 250 } }}>
            <ResponsiveContainer>
              <BarChart data={filteredData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="area" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                <Tooltip
                  cursor={false}
                  labelFormatter={(_, payload) => (payload?.[0]?.payload?.area ?? "")}
                  formatter={(value: number) => [value, "Chamados"]}
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    boxShadow: theme.shadows[2],
                  }}
                />
                <Bar dataKey="count" name="Chamados" fill={secondaryColor} radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

interface PorSetorProps {
  data: { setor: string; count: number }[];
}

/** Cores por setor em tons de azul. */
const SETOR_COLOR_MAP: Record<string, string> = {
  Administrativo: "#2563eb",
  Industrial: "#0ea5e9",
  Comercial: "#3b82f6",
};

/** Apenas Indústria e Administrativo (Comercial ignorado). */
const SETORES_DONUT = ["Industrial", "Administrativo"];

export function TicketsBySetorDonut({ data }: PorSetorProps) {
  const theme = useTheme();
  const filtered = data.filter((d) => SETORES_DONUT.includes(d.setor));
  const glowColor = theme.palette.primary.main;

  return (
    <Card
      sx={{
        "&:hover": {
          boxShadow: `0 0 24px ${alpha(glowColor, 0.28)}, 0 0 48px ${alpha(glowColor, 0.12)}`,
        },
      }}
    >
      <CardHeader
        title={
          <Typography variant="subtitle1" fontWeight={600}>
            Chamados por Setor
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={6}>
            Sem dados disponíveis.
          </Typography>
        ) : (
          <Box sx={{ width: "100%", height: { xs: 220, sm: 260 } }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={filtered}
                  dataKey="count"
                  nameKey="setor"
                  cx="50%"
                  cy="50%"
                  innerRadius="35%"
                  outerRadius="90%"
                  paddingAngle={0}
                  stroke="none"
                >
                  {filtered.map((row, i) => (
                    <Cell
                      key={i}
                      fill={SETOR_COLOR_MAP[row.setor] ?? "#888"}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0];
                    const setor = item.payload?.setor ?? item.name ?? "";
                    const count = item.payload?.count ?? item.value ?? 0;
                    const fillColor = (item as { fill?: string }).fill ?? SETOR_COLOR_MAP[setor] ?? "#666";
                    return (
                      <Box
                        sx={{
                          backgroundColor: theme.palette.background.paper,
                          color: fillColor,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: theme.shape.borderRadius,
                          boxShadow: theme.shadows[2],
                          px: 1.5,
                          py: 1,
                          fontWeight: 600,
                        }}
                      >
                        Chamados: {count}
                      </Box>
                    );
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

