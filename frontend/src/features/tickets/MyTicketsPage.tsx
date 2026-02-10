import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { Search } from "lucide-react";
import { ticketService } from "@/services/ticketService";
import { TicketCard } from "./components/TicketCard";
import type { Ticket } from "@/types/ticket";

export function MyTicketsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [enviados, setEnviados] = useState<Ticket[]>([]);
  const [recebidos, setRecebidos] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [tab, setTab] = useState(0);

  const handleSearch = async () => {
    if (!nome?.trim()) {
      setError("Por favor, insira seu nome");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await ticketService.getByName(nome.trim());
      if (response.success) {
        setEnviados(response.enviados || []);
        setRecebidos(response.recebidos || []);
        setSearched(true);
      }
    } catch {
      setError("Erro ao buscar chamados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    navigate("/painel-administrativo", { state: { ticketId: ticket.id } });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Meus Chamados
        </Typography>
        <Typography color="text.secondary">
          Digite seu nome para visualizar seus chamados enviados e recebidos.
        </Typography>
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
            <TextField
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              sx={{ flex: 1, minWidth: 200 }}
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !nome?.trim()}
              startIcon={loading ? <CircularProgress size={18} /> : <Search style={{ width: 18, height: 18 }} />}
            >
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {searched && (enviados.length > 0 || recebidos.length > 0) ? (
        <Box>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tab label={`Enviados (${enviados.length})`} />
            <Tab label={`Recebidos (${recebidos.length})`} />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" } }}>
              {enviados.length === 0 ? (
                <Alert severity="info">Você não possui chamados enviados.</Alert>
              ) : (
                enviados.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} onView={handleViewTicket} />
                ))
              )}
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" } }}>
              {recebidos.length === 0 ? (
                <Alert severity="info">Você não possui chamados recebidos.</Alert>
              ) : (
                recebidos.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} onView={handleViewTicket} />
                ))
              )}
            </Box>
          )}
        </Box>
      ) : (
        searched &&
        !loading && (
          <Alert severity="info">Nenhum chamado encontrado para este nome.</Alert>
        )
      )}
    </Box>
  );
}
