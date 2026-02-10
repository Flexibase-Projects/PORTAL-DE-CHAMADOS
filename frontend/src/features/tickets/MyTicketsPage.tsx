import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import { Search, Inbox, Send } from "lucide-react";
import { ticketService } from "@/services/ticketService";
import { templateService } from "@/services/templateService";
import { TicketCard } from "./components/TicketCard";
import { TicketDetailDrawer } from "./components/TicketDetailDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Ticket } from "@/types/ticket";
import type { TemplateField } from "@/types/template";

type PermissaoMap = Record<string, "view" | "view_edit">;

export function MyTicketsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const authConfigured = !!supabase;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chamadosMeuDepartamento, setChamadosMeuDepartamento] = useState<Ticket[]>([]);
  const [chamadosQueAbriOutros, setChamadosQueAbriOutros] = useState<Ticket[]>([]);
  const [permissoesPorDepartamento, setPermissoesPorDepartamento] = useState<PermissaoMap>({});
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);

  const loadByAuth = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ticketService.getMeusChamadosByAuth();
      if (res.success) {
        setChamadosMeuDepartamento(res.chamadosMeuDepartamento || []);
        setChamadosQueAbriOutros(res.chamadosQueAbriOutros || []);
        setPermissoesPorDepartamento(res.permissoesPorDepartamento || {});
      }
    } catch {
      setError("Erro ao carregar seus chamados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authConfigured && isAuthenticated) {
      loadByAuth();
    }
  }, [authConfigured, isAuthenticated, loadByAuth]);

  useEffect(() => {
    if (selectedTicket?.area_destino) {
      templateService
        .getTemplate(selectedTicket.area_destino)
        .then((r) => setTemplateFields(Array.isArray(r.template?.fields) ? r.template.fields : []))
        .catch(() => setTemplateFields([]));
    } else {
      setTemplateFields([]);
    }
  }, [selectedTicket?.area_destino]);

  const handleViewTicket = useCallback(async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDrawerOpen(true);
    setDetailTicket(null);
    try {
      const res = await ticketService.getById(ticket.id);
      if (res.success && res.ticket) setDetailTicket(res.ticket);
      else setDetailTicket(ticket);
    } catch {
      setDetailTicket(ticket);
    }
  }, []);

  const isFromMyDept = selectedTicket
    ? Object.prototype.hasOwnProperty.call(permissoesPorDepartamento, selectedTicket.area_destino)
    : false;
  const permissao = selectedTicket ? permissoesPorDepartamento[selectedTicket.area_destino] : undefined;
  const canEdit = isFromMyDept && permissao === "view_edit";
  const canComment =
    (isFromMyDept && (permissao === "view" || permissao === "view_edit")) ||
    (!!selectedTicket &&
      chamadosQueAbriOutros.some((t) => t.id === selectedTicket.id));

  const handleReply = async (mensagem: string) => {
    if (!selectedTicket) return;
    setReplyLoading(true);
    try {
      const res = await ticketService.addResponse(selectedTicket.id, {
        mensagem,
        autor_id: "current",
      });
      if (res.success && res.ticket) setDetailTicket(res.ticket);
      await loadByAuth();
    } finally {
      setReplyLoading(false);
    }
  };

  const handleConclude = async () => {
    if (!selectedTicket || !confirm("Concluir este chamado?")) return;
    setReplyLoading(true);
    try {
      const res = await ticketService.updateStatus(selectedTicket.id, "Concluído");
      if (res.success) {
        setDrawerOpen(false);
        setSelectedTicket(null);
        setDetailTicket(null);
        await loadByAuth();
      }
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedTicket(null);
    setDetailTicket(null);
  };

  if (authConfigured && isAuthenticated) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 0.25 }}>
            Meus Chamados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Chamados das suas áreas (prioridade) e chamados que você abriu para outras áreas.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Skeleton variant="rounded" height={180} />
            <Skeleton variant="rounded" height={180} />
          </Box>
        ) : (
          <>
            <Card variant="outlined" sx={{ overflow: "hidden" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <Inbox style={{ width: 20, height: 20 }} />
                  Chamados do meu departamento ({chamadosMeuDepartamento.length})
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  Você pode ver e, se tiver permissão, editar e responder.
                </Typography>
                {chamadosMeuDepartamento.length === 0 ? (
                  <Alert severity="info">Nenhum chamado das suas áreas no momento.</Alert>
                ) : (
                  <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" } }}>
                    {chamadosMeuDepartamento.map((t) => (
                      <TicketCard key={t.id} ticket={t} onView={handleViewTicket} />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ overflow: "hidden" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <Send style={{ width: 20, height: 20 }} />
                  Chamados que abri para outros departamentos ({chamadosQueAbriOutros.length})
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  Apenas visualização e comentários; a área responsável responde e edita.
                </Typography>
                {chamadosQueAbriOutros.length === 0 ? (
                  <Alert severity="info">Você não abriu chamados para outras áreas.</Alert>
                ) : (
                  <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" } }}>
                    {chamadosQueAbriOutros.map((t) => (
                      <TicketCard key={t.id} ticket={t} onView={handleViewTicket} />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <TicketDetailDrawer
          open={drawerOpen}
          onClose={handleCloseDrawer}
          ticket={detailTicket || selectedTicket}
          templateFields={templateFields}
          canEdit={canEdit}
          canComment={canComment || !!selectedTicket}
          onReply={handleReply}
          onConclude={handleConclude}
          replyLoading={replyLoading}
        />
      </Box>
    );
  }

  return <MyTicketsPageFallback onViewTicket={(t) => navigate("/admin/chamados", { state: { ticketId: t.id } })} />;
}

function MyTicketsPageFallback({ onViewTicket }: { onViewTicket: (t: Ticket) => void }) {
  const [nome, setNome] = useState("");
  const [enviados, setEnviados] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!nome?.trim()) {
      setError("Por favor, insira seu nome");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await ticketService.getByName(nome.trim());
      if (res.success) setEnviados(res.enviados || []);
      setSearched(true);
    } catch {
      setError("Erro ao buscar chamados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 0.25 }}>
          Meus Chamados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Faça login para ver seus chamados por departamento. Ou busque pelo nome (modo sem login).
        </Typography>
      </Box>
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", flexDirection: { xs: "column", sm: "row" } }}>
            <TextField
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              sx={{ flex: 1, width: "100%" }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !nome?.trim()}
              startIcon={loading ? <CircularProgress size={16} /> : <Search style={{ width: 16, height: 16 }} />}
              sx={{ whiteSpace: "nowrap", minWidth: { xs: "100%", sm: "auto" } }}
            >
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </Box>
        </CardContent>
      </Card>
      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
      {searched && (
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" } }}>
          {enviados.length === 0 ? (
            <Alert severity="info">Nenhum chamado encontrado para este nome.</Alert>
          ) : (
            enviados.map((t) => <TicketCard key={t.id} ticket={t} onView={onViewTicket} />)
          )}
        </Box>
      )}
    </Box>
  );
}
