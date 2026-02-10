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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Popover from "@mui/material/Popover";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { Calendar } from "lucide-react";

// --- Card unificado: Chamados por dia / por mês / intervalo customizado ---

interface ChamadosPorPeriodoChartProps {
  dataDia: { date: string; count: number }[];
  dataMes: { mes: string; count: number }[];
  /** Dados do intervalo customizado por dia (já filtrados por setor). */
  dataDiaCustom: { date: string; count: number }[] | null;
  /** Dados do intervalo customizado por mês (já filtrados por setor). */
  dataMesCustom: { mes: string; count: number }[] | null;
  /** Chamado quando o usuário define data inicial e final no período customizado. */
  onCustomRangeChange: (dateFrom: string, dateTo: string) => void;
}

const PERIODO_COLORS = { dia: "#4caf50", mes: "#1976d2" };
const CARDS_BORDER = "#7289d9";

const todayStr = () => new Date().toISOString().split("T")[0];

export function ChamadosPorPeriodoChart({
  dataDia,
  dataMes,
  dataDiaCustom,
  dataMesCustom,
  onCustomRangeChange,
}: ChamadosPorPeriodoChartProps) {
  const theme = useTheme();
  const secondaryColor = theme.palette.secondary.main;
  const [periodo, setPeriodo] = useState<"dia" | "mes" | "custom">("dia");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [customViewMode, setCustomViewMode] = useState<"dia" | "mes">("dia");

  const openPopover = (e: React.MouseEvent<HTMLElement>) => setPopoverAnchor(e.currentTarget);
  const closePopover = () => setPopoverAnchor(null);

  const applyCustomRange = () => {
    if (dateFrom && dateTo && dateFrom <= dateTo) {
      onCustomRangeChange(dateFrom, dateTo);
      closePopover();
    }
  };

  const isEmpty =
    periodo === "custom"
      ? customViewMode === "dia"
        ? !dataDiaCustom || dataDiaCustom.length === 0
        : !dataMesCustom || dataMesCustom.length === 0
      : (periodo === "dia" ? dataDia : dataMes).length === 0;
  const colorMes = PERIODO_COLORS.mes;
  const showLineChart =
    periodo === "mes" || (periodo === "custom" && customViewMode === "mes");
  const chartDataMes = periodo === "custom" ? (dataMesCustom ?? []) : dataMes;
  const chartDataDia =
    periodo === "custom" ? (dataDiaCustom ?? []) : periodo === "dia" ? dataDia : [];

  const cardHoverSx = {
    borderColor: CARDS_BORDER,
    transition: "box-shadow 0.25s ease, transform 0.25s ease",
    "&:hover": {
      boxShadow: `0 8px 24px ${alpha(CARDS_BORDER, 0.18)}`,
      transform: "translateY(-2px)",
    },
  };

  return (
    <Card variant="outlined" sx={cardHoverSx}>
      <CardHeader
        title={
          <Typography variant="subtitle1" fontWeight={600}>
            Chamados por período
          </Typography>
        }
        action={
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
            {periodo === "custom" && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Calendar size={18} />}
                  onClick={openPopover}
                  sx={{ borderColor: CARDS_BORDER, color: CARDS_BORDER }}
                >
                  {dateFrom && dateTo ? `${dateFrom} → ${dateTo}` : "Selecionar datas"}
                </Button>
                <Popover
                  open={Boolean(popoverAnchor)}
                  anchorEl={popoverAnchor}
                  onClose={closePopover}
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
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ max: dateTo || todayStr() }}
                    />
                    <TextField
                      size="small"
                      fullWidth
                      label="Data final"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: dateFrom, max: todayStr() }}
                    />
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 0.5 }}>
                      Exibir no período
                    </Typography>
                    <ToggleButtonGroup
                      value={customViewMode}
                      exclusive
                      onChange={(_, v) => v != null && setCustomViewMode(v)}
                      size="small"
                      fullWidth
                    >
                      <ToggleButton value="dia">Por dia</ToggleButton>
                      <ToggleButton value="mes">Por mês</ToggleButton>
                    </ToggleButtonGroup>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={applyCustomRange}
                      disabled={!dateFrom || !dateTo || dateFrom > dateTo}
                    >
                      Aplicar
                    </Button>
                  </Box>
                </Popover>
              </>
            )}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Período</InputLabel>
              <Select
                value={periodo}
                label="Período"
                onChange={(e) => setPeriodo(e.target.value as "dia" | "mes" | "custom")}
              >
                <MenuItem value="dia">Por dia (7 dias)</MenuItem>
                <MenuItem value="mes">Por mês</MenuItem>
                <MenuItem value="custom">Intervalo customizado</MenuItem>
              </Select>
            </FormControl>
          </Box>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {periodo === "custom" && !dateFrom && !dateTo ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={6}>
            Clique em &quot;Selecionar datas&quot; e escolha a data inicial e final no calendário.
          </Typography>
        ) : isEmpty ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={6}>
            Sem dados disponíveis.
          </Typography>
        ) : showLineChart ? (
          <Box sx={{ width: "100%", height: 250 }}>
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
          <Box sx={{ width: "100%", height: 250 }}>
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

  const cardHoverSx = {
    borderColor: CARDS_BORDER,
    transition: "box-shadow 0.25s ease, transform 0.25s ease",
    "&:hover": {
      boxShadow: `0 8px 24px ${alpha(CARDS_BORDER, 0.18)}`,
      transform: "translateY(-2px)",
    },
  };

  return (
    <Card variant="outlined" sx={cardHoverSx}>
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
          <Box sx={{ width: "100%", height: 250 }}>
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

/** Cores por setor: Administrativo = verde, Industrial = roxo (alinhado à legenda). */
const SETOR_COLOR_MAP: Record<string, string> = {
  Administrativo: "#81c784",
  Industrial: "#ba68c8",
};

/** Apenas Indústria e Administrativo (Comercial ignorado). */
const SETORES_DONUT = ["Industrial", "Administrativo"];

export function TicketsBySetorDonut({ data }: PorSetorProps) {
  const theme = useTheme();
  const filtered = data.filter((d) => SETORES_DONUT.includes(d.setor));

  const cardHoverSx = {
    borderColor: CARDS_BORDER,
    transition: "box-shadow 0.25s ease, transform 0.25s ease",
    "&:hover": {
      boxShadow: `0 8px 24px ${alpha(CARDS_BORDER, 0.18)}`,
      transform: "translateY(-2px)",
    },
  };

  return (
    <Card variant="outlined" sx={cardHoverSx}>
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
          <Box sx={{ width: "100%", height: 260 }}>
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

