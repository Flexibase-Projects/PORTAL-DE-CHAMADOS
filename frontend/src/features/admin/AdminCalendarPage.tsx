import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ChamadosLeadTimeCalendar } from "./components/ChamadosLeadTimeCalendar";

export function AdminCalendarPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 0.25 }}>
          Calendário de chamados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Histórico por semana com lead time (abertura → conclusão ou hoje). Cores por status, como no dashboard.
        </Typography>
      </Box>
      <ChamadosLeadTimeCalendar />
    </Box>
  );
}
