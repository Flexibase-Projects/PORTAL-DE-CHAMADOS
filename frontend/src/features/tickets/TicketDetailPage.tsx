import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import { ArrowLeft } from "lucide-react";
import { ticketService } from "@/services/ticketService";
import { templateService } from "@/services/templateService";
import { notificationService } from "@/services/notificationService";
import { TicketDetailContent } from "./components/TicketDetailContent";
import { useAuth } from "@/contexts/AuthContext";
import type { Ticket } from "@/types/ticket";
import type { TemplateField } from "@/types/template";

type PermissaoMap = Record<string, "view" | "view_edit">;

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

  const handleConclude = async () => {
    if (!ticket || !confirm("Concluir este chamado?")) return;
    setReplyLoading(true);
    try {
      const res = await ticketService.updateStatus(ticket.id, "Concluído");
      if (res.success) {
        navigate("/meus-chamados");
      }
    } finally {
      setReplyLoading(false);
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
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2, borderBottom: 1, borderColor: "divider" }}>
          <IconButton onClick={handleBack} aria-label="Voltar" size="small">
            <ArrowLeft style={{ width: 24, height: 24 }} />
          </IconButton>
          <Skeleton variant="text" width={200} height={32} />
        </Box>
        <Box sx={{ p: 2, flex: 1 }}>
          <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="80%" />
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <IconButton onClick={handleBack} aria-label="Voltar para Meus Chamados" size="medium">
          <ArrowLeft style={{ width: 24, height: 24 }} />
        </IconButton>
        <Typography variant="h6" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
          {ticket.assunto || "Detalhes do chamado"}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <TicketDetailContent
          ticket={ticket}
          templateFields={templateFields}
          canEdit={canEdit}
          canComment={canComment}
          onReply={handleReply}
          onConclude={handleConclude}
          replyLoading={replyLoading}
          currentUserEmail={user?.email}
        />
      </Box>
    </Box>
  );
}
