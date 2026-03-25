import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import { alpha, useTheme } from "@mui/material/styles";
import { Clock, CheckCircle2, HelpCircle, Pause } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getTicketStatusAccent } from "@/features/tickets/ticketStatusAccent";
import type { Ticket, TicketStatus } from "@/types/ticket";

export interface TicketCardProps {
  ticket: Ticket;
  onView?: (ticket: Ticket) => void;
  showActions?: boolean;
  hasUnreadNotification?: boolean;
}

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function subtitleLine(ticket: Ticket): string {
  const bits = [ticket.tipo_suporte, ticket.setor, ticket.area_destino].filter(
    (s): s is string => Boolean(s && String(s).trim())
  );
  return bits.join(" · ");
}

function protocolCompact(numero: string): string {
  const trimmed = numero.trim();
  if (trimmed.length <= 12) return trimmed;
  const idx = trimmed.lastIndexOf("-");
  if (idx !== -1 && idx < trimmed.length - 1) return trimmed.slice(idx + 1);
  return trimmed.slice(-10);
}

function statusFooterIcon(status: TicketStatus): { Icon: typeof HelpCircle; fg: string; bg: string } {
  const { fg, iconBg } = getTicketStatusAccent(status);
  const Icon =
    status === "Concluído"
      ? CheckCircle2
      : status === "Em Andamento"
        ? Clock
        : status === "Pausado"
          ? Pause
          : HelpCircle;
  return { Icon, fg, bg: iconBg };
}

export function TicketCard({
  ticket,
  onView,
  showActions = true,
  hasUnreadNotification = false,
}: TicketCardProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const handleOpen = () => onView?.(ticket);
  const subtitle = subtitleLine(ticket);
  const displayName = ticket.solicitante_nome?.trim() || ticket.solicitante_email || "Solicitante";
  const footer = statusFooterIcon(ticket.status);
  const { Icon: FooterIcon, fg: footerFg, bg: footerBg } = footer;

  const ctaSx = {
    textTransform: "none" as const,
    fontWeight: 600,
    px: 1.25,
    py: 0.5,
    minWidth: 0,
    fontSize: "0.75rem",
    borderRadius: 1,
    boxShadow: "none",
    "& .MuiButton-startIcon": { color: "inherit" },
  };

  return (
    <Card
      variant="outlined"
      onClick={onView ? handleOpen : undefined}
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 300,
        mx: "auto",
        transition: "box-shadow 0.2s, border-color 0.2s",
        cursor: onView ? "pointer" : "default",
        borderColor: "divider",
        borderRadius: 2,
        "&:hover": onView
          ? {
              boxShadow: dark ? `0 4px 14px ${alpha("#000", 0.35)}` : `0 4px 14px ${alpha(theme.palette.primary.main, 0.12)}`,
              borderColor: alpha(theme.palette.primary.main, dark ? 0.35 : 0.22),
            }
          : {},
      }}
    >
      {hasUnreadNotification && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: "error.main",
            zIndex: 1,
          }}
        />
      )}
      <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 1.25 }}>
          <Typography variant="caption" color="text.secondary" fontFamily="monospace" sx={{ fontSize: "0.7rem", pt: 0.25 }}>
            {protocolCompact(ticket.numero_protocolo)}
          </Typography>
          {showActions &&
            onView &&
            (ticket.status === "Aberto" || ticket.status === "Em Andamento") && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 0.75,
                  flexShrink: 0,
                  maxWidth: "100%",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {ticket.status === "Aberto" && (
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    disableElevation
                    startIcon={<Clock size={14} strokeWidth={2.5} />}
                    onClick={handleOpen}
                    sx={ctaSx}
                  >
                    Iniciar
                  </Button>
                )}
                {ticket.status === "Em Andamento" && (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disableElevation
                    startIcon={<CheckCircle2 size={14} strokeWidth={2.5} />}
                    onClick={handleOpen}
                    sx={ctaSx}
                  >
                    Encerrar
                  </Button>
                )}
              </Box>
            )}
        </Box>

        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{
            fontSize: "1rem",
            lineHeight: 1.3,
            mb: 0.5,
            wordBreak: "break-word",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {ticket.assunto}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.25, lineHeight: 1.4 }}>
            {subtitle}
          </Typography>
        ) : (
          <Box sx={{ mb: 1.25 }} />
        )}

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.25 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
            {formatDate(ticket.created_at)}
          </Typography>
          <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ fontSize: "0.7rem" }}>
            {ticket.prioridade ?? "—"}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "divider", opacity: dark ? 0.6 : 1, mb: 1.25 }} />

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: "0.7rem",
                fontWeight: 700,
                bgcolor: (t) => alpha(t.palette.primary.main, dark ? 0.35 : 0.14),
                color: (t) => (dark ? t.palette.primary.light : t.palette.primary.dark),
                border: 1,
                borderColor: (t) => alpha(t.palette.primary.main, dark ? 0.45 : 0.22),
              }}
            >
              {getInitials(displayName)}
            </Avatar>
            <Typography variant="body2" fontWeight={600} noWrap title={displayName} sx={{ fontSize: "0.8125rem" }}>
              {displayName}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: footerBg,
              color: footerFg,
            }}
          >
            <FooterIcon size={18} strokeWidth={2} aria-hidden />
          </Box>
        </Box>

        {ticket.respostas && ticket.respostas.length > 0 && (
          <Typography variant="caption" color="primary" sx={{ mt: 1, display: "block" }}>
            {ticket.respostas.length} resposta(s)
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
