import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
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

const TOTAL_BLUE = "#63B8F3";

const stats = [
  {
    key: "total",
    label: "Total de Chamados",
    icon: TicketCheck,
    color: TOTAL_BLUE,
    bg: alpha(TOTAL_BLUE, 0.2),
    borderColor: TOTAL_BLUE,
  },
  {
    key: "abertos",
    label: "Abertos",
    icon: AlertCircle,
    color: "error.main",
    bg: "error.light",
    borderColor: "error.main",
  },
  {
    key: "emAndamento",
    label: "Em Andamento",
    icon: Clock,
    color: "warning.main",
    bg: "warning.light",
    borderColor: "warning.main",
  },
  {
    key: "concluidos",
    label: "Concluídos",
    icon: CheckCircle2,
    color: "success.main",
    bg: "success.light",
    borderColor: "success.main",
  },
] as const;

export function StatsCards({
  total,
  abertos,
  emAndamento,
  concluidos,
}: StatsCardsProps) {
  const theme = useTheme();
  const values: Record<string, number> = {
    total,
    abertos,
    emAndamento,
    concluidos,
  };

  const getShadowColor = (borderColorKey: string) => {
    if (borderColorKey.startsWith("#")) return alpha(borderColorKey, 0.18);
    const color =
      borderColorKey === "error.main"
        ? theme.palette.error.main
        : borderColorKey === "warning.main"
          ? theme.palette.warning.main
          : borderColorKey === "success.main"
            ? theme.palette.success.main
            : theme.palette.primary.main;
    return alpha(color, 0.18);
  };

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
      }}
    >
      {stats.map((s) => (
        <Card
          key={s.key}
          variant="outlined"
          sx={{
            border: "1px solid",
            borderColor: s.borderColor,
            transition: "box-shadow 0.25s ease, transform 0.25s ease",
            "&:hover": {
              boxShadow: `0 8px 24px ${getShadowColor(s.borderColor)}`,
              transform: "translateY(-2px)",
            },
          }}
        >
          <CardHeader
            sx={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              pb: 0,
            }}
            title={
              <Typography variant="body2" color="text.secondary">
                {s.label}
              </Typography>
            }
            action={
              <Box
                sx={{
                  borderRadius: 1,
                  p: 1,
                  bgcolor: s.bg,
                  color: s.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <s.icon style={{ width: 20, height: 20 }} />
              </Box>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="h4" fontWeight={700}>
              {values[s.key]}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
