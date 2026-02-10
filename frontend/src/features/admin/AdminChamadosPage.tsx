import { useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { TicketManagement } from "./components/TicketManagement";

export function AdminChamadosPage() {
  const location = useLocation();
  const initialTicketId = (location.state as { ticketId?: string })?.ticketId;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 0.25 }}>
          Gestão de Chamados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visualize e gerencie todos os chamados.
        </Typography>
      </Box>
      <TicketManagement initialTicketId={initialTicketId} />
    </Box>
  );
}
