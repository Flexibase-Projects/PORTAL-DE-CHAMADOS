import { useState, useRef, useLayoutEffect, useId } from "react";
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
  PolarAngleAxis,
} from "recharts";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import { FONT_STACK_PERCENT_SYMBOL } from "@/theme/fontFamily";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { Maximize2 } from "lucide-react";
import { ChartFullscreenDialog } from "./ChartFullscreenDialog";
import type { PeriodKey } from "../dashboardPeriod";
type PorDiaItem = { date: string; dateKey?: string; abertos?: number; fechados?: number; pausados?: number; count?: number };
type PorMesItem = { mes: string; mesKey?: string; abertos?: number; fechados?: number; pausados?: number; count?: number };
const DASHBOARD_BAR_GRADIENT_LIGHT = { from: "#111184", to: "#132937" } as const;
const DASHBOARD_BAR_GRADIENT_DARK = { from: "#4f86ff", to: "#60a5fa" } as const;
/** Mesmos tons dos números/labels em `StatsCards` (claro / escuro). */
const STAT_CARD_VALUE_COLOR_LIGHT = "#111184";
const STAT_CARD_VALUE_COLOR_DARK = "#60a5fa";

function ChartExpandButton({ onClick, ariaLabel }: { onClick: () => void; ariaLabel: string }) {
  return (
    <IconButton
      size="small"
      onClick={onClick}
      aria-label={ariaLabel}
      sx={{ color: "text.secondary", "&:hover": { color: "primary.main", bgcolor: "action.hover" } }}
    >
      <Maximize2 size={18} />
    </IconButton>
  );
}

/** Glow no hover dos cards de gráfico do dashboard (tom do card “Chamados por período”). */
function dashboardChartCardHoverShadow(theme: Theme) {
  const c = theme.palette.mode === "dark" ? theme.palette.secondary.main : "#111184";
  return `0 0 28px ${alpha(c, 0.34)}, 0 0 56px ${alpha(c, 0.16)}`;
}

function ChamadosPorPeriodoPlot({
  chartData,
  chartMargin,
  labelFontSize,
  pointCount,
  dataKeyX,
  xTickFormatter,
  tooltipLabel,
  periodKey,
  fechadosGradientId,
  heightSx,
  resizeKey,
}: {
  chartData: (PorDiaItem | PorMesItem)[];
  chartMargin: { top: number; right: number; left: number; bottom: number };
  labelFontSize: number;
  pointCount: number;
  dataKeyX: string;
  xTickFormatter: (v: string | number) => string;
  tooltipLabel: (_: unknown, payload: Array<{ payload?: Record<string, unknown> }> | undefined) => string;
  periodKey: PeriodKey;
  fechadosGradientId: string;
  heightSx: SxProps<Theme>;
  resizeKey?: string | number | boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const barGradient = isDark ? DASHBOARD_BAR_GRADIENT_DARK : DASHBOARD_BAR_GRADIENT_LIGHT;
  const fillFechados = `url(#${fechadosGradientId})`;
  const colorFechadosLabel = isDark ? STAT_CARD_VALUE_COLOR_DARK : STAT_CARD_VALUE_COLOR_LIGHT;
  const colorAbertos = "#FA9E00";
  const legendWrapperStyle = { paddingTop: 4, lineHeight: 1.2 } as const;

  return (
    <Box sx={[{ width: "100%", flexShrink: 0, minHeight: 0 }, heightSx] as SxProps<Theme>}>
      <ResponsiveContainer key={String(resizeKey ?? "a")} width="100%" height="100%">
        <ComposedChart data={chartData} margin={chartMargin as { top: number; right: number; bottom: number; left: number }}>
          <defs>
            <linearGradient id={fechadosGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={barGradient.from} />
              <stop offset="100%" stopColor={barGradient.to} />
            </linearGradient>
          </defs>
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
            formatter={(value: number, name: string) => {
              const n = String(name).toLowerCase();
              if (n === "abertos") return [value, "Abertos"];
              if (n === "fechados") return [value, "Fechados"];
              return [value, name];
            }}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[2],
            }}
          />
          <Legend verticalAlign="bottom" align="center" wrapperStyle={legendWrapperStyle} />
          <Bar dataKey="fechados" name="Fechados" fill={fillFechados} radius={4}>
            <LabelList
              dataKey="fechados"
              position="top"
              offset={8}
              fill={colorFechadosLabel}
              fontSize={labelFontSize}
              formatter={(value: number) => (value === 0 ? "" : value)}
            />
          </Bar>
          <Line
            type="monotone"
            dataKey="abertos"
            name="Abertos"
            stroke={colorAbertos}
            strokeWidth={2}
            dot={{ fill: colorAbertos, r: pointCount > 20 ? 3 : 4 }}
          >
            <LabelList
              dataKey="abertos"
              position="top"
              offset={22}
              fill={colorAbertos}
              fontSize={labelFontSize}
              formatter={(value: number) => (value === 0 ? "" : value)}
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}

interface ChamadosPorPeriodoChartProps {
  dataDia: PorDiaItem[];
  dataMes: PorMesItem[];
  periodKey: PeriodKey;
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
  const [viewMode, setViewMode] = useState<"dia" | "mes">(customViewMode);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const uid = useId().replace(/:/g, "");
  const dialogTitleId = `chart-fs-periodo-${uid}`;
  const gradCard = `fechadosGrad-${uid}-card`;
  const gradDialog = `fechadosGrad-${uid}-dialog`;

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

  const pointCount = chartData.length;
  const chartMargin = {
    top: pointCount > 28 ? 72 : pointCount > 18 ? 62 : pointCount > 10 ? 52 : 44,
    right: 12,
    left: 6,
    bottom: pointCount > 22 ? 14 : 10,
  };
  const labelFontSize = pointCount > 24 ? 10 : pointCount > 16 ? 11 : 13;
  const chartBoxHeightXs = Math.min(400, Math.max(220, 196 + pointCount * 2.85));
  const chartBoxHeightSm = Math.min(440, Math.max(260, 232 + pointCount * 2.85));

  const plotProps = {
    chartData,
    chartMargin,
    labelFontSize,
    pointCount,
    dataKeyX,
    xTickFormatter,
    tooltipLabel,
    periodKey,
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          boxShadow: dashboardChartCardHoverShadow(theme),
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
          <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap" useFlexGap>
            <ChartExpandButton
              onClick={() => setFullscreenOpen(true)}
              ariaLabel="Abrir gráfico Chamados por período ampliado"
            />
            {periodKey === "custom" ? (
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
            ) : null}
          </Stack>
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
          <ChamadosPorPeriodoPlot
            {...plotProps}
            fechadosGradientId={gradCard}
            heightSx={{ height: { xs: `${chartBoxHeightXs}px`, sm: `${chartBoxHeightSm}px` } }}
          />
        )}
      </CardContent>
      <ChartFullscreenDialog
        open={fullscreenOpen && !isEmpty}
        onClose={() => setFullscreenOpen(false)}
        title="Chamados por período"
        titleId={dialogTitleId}
      >
        <Box sx={{ flex: 1, minHeight: 360, width: "100%" }}>
          <ChamadosPorPeriodoPlot
            {...plotProps}
            fechadosGradientId={gradDialog}
            heightSx={{ height: "100%" }}
            resizeKey={fullscreenOpen}
          />
        </Box>
      </ChartFullscreenDialog>
    </Card>
  );
}

interface BarChartProps {
  data: { area: string; count: number }[];
  filterSetor: string | null;
  getSetor: (area: string) => string | null;
}

/** Mesmas cores de barras do dashboard (#111184 -> #132937). */
const DEPT_BAR_GRADIENT_LIGHT = { from: "#111184", to: "#132937" } as const;
const DEPT_BAR_GRADIENT_DARK = { from: "#4f86ff", to: "#60a5fa" } as const;

function DepartmentBarPlot({
  filteredData,
  heightSx,
  resizeKey,
  yAxisWidth,
  barGradientId,
}: {
  filteredData: { area: string; count: number }[];
  heightSx: SxProps<Theme>;
  resizeKey?: string | number | boolean;
  yAxisWidth: number;
  barGradientId: string;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const deptBarGradient = isDark ? DEPT_BAR_GRADIENT_DARK : DEPT_BAR_GRADIENT_LIGHT;
  const fillDept = `url(#${barGradientId})`;
  return (
    <Box sx={[{ width: "100%", minHeight: 0 }, heightSx] as SxProps<Theme>}>
      <ResponsiveContainer key={String(resizeKey ?? "a")} width="100%" height="100%">
        <BarChart data={filteredData} layout="vertical" margin={{ left: 8, right: 8 }}>
          <defs>
            <linearGradient id={barGradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={deptBarGradient.from} />
              <stop offset="100%" stopColor={deptBarGradient.to} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis
            dataKey="area"
            type="category"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={yAxisWidth}
          />
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
          <Bar dataKey="count" name="Chamados" fill={fillDept} radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function DepartmentBarChart({ data, filterSetor, getSetor }: BarChartProps) {
  const theme = useTheme();
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const uid = useId().replace(/:/g, "");
  const dialogTitleId = `chart-fs-dept-${uid}`;
  const gradDeptCard = `deptChamadosGrad-${uid}-card`;
  const gradDeptDialog = `deptChamadosGrad-${uid}-dialog`;

  const filteredData = filterSetor
    ? data.filter((row) => getSetor(row.area) === filterSetor)
    : data;

  return (
    <Card
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        "&:hover": {
          boxShadow: dashboardChartCardHoverShadow(theme),
        },
      }}
    >
      <CardHeader
        title={
          <Typography variant="subtitle1" fontWeight={600}>
            Por Departamento
          </Typography>
        }
        action={
          <ChartExpandButton
            onClick={() => setFullscreenOpen(true)}
            ariaLabel="Abrir gráfico Por Departamento ampliado"
          />
        }
        sx={{ flexShrink: 0, "& .MuiCardHeader-action": { m: 0, alignSelf: "center" } }}
      />
      <CardContent sx={{ pt: 0, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {filteredData.length === 0 ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: { xs: 220, sm: 250 } }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Sem dados disponíveis.
            </Typography>
          </Box>
        ) : (
          <DepartmentBarPlot
            filteredData={filteredData}
            barGradientId={gradDeptCard}
            heightSx={{ flex: 1, minHeight: { xs: 220, sm: 250 } }}
            yAxisWidth={100}
          />
        )}
      </CardContent>
      <ChartFullscreenDialog
        open={fullscreenOpen && filteredData.length > 0}
        onClose={() => setFullscreenOpen(false)}
        title="Por Departamento"
        titleId={dialogTitleId}
      >
        <Box sx={{ flex: 1, minHeight: 360, width: "100%" }}>
          <DepartmentBarPlot
            filteredData={filteredData}
            barGradientId={gradDeptDialog}
            heightSx={{ height: "100%" }}
            resizeKey={fullscreenOpen}
            yAxisWidth={140}
          />
        </Box>
      </ChartFullscreenDialog>
    </Card>
  );
}

interface PorSetorProps {
  data: { setor: string; count: number }[];
}

const SETOR_COLOR_MAP: Record<string, string> = {
  Administrativo: "#111184",
  Industrial: "#FAD500",
  Comercial: "#111184",
};

/** Gradientes horizontais (esquerda → direita) por fatia da rosca. */
const SETOR_GRADIENT_STOPS: Record<string, { from: string; to: string }> = {
  Industrial: { from: "#FAD500", to: "#FAB700" },
  Administrativo: { from: "#111184", to: "#132937" },
  Comercial: { from: "#111184", to: "#132937" },
};
const SETOR_GRADIENT_STOPS_DARK: Record<string, { from: string; to: string }> = {
  Industrial: { from: "#FAD500", to: "#FAB700" },
  Administrativo: { from: "#4f86ff", to: "#60a5fa" },
  Comercial: { from: "#4f86ff", to: "#60a5fa" },
};

const SETORES_DONUT = ["Industrial", "Administrativo"];

function setorGradientIdForRow(
  setor: string,
  ids: { industrial: string; administrativo: string; fallback: string }
): string {
  if (setor === "Industrial") return ids.industrial;
  if (setor === "Administrativo" || setor === "Comercial") return ids.administrativo;
  return ids.fallback;
}

function TicketsBySetorDonutPlot({
  filtered,
  heightSx,
  resizeKey,
  industrialGradientId,
  administrativoGradientId,
  fallbackGradientId,
}: {
  filtered: { setor: string; count: number }[];
  heightSx: SxProps<Theme>;
  resizeKey?: string | number | boolean;
  industrialGradientId: string;
  administrativoGradientId: string;
  fallbackGradientId: string;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const donutLegendStyle = { paddingTop: 4, lineHeight: 1.2 } as const;
  const gradientStops = isDark ? SETOR_GRADIENT_STOPS_DARK : SETOR_GRADIENT_STOPS;
  const indStops = gradientStops.Industrial;
  const admStops = gradientStops.Administrativo;

  return (
    <Box sx={[{ width: "100%", flexShrink: 0, minHeight: 0 }, heightSx] as SxProps<Theme>}>
      <ResponsiveContainer key={String(resizeKey ?? "a")} width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
          <defs>
            <linearGradient id={industrialGradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={indStops.from} />
              <stop offset="100%" stopColor={indStops.to} />
            </linearGradient>
            <linearGradient id={administrativoGradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={admStops.from} />
              <stop offset="100%" stopColor={admStops.to} />
            </linearGradient>
            <linearGradient id={fallbackGradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#46DCFA" />
              <stop offset="100%" stopColor="#498DF2" />
            </linearGradient>
          </defs>
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
            {filtered.map((row, i) => {
              const gid = setorGradientIdForRow(row.setor, {
                industrial: industrialGradientId,
                administrativo: administrativoGradientId,
                fallback: fallbackGradientId,
              });
              return <Cell key={i} fill={`url(#${gid})`} stroke="none" />;
            })}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0];
              const setor = item.payload?.setor ?? item.name ?? "";
              const count = item.payload?.count ?? item.value ?? 0;
              const baseColor = SETOR_COLOR_MAP[setor] ?? "#888";
              const fillColor =
                isDark && setor === "Administrativo" ? "#60a5fa" : baseColor;
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
          <Legend verticalAlign="bottom" align="center" wrapperStyle={donutLegendStyle} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function TicketsBySetorDonut({ data }: PorSetorProps) {
  const theme = useTheme();
  const filtered = data.filter((d) => SETORES_DONUT.includes(d.setor));
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const uid = useId().replace(/:/g, "");
  const dialogTitleId = `chart-fs-donut-${uid}`;
  const gradIndCard = `setorInd-${uid}-card`;
  const gradAdmCard = `setorAdm-${uid}-card`;
  const gradFbCard = `setorFb-${uid}-card`;
  const gradIndDlg = `setorInd-${uid}-dlg`;
  const gradAdmDlg = `setorAdm-${uid}-dlg`;
  const gradFbDlg = `setorFb-${uid}-dlg`;

  return (
    <Card
      sx={{
        width: "100%",
        minWidth: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          boxShadow: dashboardChartCardHoverShadow(theme),
        },
      }}
    >
      <CardHeader
        title={
          <Typography variant="subtitle1" fontWeight={600}>
            Chamados por Setor
          </Typography>
        }
        action={
          <ChartExpandButton
            onClick={() => setFullscreenOpen(true)}
            ariaLabel="Abrir gráfico Chamados por Setor ampliado"
          />
        }
        sx={{ "& .MuiCardHeader-action": { m: 0, alignSelf: "center" } }}
      />
      <CardContent sx={{ pt: 0, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={6}>
            Sem dados disponíveis.
          </Typography>
        ) : (
          <TicketsBySetorDonutPlot
            filtered={filtered}
            heightSx={{ height: { xs: 220, sm: 260 } }}
            industrialGradientId={gradIndCard}
            administrativoGradientId={gradAdmCard}
            fallbackGradientId={gradFbCard}
          />
        )}
      </CardContent>
      <ChartFullscreenDialog
        open={fullscreenOpen && filtered.length > 0}
        onClose={() => setFullscreenOpen(false)}
        title="Chamados por Setor"
        titleId={dialogTitleId}
      >
        <Box sx={{ flex: 1, minHeight: 360, width: "100%" }}>
          <TicketsBySetorDonutPlot
            filtered={filtered}
            heightSx={{ height: "100%" }}
            resizeKey={fullscreenOpen}
            industrialGradientId={gradIndDlg}
            administrativoGradientId={gradAdmDlg}
            fallbackGradientId={gradFbDlg}
          />
        </Box>
      </ChartFullscreenDialog>
    </Card>
  );
}

const GAUGE_BG_LIGHT = "#b8b8b8";
const GAUGE_BG_DARK = "#555";
const GAUGE_HUB = "#5a5a5a";
const GAUGE_POINTER = "#9e9e9e";
const GAUGE_INNER_FRAC = 0.35;
const GAUGE_OUTER_FRAC = 0.9;
const GAUGE_POINTER_RADIUS_FACTOR = 0.72;

const percentGlyphSx = {
  fontFamily: FONT_STACK_PERCENT_SYMBOL,
  fontWeight: 700,
  marginLeft: "0.05em",
} as const;

function safeNonNegativeNumber(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x) || x < 0) return 0;
  return x;
}

function gaugePointerLengthPx(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 0;
  const minSide = Math.min(width, height);
  const midOfGreen = (GAUGE_INNER_FRAC + GAUGE_OUTER_FRAC) / 2;
  return Math.max(8, midOfGreen * (minSide / 2) * GAUGE_POINTER_RADIUS_FACTOR);
}

function ResolvidosGaugePlot({
  total,
  concluidos,
  gradientId,
  heightSx,
  resizeKey,
}: {
  total: number;
  concluidos: number;
  gradientId: string;
  heightSx: SxProps<Theme>;
  resizeKey?: string | number | boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const totalN = safeNonNegativeNumber(total);
  const conclN = safeNonNegativeNumber(concluidos);
  const percent = totalN > 0 ? Math.min(100, (conclN / totalN) * 100) : 0;
  const data = [{ name: "resolvidos", value: percent, fill: `url(#${gradientId})` }];
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
  }, [resizeKey]);

  const hubPx =
    pointerLenPx > 0
      ? Math.max(10, Math.min(16, Math.round(pointerLenPx * 0.26)))
      : 14;

  return (
    <Box
      ref={gaugeWrapRef}
      sx={
        [
          {
            width: "100%",
            flexShrink: 0,
            position: "relative",
            minWidth: 0,
          },
          heightSx,
        ] as SxProps<Theme>
      }
    >
      <ResponsiveContainer key={String(resizeKey ?? "a")} width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="35%"
          outerRadius="90%"
          data={data}
          startAngle={180}
          endAngle={0}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FAD500" />
              <stop offset="100%" stopColor="#FAB700" />
            </linearGradient>
          </defs>
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
  );
}

interface ResolvidosGaugeProps {
  total: number;
  concluidos: number;
}

export function ResolvidosGauge({ total, concluidos }: ResolvidosGaugeProps) {
  const theme = useTheme();
  const totalN = safeNonNegativeNumber(total);
  const conclN = safeNonNegativeNumber(concluidos);
  const percentRounded = Math.round(totalN > 0 ? Math.min(100, (conclN / totalN) * 100) : 0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const uid = useId().replace(/:/g, "");
  const dialogTitleId = `chart-fs-gauge-${uid}`;
  const gradCard = `gaugeGrad-${uid}-card`;
  const gradDialog = `gaugeGrad-${uid}-dialog`;

  return (
    <Card
      sx={{
        width: "100%",
        minWidth: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          boxShadow: dashboardChartCardHoverShadow(theme),
        },
      }}
    >
      <CardHeader
        title={
          <Typography variant="subtitle1" fontWeight={600}>
            Chamados resolvidos
          </Typography>
        }
        action={
          <ChartExpandButton
            onClick={() => setFullscreenOpen(true)}
            ariaLabel="Abrir gráfico Chamados resolvidos ampliado"
          />
        }
        sx={{ "& .MuiCardHeader-action": { m: 0, alignSelf: "center" } }}
      />
      <CardContent
        sx={{
          pt: 0,
          flex: 1,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <ResolvidosGaugePlot
          total={total}
          concluidos={concluidos}
          gradientId={gradCard}
          heightSx={{ height: { xs: 220, sm: 260 } }}
        />
        <Typography
          variant="h4"
          component="div"
          role="status"
          aria-label={`${percentRounded} por cento`}
          fontWeight={700}
          textAlign="center"
          sx={{
            mt: 1,
            color: "text.primary",
            fontSize: { xs: "1.5rem", sm: "2rem" },
          }}
        >
          <Box component="span" aria-hidden="true" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {percentRounded}
          </Box>
          <Box component="span" aria-hidden="true" sx={percentGlyphSx}>
            %
          </Box>
        </Typography>
      </CardContent>
      <ChartFullscreenDialog
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        title="Chamados resolvidos"
        titleId={dialogTitleId}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 360,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box sx={{ flex: 1, width: "100%", minHeight: 320 }}>
            <ResolvidosGaugePlot
              total={total}
              concluidos={concluidos}
              gradientId={gradDialog}
              heightSx={{ height: "100%" }}
              resizeKey={fullscreenOpen}
            />
          </Box>
          <Typography
            variant="h4"
            component="div"
            role="status"
            aria-label={`${percentRounded} por cento`}
            fontWeight={700}
            sx={{ mt: 1 }}
          >
            <Box component="span" aria-hidden="true" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {percentRounded}
            </Box>
            <Box component="span" aria-hidden="true" sx={percentGlyphSx}>
              %
            </Box>
          </Typography>
        </Box>
      </ChartFullscreenDialog>
    </Card>
  );
}
