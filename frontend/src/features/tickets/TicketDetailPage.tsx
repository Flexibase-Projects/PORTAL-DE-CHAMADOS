import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { ticketService } from "@/services/ticketService";
import { templateService } from "@/services/templateService";
import { notificationService } from "@/services/notificationService";
import { TicketDetailContent } from "./components/TicketDetailContent";
import { useAuth } from "@/contexts/AuthContext";
import type { Ticket } from "@/types/ticket";
import type { TemplateField } from "@/types/template";

type PermissaoMap = Record<string, "view" | "view_edit" | "manage_templates">;

interface LocationState {
  ticket?: Ticket;
  canEdit?: boolean;
  canComment?: boolean;
}

function computePermissions(
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

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(state?.ticket ?? null);
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [loading, setLoading] = useState(!state?.ticket);
  const [notFound, setNotFound] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [canEdit, setCanEdit] = useState(state?.canEdit ?? false);
  const [canComment, setCanComment] = useState(state?.canComment ?? true);

  const loadTicket = useCallback(
    async (showLoading = true) => {
      if (!id) return;
      if (showLoading) setLoading(true);
      setNotFound(false);
      try {
        const res = await ticketService.getById(id);
        if (res.success && res.ticket) {
          setTicket(res.ticket);
        } else {
          setNotFound(true);
          setTicket(null);
        }
      } catch {
        setNotFound(true);
        setTicket(null);
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    if (state?.ticket?.id === id) {
      setTicket(state.ticket);
      setCanEdit(state.canEdit ?? false);
      setCanComment(state.canComment ?? true);
      loadTicket(false);
    } else {
      loadTicket(true);
    }
  }, [id, loadTicket]);

  useEffect(() => {
    if (!id) return;
    notificationService
      .markReadByTicket(id)
      .then(() => {
        window.dispatchEvent(new CustomEvent("notifications-refresh"));
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!ticket?.area_destino) {
      setTemplateFields([]);
      return;
    }
    templateService
      .getTemplate(ticket.area_destino)
      .then((r) => setTemplateFields(Array.isArray(r.template?.fields) ? r.template.fields : []))
      .catch(() => setTemplateFields([]));
  }, [ticket?.area_destino]);

  useEffect(() => {
    if (ticket && !state?.ticket) {
      ticketService
        .getMeusChamadosByAuth(user?.id, user?.email)
        .then((res) => {
          if (res.success && ticket) {
            const { canEdit: ce, canComment: cc } = computePermissions(
              ticket,
              res.chamadosMeuDepartamento || [],
              res.chamadosQueAbriOutros || [],
              res.permissoesPorDepartamento || {}
            );
            setCanEdit(ce);
            setCanComment(cc);
          }
        })
        .catch(() => {});
    }
  }, [ticket?.id, state?.ticket, user?.id, user?.email]);

  const handleReply = async (mensagem: string) => {
    if (!ticket) return;
    setReplyLoading(true);
    try {
      const res = await ticketService.addResponse(ticket.id, {
        mensagem,
        autor_id: "current",
        auth_user_id: user?.id ?? undefined,
        auth_user_email: user?.email ?? undefined,
      });
      if (res.success && res.ticket) setTicket(res.ticket);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleStartAttendance = async () => {
    if (!ticket) return;
    setStatusActionLoading(true);
    try {
      const res = await ticketService.updateStatus(ticket.id, "Em Andamento");
      if (res.success && "ticket" in res && res.ticket) setTicket(res.ticket);
      else await loadTicket(false);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleConclude = async () => {
    if (!ticket || !confirm("Encerrar este chamado?")) return;
    setStatusActionLoading(true);
    try {
      const res = await ticketService.updateStatus(ticket.id, "Concluído");
      if (res.success) {
        navigate("/meus-chamados");
      }
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleBack = () => navigate("/meus-chamados");

  if (!id) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate("/meus-chamados")}>
          Voltar
        </Button>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          ID do chamado não informado.
        </Typography>
      </Box>
    );
  }

  if (loading && !ticket) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.default" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            p: 1.5,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Skeleton variant="rounded" width={88} height={36} />
          <Skeleton variant="text" width={180} height={36} />
          <Box sx={{ flex: 1 }} />
          <Skeleton variant="rounded" width={140} height={36} />
        </Box>
        <Box sx={{ p: 2, flex: 1, maxWidth: 1200, width: "100%", mx: "auto" }}>
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={140} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={100} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={88} sx={{ borderRadius: 2 }} />
          </Stack>
        </Box>
      </Box>
    );
  }

  if (notFound || !ticket) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowLeft size={18} />} onClick={handleBack}>
          Voltar
        </Button>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Chamado não encontrado.
        </Typography>
      </Box>
    );
  }

  const showActions = ticket.status !== "Concluído" && canEdit;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Paper
        elevation={0}
        square
        variant="outlined"
        sx={{
          borderLeft: 0,
          borderRight: 0,
          borderTop: 0,
          borderRadius: 0,
          px: { xs: 1, sm: 1.5 },
          py: 1.25,
          flexShrink: 0,
          bgcolor: "background.paper",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1 },
            flexWrap: "wrap",
            maxWidth: 1200,
            mx: "auto",
            width: "100%",
          }}
        >
          <Button
            variant="text"
            size="small"
            startIcon={<ArrowLeft size={20} />}
            onClick={handleBack}
            aria-label="Voltar para Meus Chamados"
            sx={{ color: "text.secondary", minWidth: "auto", px: 1 }}
          >
            Voltar
          </Button>
          <Typography
            variant="h6"
            component="h1"
            fontWeight={700}
            sx={{ color: "primary.main", flex: 1, minWidth: 140 }}
          >
            Chamado detalhado
          </Typography>
          {showActions ? (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end", width: { xs: "100%", sm: "auto" } }}>
              {ticket.status === "Aberto" ? (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={
                    statusActionLoading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Clock style={{ width: 18, height: 18 }} />
                    )
                  }
                  onClick={handleStartAttendance}
                  disabled={statusActionLoading}
                >
                  Iniciar atendimento
                </Button>
              ) : null}
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={
                  statusActionLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <CheckCircle2 style={{ width: 18, height: 18 }} />
                  )
                }
                onClick={handleConclude}
                disabled={statusActionLoading}
              >
                Encerrar
              </Button>
            </Box>
          ) : null}
        </Box>
      </Paper>
      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <TicketDetailContent
          ticket={ticket}
          templateFields={templateFields}
          canComment={canComment}
          onReply={handleReply}
          replyLoading={replyLoading}
          currentUserEmail={user?.email}
        />
      </Box>
    </Box>
  );
}
