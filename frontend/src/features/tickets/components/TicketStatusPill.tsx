import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { HelpCircle, Clock, CheckCircle2 } from "lucide-react";
import type { TicketStatus } from "@/types/ticket";

export function TicketStatusPill({ status }: { status: TicketStatus }) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const openBg = alpha(theme.palette.error.main, dark ? 0.22 : 0.12);
  const openFg = dark ? theme.palette.error.light : theme.palette.error.dark;

  /** Âmbar fixo: `palette.warning.light` no tema escuro é translúcido e some no texto. */
  const progressBg = dark ? alpha("#FBBF24", 0.34) : alpha("#F59E0B", 0.22);
  const progressFg = dark ? "#FEF08A" : "#92400E";

  const doneBg = alpha(theme.palette.success.main, dark ? 0.22 : 0.12);
  const doneFg = dark ? theme.palette.success.light : theme.palette.success.dark;

  const map = {
    Aberto: { Icon: HelpCircle, bg: openBg, fg: openFg, label: "Aberto" as const },
    "Em Andamento": { Icon: Clock, bg: progressBg, fg: progressFg, label: "Em atendimento" as const },
    Concluído: { Icon: CheckCircle2, bg: doneBg, fg: doneFg, label: "Encerrado" as const },
  };

  const cfg = map[status] ?? map.Aberto;
  const { Icon, bg, fg, label } = cfg;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.625,
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        bgcolor: bg,
        color: fg,
        maxWidth: "100%",
      }}
    >
      <Icon size={16} strokeWidth={2} aria-hidden />
      <Typography component="span" variant="caption" sx={{ fontWeight: 600, color: "inherit", lineHeight: 1.2, whiteSpace: "nowrap" }}>
        {label}
      </Typography>
    </Box>
  );
}
