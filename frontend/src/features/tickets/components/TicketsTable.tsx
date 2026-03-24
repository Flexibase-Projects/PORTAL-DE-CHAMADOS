import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";
import { TicketStatusPill } from "./TicketStatusPill";

export interface TicketsTableProps {
  tickets: Ticket[];
  selectedTicketId?: string | null;
  onRowActivate: (ticket: Ticket) => void;
  emptyMessage?: string;
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

function PersonCell({
  name,
  allowWrap = false,
  avatarSize = 32,
}: {
  name: string | null | undefined;
  allowWrap?: boolean;
  avatarSize?: number;
}) {
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
          width: avatarSize,
          height: avatarSize,
          fontSize: avatarSize <= 28 ? "0.6875rem" : "0.75rem",
          fontWeight: 600,
          bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === "dark" ? 0.35 : 0.14),
          color: (t) => (t.palette.mode === "dark" ? t.palette.primary.light : t.palette.primary.dark),
          border: 1,
          borderColor: (t) => alpha(t.palette.primary.main, t.palette.mode === "dark" ? 0.45 : 0.22),
          flexShrink: 0,
        }}
      >
        {getInitials(trimmed)}
      </Avatar>
      <Typography variant="body2" {...(allowWrap ? {} : { noWrap: true, title: trimmed })} sx={{ minWidth: 0, wordBreak: allowWrap ? "break-word" : undefined }}>
        {trimmed}
      </Typography>
    </Box>
  );
}

export function TicketsTable({
  tickets,
  selectedTicketId = null,
  onRowActivate,
  emptyMessage = "Nenhum chamado encontrado.",
}: TicketsTableProps) {
  const theme = useTheme();
  /** Bootstrap xs: &lt;576px — lista em cards, sem scroll horizontal. */
  const isNarrow = useMediaQuery(theme.breakpoints.down("sm"));
  /** Bootstrap sm/md: compactar células entre 576px e 767px. */
  const isCompactTable = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDark = theme.palette.mode === "dark";
  const dashboardBlue = isDark ? "#4f86ff" : "#111184";
  const dashboardBlueDark = isDark ? "#60a5fa" : "#132937";
  const primary = dashboardBlue;
  const headerBg = alpha(primary, isDark ? 0.14 : 0.07);
  const headerRule = alpha(primary, isDark ? 0.35 : 0.22);
  const rowHoverBg = alpha(primary, isDark ? 0.08 : 0.05);
  const rowStripe = alpha(primary, isDark ? 0.04 : 0.025);
  const headLabelColor = isDark ? dashboardBlueDark : dashboardBlueDark;

  const headCellSx = {
    py: { sm: 1.35, md: 1.65, lg: 1.75 },
    px: { sm: 1, md: 1.35, lg: 2 },
    borderBottom: 2,
    borderColor: headerRule,
    bgcolor: headerBg,
    color: headLabelColor,
    fontWeight: 700,
    fontSize: { sm: "0.625rem", md: "0.65625rem", lg: "0.6875rem" },
    letterSpacing: "0.035em",
    lineHeight: 1.35,
    whiteSpace: "normal",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    verticalAlign: "bottom",
  };

  const bodyCellSx = {
    py: { sm: 1.25, md: 1.5, lg: 1.65 },
    px: { sm: 1, md: 1.35, lg: 2 },
    borderBottom: 1,
    borderColor: "divider",
    verticalAlign: "middle" as const,
  };

  const tableContainerSx = {
    width: "100%",
    maxWidth: "100%",
    borderRadius: 2.5,
    borderColor: alpha(primary, isDark ? 0.2 : 0.12),
    bgcolor: "background.paper",
    boxShadow: isDark ? "none" : `0 1px 2px ${alpha(primary, 0.07)}, 0 6px 20px ${alpha("#0f172a", 0.05)}`,
    /** Evita cantos “quadrados” da tabela vazando além do Paper arredondado. */
    overflow: "hidden",
  } as const;

  if (tickets.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          py: 4,
          px: 2,
          textAlign: "center",
          borderColor: alpha(primary, isDark ? 0.22 : 0.14),
          bgcolor: alpha(primary, isDark ? 0.06 : 0.04),
          backgroundImage: isDark
            ? undefined
            : `linear-gradient(180deg, ${alpha(primary, 0.05)} 0%, transparent 42%)`,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: "auto" }}>
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  if (isNarrow) {
    return (
      <Box sx={{ width: "100%", maxWidth: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
        {tickets.map((ticket) => {
          const subtitle = chamadoSubtitle(ticket);
          const selected = selectedTicketId != null && ticket.id === selectedTicketId;
          return (
            <Paper
              key={ticket.id}
              variant="outlined"
              onClick={() => onRowActivate(ticket)}
              sx={{
                ...tableContainerSx,
                p: 2,
                cursor: "pointer",
                transition: "border-color 0.2s ease, background-color 0.2s ease",
                borderColor: selected ? alpha(primary, isDark ? 0.55 : 0.45) : tableContainerSx.borderColor,
                bgcolor: selected ? alpha(primary, isDark ? 0.12 : 0.06) : "background.paper",
                "&:hover": {
                  borderColor: alpha(primary, isDark ? 0.4 : 0.28),
                  bgcolor: alpha(primary, isDark ? 0.08 : 0.04),
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      fontSize: "0.8125rem",
                      color: "primary.main",
                      wordBreak: "break-all",
                    }}
                  >
                    {ticket.numero_protocolo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    {updatedAtDisplay(ticket)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="Abrir chamado"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowActivate(ticket);
                  }}
                  sx={{
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    border: 1,
                    borderColor: alpha(primary, isDark ? 0.4 : 0.28),
                    borderRadius: 1,
                    bgcolor: alpha(primary, isDark ? 0.12 : 0.06),
                    "&:hover": {
                      bgcolor: alpha(primary, isDark ? 0.22 : 0.12),
                      borderColor: primary,
                    },
                  }}
                >
                  <Pencil size={16} strokeWidth={2} />
                </IconButton>
              </Box>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.875rem", wordBreak: "break-word" }}>
                {ticket.assunto}
              </Typography>
              {subtitle ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", wordBreak: "break-word" }}>
                  {subtitle}
                </Typography>
              ) : null}
              <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1.25 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.35, fontWeight: 600 }}>
                    Solicitante
                  </Typography>
                  <PersonCell name={ticket.solicitante_nome} allowWrap avatarSize={28} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.35, fontWeight: 600 }}>
                    Responsável
                  </Typography>
                  <PersonCell name={ticket.responsavel_nome} allowWrap avatarSize={28} />
                </Box>
              </Box>
              <Box sx={{ mt: 1.5, display: "flex", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                <TicketStatusPill status={ticket.status} />
              </Box>
            </Paper>
          );
        })}
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={tableContainerSx}>
      <Table
        size="small"
        sx={{
          width: "100%",
          maxWidth: "100%",
          tableLayout: "fixed",
          "& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even):not(.Mui-selected)": {
            bgcolor: rowStripe,
          },
          "& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root": {
            borderBottom: 0,
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headCellSx, display: { xs: "none", sm: "table-cell" }, width: { sm: "14%", md: "13%", lg: "12%" } }}>
              Atualizado em
            </TableCell>
            <TableCell sx={{ ...headCellSx, width: { sm: "16%", md: "14%", lg: "13%" } }}>Protocolo</TableCell>
            <TableCell sx={{ ...headCellSx, width: { sm: "26%", md: "22%", lg: "24%" } }}>Chamado</TableCell>
            <TableCell sx={{ ...headCellSx, width: { sm: "22%", md: "18%", lg: "17%" } }}>Solicitante</TableCell>
            <TableCell sx={{ ...headCellSx, display: { xs: "none", md: "table-cell" }, width: { md: "18%", lg: "17%" } }}>
              Responsável
            </TableCell>
            <TableCell sx={{ ...headCellSx, width: { sm: "14%", md: "13%", lg: "13%" } }}>Status</TableCell>
            <TableCell sx={{ ...headCellSx, width: 56, minWidth: 56, maxWidth: 56, px: { sm: 0.75, lg: 1 }, textAlign: "right" }} align="right">
              Ação
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tickets.map((ticket) => {
            const subtitle = chamadoSubtitle(ticket);
            const selected = selectedTicketId != null && ticket.id === selectedTicketId;
            const avatarSz = isCompactTable ? 28 : 32;
            return (
              <TableRow
                key={ticket.id}
                hover
                selected={selected}
                onClick={() => onRowActivate(ticket)}
                sx={{
                  cursor: "pointer",
                  transition: "background-color 0.15s ease",
                  "&:hover": {
                    bgcolor: `${rowHoverBg} !important`,
                  },
                  "&.Mui-selected": {
                    bgcolor: alpha(primary, isDark ? 0.18 : 0.1),
                    "&:hover": {
                      bgcolor: `${alpha(primary, isDark ? 0.22 : 0.14)} !important`,
                    },
                  },
                }}
              >
                <TableCell sx={{ ...bodyCellSx, display: { xs: "none", sm: "table-cell" } }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { sm: "0.75rem", lg: "0.8125rem" }, wordBreak: "break-word" }}>
                    {updatedAtDisplay(ticket)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, verticalAlign: "top" }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      fontSize: { sm: "0.75rem", lg: "0.8125rem" },
                      color: "primary.main",
                      letterSpacing: "-0.01em",
                      wordBreak: "break-all",
                    }}
                  >
                    {ticket.numero_protocolo}
                  </Typography>
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, verticalAlign: "top", overflow: "hidden" }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    title={ticket.assunto}
                    sx={{
                      fontSize: { sm: "0.75rem", lg: "0.8125rem" },
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      display: "-webkit-box",
                      WebkitLineClamp: { sm: 3, lg: 2 },
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {ticket.assunto}
                  </Typography>
                  {subtitle ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      title={subtitle}
                      sx={{
                        mt: 0.35,
                        opacity: 0.92,
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {subtitle}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, overflow: "hidden" }}>
                  <PersonCell name={ticket.solicitante_nome} avatarSize={avatarSz} />
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, display: { xs: "none", md: "table-cell" }, overflow: "hidden" }}>
                  <PersonCell name={ticket.responsavel_nome} avatarSize={avatarSz} />
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, verticalAlign: "middle" }} onClick={(e) => e.stopPropagation()}>
                  <Box sx={{ transform: { sm: "scale(0.92)", lg: "none" }, transformOrigin: "left center" }}>
                    <TicketStatusPill status={ticket.status} />
                  </Box>
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, width: 56, minWidth: 56, maxWidth: 56, px: { sm: 0.5, lg: 1 }, textAlign: "right" }} align="right" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Abrir">
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label="Abrir chamado"
                      onClick={() => onRowActivate(ticket)}
                      sx={{
                        width: 32,
                        height: 32,
                        border: 1,
                        borderColor: alpha(primary, isDark ? 0.4 : 0.28),
                        borderRadius: 1,
                        bgcolor: alpha(primary, isDark ? 0.12 : 0.06),
                        "&:hover": {
                          bgcolor: alpha(primary, isDark ? 0.22 : 0.12),
                          borderColor: primary,
                        },
                      }}
                    >
                      <Pencil size={16} strokeWidth={2} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
