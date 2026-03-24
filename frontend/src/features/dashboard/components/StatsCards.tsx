import { useTheme, alpha } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { FONT_STACK_PERCENT_SYMBOL } from "@/theme/fontFamily";

interface StatsCardsProps {
  total: number;
  abertos: number;
  emAndamento: number;
  concluidos: number;
}

type StatKey = "total" | "abertos" | "emAndamento" | "concluidos";

const CARD_ACCENT: Record<StatKey, string> = {
  total: "#00072d",
  abertos: "#051650",
  emAndamento: "#0A2472",
  concluidos: "#123499",
};
const CARD_TEXT_COLOR_LIGHT = "#111184";
const CARD_TEXT_COLOR_DARK = "#60a5fa";

const stats: readonly { key: StatKey; label: string }[] = [
  { key: "total", label: "Total" },
  { key: "abertos", label: "Abertos" },
  { key: "emAndamento", label: "Em Andamento" },
  { key: "concluidos", label: "Concluidos" },
];

function percentForCard(key: StatKey, count: number, totalAll: number): number {
  if (key === "total") return 100;
  if (totalAll <= 0) return 0;
  return Math.round((count / totalAll) * 100);
}

export function StatsCards({ total, abertos, emAndamento, concluidos }: StatsCardsProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
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
        const color = isDark ? CARD_TEXT_COLOR_DARK : CARD_TEXT_COLOR_LIGHT;
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
                background: "transparent",
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
                <Typography variant="caption" fontWeight={600} sx={{ color, flexShrink: 0 }} component="span">
                  <Box component="span" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {pct}
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      fontFamily: FONT_STACK_PERCENT_SYMBOL,
                      fontWeight: 600,
                      marginLeft: "0.05em",
                    }}
                  >
                    %
                  </Box>
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: 5,
                    borderRadius: 2.5,
                    bgcolor: "background.default",
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
