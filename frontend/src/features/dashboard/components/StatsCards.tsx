import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TicketCheck,
} from "lucide-react";

interface StatsCardsProps {
  total: number;
  abertos: number;
  emAndamento: number;
  concluidos: number;
}

const ICON_SIZE = 18;

const stats = [
  { key: "total", label: "Total", icon: TicketCheck, colorKey: "primary" as const },
  { key: "abertos", label: "Abertos", icon: AlertCircle, colorKey: "error" as const },
  { key: "emAndamento", label: "Em Andamento", icon: Clock, colorKey: "warning" as const },
  { key: "concluidos", label: "Concluidos", icon: CheckCircle2, colorKey: "success" as const },
] as const;

export function StatsCards({ total, abertos, emAndamento, concluidos }: StatsCardsProps) {
  const theme = useTheme();
  const values: Record<string, number> = { total, abertos, emAndamento, concluidos };

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" },
      }}
    >
      {stats.map((s) => {
        const color = theme.palette[s.colorKey].main;
        return (
          <Card key={s.key} sx={{ borderLeft: `3px solid ${color}` }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, py: "12px !important" }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: alpha(color, 0.1),
                  color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <s.icon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {s.label}
                </Typography>
                <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
                  {values[s.key]}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
