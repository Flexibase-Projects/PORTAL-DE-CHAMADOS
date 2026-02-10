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
    case "Concluido":
      return "success";
    case "Em Andamento":
      return "warning";
    default:
      return "default";
  }
}

export function RecentTickets({ tickets }: RecentTicketsProps) {
  return (
    <Card>
      <CardHeader title="Chamados Recentes" />
      <CardContent sx={{ pt: 0 }}>
        {tickets.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
            Nenhum chamado encontrado.
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto", mx: -2 }}>
            <Table size="small" sx={{ minWidth: 420 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Protocolo</TableCell>
                  <TableCell>Assunto</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Departamento</TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Data</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.slice(0, 10).map((ticket) => (
                  <TableRow key={ticket.id} hover>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                      {ticket.numero_protocolo}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ticket.assunto}
                    </TableCell>
                    <TableCell>
                      <Chip label={ticket.status} color={statusColor(ticket.status)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                      {ticket.area_destino}
                    </TableCell>
                    <TableCell sx={{ display: { xs: "none", lg: "table-cell" }, whiteSpace: "nowrap" }}>
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
