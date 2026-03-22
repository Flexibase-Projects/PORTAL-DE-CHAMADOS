import { Link as RouterLink } from "react-router-dom";
import { alpha, useTheme } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { HelpCircle, Clock, CheckCircle2, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Ticket, TicketStatus } from "@/types/ticket";

interface RecentTicketsProps {
  tickets: Ticket[];
}

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function chamadoSubtitle(ticket: Ticket): string {
  const bits = [ticket.tipo_suporte, ticket.setor, ticket.area_destino].filter(
    (s): s is string => Boolean(s && String(s).trim())
  );
  return bits.join(" · ");
}

function updatedAtDisplay(ticket: Ticket): string {
  const raw = ticket.updated_at?.trim() ? ticket.updated_at : ticket.created_at;
  return formatDate(raw);
}

function PersonCell({ name }: { name: string | null | undefined }) {
  const trimmed = name?.trim();
  if (!trimmed) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontSize: "0.75rem",
          fontWeight: 600,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        {getInitials(trimmed)}
      </Avatar>
      <Typography variant="body2" noWrap title={trimmed}>
        {trimmed}
      </Typography>
    </Box>
  );
}

function StatusPill({ status }: { status: TicketStatus }) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const openBg = alpha(theme.palette.error.main, dark ? 0.22 : 0.12);
  const openFg = dark ? theme.palette.error.light : theme.palette.error.dark;

  const progressBg = alpha(theme.palette.warning.main, dark ? 0.22 : 0.14);
  const progressFg = dark ? theme.palette.warning.light : theme.palette.warning.dark;

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

const headCellSx = {
  py: 1.5,
  px: 2,
  borderBottom: 1,
  borderColor: "divider",
  color: "text.secondary",
  fontWeight: 600,
  fontSize: "0.8125rem",
};

const bodyCellSx = {
  py: 1.5,
  px: 2,
  borderBottom: 1,
  borderColor: "divider",
  verticalAlign: "middle" as const,
};

export function RecentTickets({ tickets }: RecentTicketsProps) {
  const theme = useTheme();
  const headBg = theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[100];

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: "divider",
        boxShadow: "none",
        bgcolor: "background.paper",
      }}
    >
      <CardHeader title="Chamados recentes" />
      <CardContent sx={{ pt: 0, px: { xs: 1.5, sm: 2 }, pb: 2 }}>
        {tickets.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
            Nenhum chamado encontrado.
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto", mx: { xs: -1.5, sm: -2 } }}>
            <Table sx={{ minWidth: { xs: 320, sm: 560, md: 720 } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: headBg }}>
                  <TableCell sx={{ ...headCellSx, display: { xs: "none", sm: "table-cell" } }}>Atualizado em</TableCell>
                  <TableCell sx={headCellSx}>Protocolo</TableCell>
                  <TableCell sx={headCellSx}>Chamado</TableCell>
                  <TableCell sx={headCellSx}>Solicitante</TableCell>
                  <TableCell sx={{ ...headCellSx, display: { xs: "none", md: "table-cell" } }}>Responsável</TableCell>
                  <TableCell sx={headCellSx}>Status</TableCell>
                  <TableCell sx={{ ...headCellSx, width: 56, textAlign: "right" }} align="right">
                    Ação
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.slice(0, 10).map((ticket) => {
                  const subtitle = chamadoSubtitle(ticket);
                  return (
                    <TableRow key={ticket.id} hover sx={{ "&:last-of-type td": { borderBottom: 0 } }}>
                      <TableCell sx={{ ...bodyCellSx, display: { xs: "none", sm: "table-cell" }, whiteSpace: "nowrap" }}>
                        <Typography variant="body2" color="text.secondary">
                          {updatedAtDisplay(ticket)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ ...bodyCellSx, fontWeight: 700, whiteSpace: "nowrap" }}>
                        <Typography variant="body2" fontWeight={700}>
                          {ticket.numero_protocolo}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ ...bodyCellSx, maxWidth: { xs: 140, sm: 200, md: 280 } }}>
                        <Typography variant="body2" fontWeight={600} noWrap title={ticket.assunto}>
                          {ticket.assunto}
                        </Typography>
                        {subtitle ? (
                          <Typography variant="caption" color="text.secondary" display="block" noWrap title={subtitle}>
                            {subtitle}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell sx={{ ...bodyCellSx, maxWidth: { xs: 160, md: 200 } }}>
                        <PersonCell name={ticket.solicitante_nome} />
                      </TableCell>
                      <TableCell sx={{ ...bodyCellSx, display: { xs: "none", md: "table-cell" }, maxWidth: 200 }}>
                        <PersonCell name={ticket.responsavel_nome} />
                      </TableCell>
                      <TableCell sx={bodyCellSx}>
                        <StatusPill status={ticket.status} />
                      </TableCell>
                      <TableCell sx={{ ...bodyCellSx, width: 56, textAlign: "right" }} align="right">
                        <Tooltip title="Abrir">
                          <IconButton
                            component={RouterLink}
                            to={`/meus-chamados/${ticket.id}`}
                            size="small"
                            aria-label="Abrir chamado"
                            sx={{
                              border: 1,
                              borderColor: "divider",
                              borderRadius: 1,
                              bgcolor: "action.hover",
                              "&:hover": { bgcolor: "action.selected" },
                            }}
                          >
                            <Pencil size={18} strokeWidth={2} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
