import { useTheme, alpha } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  DASHBOARD_TOTAL_BLUE,
  STATUS_COLOR_ABERTO,
  STATUS_COLOR_CONCLUIDO,
  STATUS_COLOR_EM_ANDAMENTO,
} from "@/constants/ticketStatusColors";

interface StatsCardsProps {
  total: number;
  abertos: number;
  emAndamento: number;
  concluidos: number;
}

type StatKey = "total" | "abertos" | "emAndamento" | "concluidos";

const stats: readonly { key: StatKey; label: string; color: string }[] = [
  { key: "total", label: "Total", color: DASHBOARD_TOTAL_BLUE },
  { key: "abertos", label: "Abertos", color: STATUS_COLOR_ABERTO },
  { key: "emAndamento", label: "Em Andamento", color: STATUS_COLOR_EM_ANDAMENTO },
  { key: "concluidos", label: "Concluidos", color: STATUS_COLOR_CONCLUIDO },
];

function percentForCard(key: StatKey, count: number, totalAll: number): number {
  if (key === "total") return 100;
  if (totalAll <= 0) return 0;
  return Math.round((count / totalAll) * 100);
}

export function StatsCards({ total, abertos, emAndamento, concluidos }: StatsCardsProps) {
  const theme = useTheme();
  const values: Record<StatKey, number> = { total, abertos, emAndamento, concluidos };

  return (
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
      {stats.map((s) => {
        const count = values[s.key];
        const color = s.color;
        const pct = percentForCard(s.key, count, total);
        const barWidth = s.key === "total" ? 100 : pct;

        return (
          <Card
            key={s.key}
            variant="outlined"
            elevation={0}
            sx={{
              borderRadius: 1.5,
              overflow: "hidden",
              "&:hover": {
                boxShadow: `0 0 20px ${alpha(color, 0.2)}, 0 0 40px ${alpha(color, 0.08)}`,
              },
            }}
          >
            <CardContent
              sx={{
                py: "14px !important",
                px: 2,
                background:
                  s.key === "abertos"
                    ? `linear-gradient(90deg, ${alpha(STATUS_COLOR_ABERTO, 0.22)} 0%, ${alpha(STATUS_COLOR_ABERTO, 0.07)} 46%, transparent 74%)`
                    : s.key === "emAndamento"
                      ? `linear-gradient(90deg, ${alpha(STATUS_COLOR_EM_ANDAMENTO, 0.22)} 0%, ${alpha(STATUS_COLOR_EM_ANDAMENTO, 0.07)} 46%, transparent 74%)`
                      : s.key === "concluidos"
                        ? `linear-gradient(90deg, ${alpha(STATUS_COLOR_CONCLUIDO, 0.22)} 0%, ${alpha(STATUS_COLOR_CONCLUIDO, 0.07)} 46%, transparent 74%)`
                        : `linear-gradient(90deg, ${alpha(color, 0.14)} 0%, transparent 72%)`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                  mb: 1.25,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: color,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    component="span"
                    variant="h5"
                    fontWeight={700}
                    lineHeight={1.15}
                    sx={{ color }}
                  >
                    {count}
                  </Typography>
                </Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  sx={{ color, textAlign: "right" }}
                  noWrap
                >
                  {s.label}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <Typography variant="caption" fontWeight={600} sx={{ color, flexShrink: 0 }}>
                  {pct}%
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: 5,
                    borderRadius: 2.5,
                    bgcolor: alpha(theme.palette.divider, 0.9),
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: `${barWidth}%`,
                      borderRadius: 2.5,
                      bgcolor: color,
                      transition: theme.transitions.create("width", { duration: 200 }),
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
