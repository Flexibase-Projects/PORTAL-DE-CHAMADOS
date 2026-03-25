import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { HelpCircle, Clock, CheckCircle2, Pause } from "lucide-react";
import { getTicketStatusAccent } from "@/features/tickets/ticketStatusAccent";
import type { TicketStatus } from "@/types/ticket";

export interface TicketStatusPillProps {
  status: TicketStatus;
  /** Célula de tabela: não encolhe abaixo do texto (evita “Em atendimento” cortado). */
  variant?: "default" | "tableCell";
}

export function TicketStatusPill({ status, variant = "default" }: TicketStatusPillProps) {
  const { fg, iconBg } = getTicketStatusAccent(status);
  const inTable = variant === "tableCell";

  const map = {
    Aberto: { Icon: HelpCircle, label: "Aberto" as const },
    "Em Andamento": { Icon: Clock, label: "Em atendimento" as const },
    Pausado: { Icon: Pause, label: "Pausado" as const },
    Concluído: { Icon: CheckCircle2, label: "Concluído" as const },
  };

  const cfg = map[status] ?? map.Aberto;
  const { Icon, label } = cfg;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.625,
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        bgcolor: iconBg,
        color: fg,
        flexShrink: 0,
        width: inTable ? "fit-content" : undefined,
        maxWidth: inTable ? "none" : "100%",
      }}
    >
      <Icon size={16} strokeWidth={2} aria-hidden />
      <Typography
        component="span"
        variant="caption"
        sx={{
          fontWeight: 600,
          color: "inherit",
          lineHeight: 1.25,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
