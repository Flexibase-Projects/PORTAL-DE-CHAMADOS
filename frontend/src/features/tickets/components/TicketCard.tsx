import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { Mail, Building2, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";

interface TicketCardProps {
  ticket: Ticket;
  onView?: (ticket: Ticket) => void;
  showActions?: boolean;
}

function statusColor(status: string): "default" | "primary" | "warning" | "success" {
  switch (status) {
    case "Concluído":
      return "success";
    case "Em Andamento":
      return "warning";
    default:
      return "default";
  }
}

export function TicketCard({
  ticket,
  onView,
  showActions = true,
}: TicketCardProps) {
  return (
    <Card variant="outlined" sx={{ transition: "box-shadow 0.2s", "&:hover": { boxShadow: 2 } }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {ticket.assunto}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
              {ticket.numero_protocolo}
            </Typography>
          </Box>
          <Chip
            label={ticket.status}
            color={statusColor(ticket.status)}
            size="small"
            variant="outlined"
            sx={{ flexShrink: 0 }}
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1.5 }}>
          {ticket.solicitante_email && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Mail style={{ width: 12, height: 12, opacity: 0.7 }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {ticket.solicitante_email}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Building2 style={{ width: 12, height: 12, opacity: 0.7 }} />
            <Typography variant="caption" color="text.secondary">
              {ticket.area_destino} - {ticket.setor}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Clock style={{ width: 12, height: 12, opacity: 0.7 }} />
            <Typography variant="caption" color="text.secondary">
              {formatDate(ticket.created_at)}
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            mb: 1.5,
          }}
        >
          {ticket.mensagem}
        </Typography>

        {ticket.respostas && ticket.respostas.length > 0 && (
          <Typography variant="caption" color="primary" sx={{ mb: 1.5, display: "block" }}>
            {ticket.respostas.length} resposta(s)
          </Typography>
        )}

        {showActions && onView && (
          <Button variant="outlined" size="small" fullWidth onClick={() => onView(ticket)}>
            Ver Detalhes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
