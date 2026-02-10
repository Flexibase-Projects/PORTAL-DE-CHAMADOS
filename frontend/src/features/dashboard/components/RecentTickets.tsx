import { alpha } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";

interface RecentTicketsProps {
  tickets: Ticket[];
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

const CARDS_BORDER = "#7289d9";

const cardHoverSx = {
  borderColor: CARDS_BORDER,
  transition: "box-shadow 0.25s ease, transform 0.25s ease",
  "&:hover": {
    boxShadow: `0 8px 24px ${alpha(CARDS_BORDER, 0.18)}`,
    transform: "translateY(-2px)",
  },
};

export function RecentTickets({ tickets }: RecentTicketsProps) {
  return (
    <Card variant="outlined" sx={cardHoverSx}>
      <CardHeader
        title={
          <Typography variant="subtitle1" fontWeight={600}>
            Chamados Recentes
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {tickets.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            Nenhum chamado encontrado.
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Protocolo</TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Assunto</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Departamento</TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Data</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.slice(0, 10).map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                      {ticket.numero_protocolo}
                    </TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" }, maxWidth: 200 }} className="truncate">
                      {ticket.assunto}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.status}
                        color={statusColor(ticket.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                      {ticket.area_destino}
                    </TableCell>
                    <TableCell sx={{ display: { xs: "none", lg: "table-cell" }, fontSize: "0.75rem" }} color="text.secondary">
                      {formatDate(ticket.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
