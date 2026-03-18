import { useState, useRef, useLayoutEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar,
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

type PorDiaItem = { date: string; dateKey?: string; abertos?: number; fechados?: number; count?: number };
type PorMesItem = { mes: string; mesKey?: string; abertos?: number; fechados?: number; count?: number };

interface ChamadosPorPeriodoChartProps {
  dataDia: PorDiaItem[];
  dataMes: PorMesItem[];
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
  const getAbertos = (r: PorDiaItem | PorMesItem) => r.abertos ?? (r as { count?: number }).count ?? 0;
  const getFechados = (r: PorDiaItem | PorMesItem) => r.fechados ?? 0;
  const safeDia = Array.isArray(dataDia) ? dataDia : [];
  const safeMes = Array.isArray(dataMes) ? dataMes : [];
  const chartDataDia = safeDia.map((d) => ({
    ...d,
    abertos: getAbertos(d),
    fechados: getFechados(d),
  }));
  const chartDataMes = safeMes.map((d) => ({
    ...d,
    abertos: getAbertos(d),
    fechados: getFechados(d),
  }));
  const isEmpty =
    effectiveViewMode === "dia" ? chartDataDia.length === 0 : chartDataMes.length === 0;
  const colorAbertos = "#dc2626";
  const colorFechados = "#2563eb";
  const showPorMes = effectiveViewMode === "mes";
  const chartData = showPorMes ? chartDataMes : chartDataDia;
  const useDateKey =
    periodKey === "custom" &&
    !showPorMes &&
    chartDataDia.some((r) => Boolean((r as PorDiaItem).dateKey));
  const useMesKey =
    periodKey === "custom" &&
    showPorMes &&
    chartDataMes.some((r) => Boolean((r as PorMesItem).mesKey));
  const dataKeyX = useMesKey ? "mesKey" : useDateKey ? "dateKey" : showPorMes ? "mes" : "date";

  const xTickFormatter = (v: string | number) => {
    const s = String(v ?? "");
    if (useDateKey) {
      const row = chartDataDia.find((r) => r.dateKey === s);
      return row?.date ?? s;
    }
    if (useMesKey) {
      const row = chartDataMes.find((r) => r.mesKey === s);
      return row?.mes ?? s;
    }
    return s;
  };

  const tooltipLabel = (_: unknown, payload: Array<{ payload?: Record<string, unknown> }> | undefined) => {
    const p = payload?.[0]?.payload;
    if (!p) return "";
    if (useDateKey && typeof p.date === "string") return p.date;
    if (useMesKey && typeof p.mes === "string") return p.mes;
    if (typeof p[dataKeyX] === "string") return p[dataKeyX] as string;
    return "";
  };

  const handleViewModeChange = (mode: "dia" | "mes") => {
    setViewMode(mode);
    onCustomViewModeChange?.(mode);
  };

  const legendWrapperStyle = {
    paddingTop: 4,
    lineHeight: 1.2,
  } as const;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          boxShadow: `0 0 24px ${alpha(secondaryColor, 0.28)}, 0 0 48px ${alpha(secondaryColor, 0.12)}`,
        },
      }}
    >
      <CardHeader
        title={
          <Typography variant="subtitle1" fontWeight={600} sx={{ whiteSpace: "nowrap" }}>
            Chamados por período
          </Typography>
        }
        action={
          periodKey === "custom" ? (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, v) => v != null && handleViewModeChange(v)}
              size="small"
              sx={{ flexShrink: 0 }}
            >
              <ToggleButton value="dia">Por dia</ToggleButton>
              <ToggleButton value="mes">Por mês</ToggleButton>
            </ToggleButtonGroup>
          ) : undefined
        }
        sx={{
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          "& .MuiCardHeader-action": { m: 0, alignSelf: "center" },
        }}
      />
      <CardContent sx={{ pt: 0, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {isEmpty ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={6}>
            Sem dados disponíveis.
          </Typography>
        ) : (
          <Box sx={{ width: "100%", height: { xs: 220, sm: 260 }, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey={dataKeyX}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={xTickFormatter}
                  interval={periodKey === "custom" && chartData.length > 14 ? "preserveStartEnd" : 0}
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  labelFormatter={tooltipLabel}
                  formatter={(value: number, name: string) => [
                    value,
                    String(name).toLowerCase() === "abertos" ? "Abertos" : "Fechados",
                  ]}
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    boxShadow: theme.shadows[2],
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={legendWrapperStyle}
                />
                <Bar dataKey="fechados" name="Fechados" fill={colorFechados} radius={4}>
                  <LabelList
                    dataKey="fechados"
                    position="top"
                    fill={colorFechados}
                    fontSize={11}
                    formatter={(value: number) => (value === 0 ? "" : value)}
                  />
                </Bar>
                <Line
                  type="monotone"
                  dataKey="abertos"
                  name="Abertos"
                  stroke={colorAbertos}
                  strokeWidth={2}
                  dot={{ fill: colorAbertos, r: 4 }}
                >
                  <LabelList
                    dataKey="abertos"
                    position="top"
                    fill={colorAbertos}
                    fontSize={11}
                    formatter={(value: number) => (value === 0 ? "" : value)}
                  />
                </Line>
              </ComposedChart>
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

/** Cores do gráfico rosca por setor (verde-amarelo e roxo). */
const SETOR_COLOR_MAP: Record<string, string> = {
  Administrativo: "#8a00c4",
  Industrial: "#a8d001",
  Comercial: "#8a00c4",
};

/** Apenas Indústria e Administrativo (Comercial ignorado). */
const SETORES_DONUT = ["Industrial", "Administrativo"];

export function TicketsBySetorDonut({ data }: PorSetorProps) {
  const theme = useTheme();
  const filtered = data.filter((d) => SETORES_DONUT.includes(d.setor));
  const glowColor = theme.palette.primary.main;

  const donutLegendStyle = {
    paddingTop: 4,
    lineHeight: 1.2,
  } as const;

  return (
    <Card
      sx={{
        width: "100%",
        minWidth: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
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
      <CardContent sx={{ pt: 0, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={6}>
            Sem dados disponíveis.
          </Typography>
        ) : (
          <Box sx={{ width: "100%", height: { xs: 220, sm: 260 }, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
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
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={donutLegendStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/** Velocímetro: percentual de chamados resolvidos. Arco verde, ponteiro, hub central, labels 0% / 100%, percentual abaixo. */
const GAUGE_FILL = "#2ee39a";
const GAUGE_BG_LIGHT = "#e4e4e9";
const GAUGE_BG_DARK = "#333";
const GAUGE_HUB = "#5a5a5a";
const GAUGE_POINTER = "#9e9e9e";
/** Raio interno/externo da barra (mesmos % do RadialBarChart). */
const GAUGE_INNER_FRAC = 0.35;
const GAUGE_OUTER_FRAC = 0.62;
/** Raio efetivo do Recharts ≈ este fator × min(largura, altura) / 2 (overlay alinhado ao SVG). */
const GAUGE_EFFECTIVE_RADIUS_FACTOR = 0.742;

function gaugePointerLengthPx(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 0;
  const minSide = Math.min(width, height);
  const effectiveMaxR = (minSide / 2) * GAUGE_EFFECTIVE_RADIUS_FACTOR;
  const midOfGreen = (GAUGE_INNER_FRAC + GAUGE_OUTER_FRAC) / 2;
  return Math.max(8, midOfGreen * effectiveMaxR);
}

interface ResolvidosGaugeProps {
  total: number;
  concluidos: number;
}

export function ResolvidosGauge({ total, concluidos }: ResolvidosGaugeProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const glowColor = theme.palette.primary.main;
  const percent = total > 0 ? Math.min(100, (concluidos / total) * 100) : 0;
  const percentRounded = Math.round(percent);
  const data = [{ name: "resolvidos", value: percent, fill: GAUGE_FILL }];
  const gaugeBg = isDark ? GAUGE_BG_DARK : GAUGE_BG_LIGHT;
  const pointerAngle = -90 + (percent / 100) * 180;
  const gaugeWrapRef = useRef<HTMLDivElement>(null);
  const [pointerLenPx, setPointerLenPx] = useState(0);

  useLayoutEffect(() => {
    const el = gaugeWrapRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setPointerLenPx(gaugePointerLengthPx(r.width, r.height));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hubPx =
    pointerLenPx > 0
      ? Math.max(10, Math.min(16, Math.round(pointerLenPx * 0.26)))
      : 14;

  return (
    <Card
      sx={{
        width: "100%",
        minWidth: 0,
        "&:hover": {
          boxShadow: `0 0 24px ${alpha(glowColor, 0.28)}, 0 0 48px ${alpha(glowColor, 0.12)}`,
        },
      }}
    >
      <CardHeader
        title={
          <Typography variant="subtitle1" fontWeight={600}>
            Chamados resolvidos
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0, position: "relative", overflow: "hidden" }}>
        <Box
          ref={gaugeWrapRef}
          sx={{
            width: "100%",
            height: { xs: 220, sm: 260 },
            position: "relative",
            minWidth: 0,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="35%"
              outerRadius="62%"
              data={data}
              startAngle={180}
              endAngle={0}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <RadialBar
                dataKey="value"
                background={{ fill: gaugeBg }}
                cornerRadius={10}
                isAnimationActive
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 2,
              height: pointerLenPx > 0 ? `${pointerLenPx}px` : "18%",
              backgroundColor: GAUGE_POINTER,
              transformOrigin: "50% 100%",
              transform: `translate(-50%, -100%) rotate(${pointerAngle}deg)`,
              borderRadius: 1,
              pointerEvents: "none",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: hubPx,
              height: hubPx,
              borderRadius: "50%",
              backgroundColor: GAUGE_HUB,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />
        </Box>
        <Typography
          variant="h4"
          fontWeight={700}
          textAlign="center"
          sx={{
            mt: 1,
            color: "text.primary",
            fontSize: { xs: "1.5rem", sm: "2rem" },
          }}
        >
          {percentRounded}%
        </Typography>
      </CardContent>
    </Card>
  );
}

