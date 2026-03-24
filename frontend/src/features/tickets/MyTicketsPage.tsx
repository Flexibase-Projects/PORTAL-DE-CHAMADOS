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
import { alpha, useTheme } from "@mui/material/styles";
import { Search, Inbox, Send } from "lucide-react";
import { ticketService } from "@/services/ticketService";
import { notificationService } from "@/services/notificationService";
import { TicketCard } from "./components/TicketCard";
import { TicketStatusPill } from "./components/TicketStatusPill";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Ticket, TicketStatus } from "@/types/ticket";

type PermissaoMap = Record<string, "view" | "view_edit" | "manage_templates">;

function getPermissionsForTicket(
  ticket: Ticket,
  chamadosMeuDepartamento: Ticket[],
  chamadosQueAbriOutros: Ticket[],
  permissoesPorDepartamento: PermissaoMap
): { canEdit: boolean; canComment: boolean } {
  const isFromMyDept = Object.prototype.hasOwnProperty.call(
    permissoesPorDepartamento,
    ticket.area_destino
  );
  const permissao = permissoesPorDepartamento[ticket.area_destino];
  const canEdit = isFromMyDept && permissao === "view_edit";
  const canComment =
    (isFromMyDept && (permissao === "view" || permissao === "view_edit")) ||
    chamadosQueAbriOutros.some((t) => t.id === ticket.id);
  return { canEdit, canComment };
}

/** Ordem das seções: aberto → em atendimento → encerrado. */
const STATUS_SECTION_ORDER: TicketStatus[] = ["Aberto", "Em Andamento", "Concluído"];

const STATUS_SECTION_ARIA: Record<TicketStatus, string> = {
  Aberto: "Chamados abertos",
  "Em Andamento": "Chamados em atendimento",
  Concluído: "Chamados concluídos",
};

function groupTicketsByStatus(tickets: Ticket[]): Record<TicketStatus, Ticket[]> {
  const map: Record<TicketStatus, Ticket[]> = { "Em Andamento": [], Aberto: [], Concluído: [] };
  for (const t of tickets) {
    map[t.status].push(t);
  }
  return map;
}

function TicketGridByStatus({
  tickets,
  onView,
  unreadIds,
}: {
  tickets: Ticket[];
  onView: (t: Ticket) => void;
  unreadIds: Set<string>;
}) {
  const theme = useTheme();
  const grouped = groupTicketsByStatus(tickets);
  const sections = STATUS_SECTION_ORDER.filter((status) => grouped[status].length > 0);
  const lineAlpha = theme.palette.mode === "dark" ? 0.32 : 0.18;

  return (
    <>
      {sections.map((status, index) => {
        const list = grouped[status];
        return (
          <Box
            key={status}
            component="section"
            aria-label={STATUS_SECTION_ARIA[status]}
            sx={{ mb: index < sections.length - 1 ? 0.5 : 0 }}
          >
            <Box
              sx={{
                mb: 1.75,
                mt: index > 0 ? { xs: 2.25, sm: 2.75 } : 0,
                display: "flex",
                alignItems: "center",
                gap: { xs: 1.25, sm: 1.75 },
                minWidth: 0,
              }}
            >
              <Box sx={{ flexShrink: 0 }}>
                <TicketStatusPill status={status} />
              </Box>
              <Box
                role="presentation"
                sx={{
                  flex: 1,
                  minWidth: 48,
                  height: 2,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.primary.main, lineAlpha),
                  boxShadow: (t) =>
                    `0 0 0 1px ${alpha(t.palette.primary.main, t.palette.mode === "dark" ? 0.12 : 0.08)}`,
                }}
              />
            </Box>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                justifyItems: "center",
              }}
            >
              {list.map((t) => (
                <TicketCard key={t.id} ticket={t} onView={onView} hasUnreadNotification={unreadIds.has(t.id)} />
              ))}
            </Box>
          </Box>
        );
      })}
    </>
  );
}

export function MyTicketsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const authConfigured = !!supabase;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chamadosMeuDepartamento, setChamadosMeuDepartamento] = useState<Ticket[]>([]);
  const [chamadosQueAbriOutros, setChamadosQueAbriOutros] = useState<Ticket[]>([]);
  const [permissoesPorDepartamento, setPermissoesPorDepartamento] = useState<PermissaoMap>({});
  const [unreadTicketIds, setUnreadTicketIds] = useState<Set<string>>(new Set());

  const loadByAuth = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [ticketsRes, notifRes] = await Promise.all([
        ticketService.getMeusChamadosByAuth(user.id, user.email),
        notificationService.list(true, user.id).catch(() => ({ success: false, notifications: [] as { ticket_id?: string }[] })),
      ]);
      if (ticketsRes.success) {
        setChamadosMeuDepartamento(ticketsRes.chamadosMeuDepartamento || []);
        setChamadosQueAbriOutros(ticketsRes.chamadosQueAbriOutros || []);
        setPermissoesPorDepartamento(ticketsRes.permissoesPorDepartamento || {});
      }
      if (notifRes.success && notifRes.notifications) {
        const ids = new Set<string>();
        for (const n of notifRes.notifications) {
          if (n.ticket_id) ids.add(n.ticket_id);
        }
        setUnreadTicketIds(ids);
      }
    } catch {
      setError("Erro ao carregar seus chamados.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (authConfigured && isAuthenticated && !authLoading && user?.id) {
      loadByAuth();
    }
  }, [authConfigured, isAuthenticated, authLoading, user?.id, loadByAuth]);

  useEffect(() => {
    const onRefresh = () => loadByAuth();
    window.addEventListener("notifications-refresh", onRefresh);
    return () => window.removeEventListener("notifications-refresh", onRefresh);
  }, [loadByAuth]);

  const handleViewTicket = useCallback(
    (ticket: Ticket) => {
      const { canEdit, canComment } = getPermissionsForTicket(
        ticket,
        chamadosMeuDepartamento,
        chamadosQueAbriOutros,
        permissoesPorDepartamento
      );
      navigate(`/meus-chamados/${ticket.id}`, {
        state: { ticket, canEdit, canComment },
      });
    },
    [navigate, chamadosMeuDepartamento, chamadosQueAbriOutros, permissoesPorDepartamento]
  );

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
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            <Skeleton variant="rounded" height={220} sx={{ maxWidth: 300, width: "100%", justifySelf: "center" }} />
            <Skeleton variant="rounded" height={220} sx={{ maxWidth: 300, width: "100%", justifySelf: "center" }} />
            <Skeleton variant="rounded" height={220} sx={{ maxWidth: 300, width: "100%", justifySelf: "center" }} />
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
                  <TicketGridByStatus tickets={chamadosMeuDepartamento} onView={handleViewTicket} unreadIds={unreadTicketIds} />
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
                  <TicketGridByStatus tickets={chamadosQueAbriOutros} onView={handleViewTicket} unreadIds={unreadTicketIds} />
                )}
              </CardContent>
            </Card>
          </>
        )}
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
        <Box sx={{ width: "100%" }}>
          {enviados.length === 0 ? (
            <Alert severity="info">Nenhum chamado encontrado para este nome.</Alert>
          ) : (
            <TicketGridByStatus tickets={enviados} onView={onViewTicket} unreadIds={new Set()} />
          )}
        </Box>
      )}
    </Box>
  );
}
