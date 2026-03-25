import { useState, useEffect, useRef, useLayoutEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Collapse from "@mui/material/Collapse";
import Fade from "@mui/material/Fade";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { CheckCircle2, ArrowLeft, Archive } from "lucide-react";
import { ticketService } from "@/services/ticketService";
import { notificationService } from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";
import { templateService } from "@/services/templateService";
import { TicketsTable } from "@/features/tickets/components/TicketsTable";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";
import type { TemplateField } from "@/types/template";
import { TicketChatThread, TicketChatComposer } from "@/features/tickets/components/TicketChatPanel";

interface Props {
  initialTicketId?: string;
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

export function TicketManagement({ initialTicketId }: Props) {
  const theme = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [concludedTickets, setConcludedTickets] = useState<Ticket[]>([]);
  const [concludedSectionOpen, setConcludedSectionOpen] = useState(false);
  const [concludedLoading, setConcludedLoading] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const listColumnRef = useRef<HTMLDivElement>(null);

  const lastRespostaKey =
    selected?.respostas?.length && selected.respostas.length > 0
      ? `${selected.respostas.length}-${selected.respostas[selected.respostas.length - 1].id}`
      : "0";

  useLayoutEffect(() => {
    const el = threadScrollRef.current;
    if (!el) return;
    const scrollToEnd = () => {
      el.scrollTop = el.scrollHeight;
    };
    scrollToEnd();
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(scrollToEnd);
    });
    return () => cancelAnimationFrame(raf);
  }, [selected?.id, lastRespostaKey]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setTickets([]);
      setLoading(false);
      return;
    }
    loadTickets();
  }, [authLoading, user?.id, user?.email]);

  useEffect(() => {
    if (selected?.area_destino) {
      templateService
        .getTemplate(selected.area_destino)
        .then((res) =>
          setTemplateFields(Array.isArray(res.template?.fields) ? res.template.fields : [])
        )
        .catch(() => setTemplateFields([]));
    } else {
      setTemplateFields([]);
    }
  }, [selected?.area_destino]);

  useEffect(() => {
    if (!user?.id) return;
    const onRealtime = (event: Event) => {
      const custom = event as CustomEvent<{ ticketIds?: string[] }>;
      void loadTickets();
      if (concludedSectionOpen) void loadConcludedTickets();
      if (!selected?.id) return;
      const ids = custom.detail?.ticketIds || [];
      if (ids.length > 0 && !ids.includes(selected.id)) return;
      ticketService
        .getById(selected.id)
        .then((res) => {
          if (!res.success || !res.ticket) return;
          setSelected(res.ticket);
          setTickets((prev) => prev.map((t) => (t.id === res.ticket.id ? res.ticket : t)));
          setConcludedTickets((prev) => prev.map((t) => (t.id === res.ticket.id ? res.ticket : t)));
        })
        .catch(() => {});
    };
    window.addEventListener("tickets-realtime-update", onRealtime as EventListener);
    return () => window.removeEventListener("tickets-realtime-update", onRealtime as EventListener);
  }, [user?.id, selected?.id, concludedSectionOpen, user?.email]);

  useEffect(() => {
    if (!initialTicketId) return;
    const found =
      tickets.find((t) => t.id === initialTicketId) ??
      concludedTickets.find((t) => t.id === initialTicketId);
    if (found) setSelected(found);
  }, [initialTicketId, tickets, concludedTickets]);

  useLayoutEffect(() => {
    if (!selected?.id) return;
    const root = listColumnRef.current;
    if (!root) return;
    const safeId =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(selected.id)
        : selected.id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const row = root.querySelector<HTMLElement>(`[data-ticket-id="${safeId}"]`);
    if (!row) return;
    const r = row.getBoundingClientRect();
    const c = root.getBoundingClientRect();
    const nextTop = root.scrollTop + (r.top - c.top) - (c.height / 2 - r.height / 2);
    root.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
  }, [selected?.id, tickets, concludedTickets, concludedSectionOpen]);

  /** Lista / meus-chamados não trazem `respostas`; só o GET por id monta o chat. */
  useEffect(() => {
    const id = selected?.id;
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await ticketService.getById(id);
        if (cancelled || !res.success || !res.ticket) return;
        const full = res.ticket;
        setSelected((prev) => (prev?.id === id ? full : prev));
        setTickets((prev) => prev.map((t) => (t.id === id ? full : t)));
        setConcludedTickets((prev) => prev.map((t) => (t.id === id ? full : t)));
      } catch {
        /* mantém o ticket da listagem */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  const loadTickets = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await ticketService.getReceived(user.id, user.email);
      if (res.success) setTickets(res.tickets || []);
    } catch {
      setError("Erro ao carregar chamados.");
    } finally {
      setLoading(false);
    }
  };

  const loadConcludedTickets = async () => {
    if (!user?.id) return;
    setConcludedLoading(true);
    try {
      const res = await ticketService.getReceivedConcluded(user.id, user.email);
      if (res.success) setConcludedTickets(res.tickets || []);
    } catch {
      setError("Erro ao carregar chamados concluídos.");
    } finally {
      setConcludedLoading(false);
    }
  };

  const handleReply = async (mensagem: string) => {
    if (!selected || !user?.id) return;
    setReplyLoading(true);
    try {
      const res = await ticketService.addResponse(selected.id, {
        mensagem,
        autor_id: "current",
        auth_user_id: user.id,
        auth_user_email: user.email ?? undefined,
      });
      if (res.success && res.ticket) {
        setSelected(res.ticket);
        setTickets((prev) => prev.map((t) => (t.id === res.ticket!.id ? res.ticket! : t)));
        setConcludedTickets((prev) => prev.map((t) => (t.id === res.ticket!.id ? res.ticket! : t)));
        notificationService.markReadByTicket(selected.id, user.id).catch(() => {});
        window.dispatchEvent(new CustomEvent("notifications-refresh"));
      }
    } finally {
      setReplyLoading(false);
    }
  };

  const handleConclude = async () => {
    if (!selected || !confirm("Tem certeza que deseja concluir este chamado?")) return;
    setActionLoading(true);
    try {
      const res = await ticketService.updateStatus(selected.id, "Concluído");
      if (res.success) {
        setSuccess("Chamado concluído!");
        setSelected(null);
        await loadTickets();
        if (concludedSectionOpen) await loadConcludedTickets();
      }
    } catch {
      setError("Erro ao concluir chamado.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Skeleton variant="text" width={220} height={28} />
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minHeight: 0,
        height: { xs: "auto", lg: selected ? "calc(100dvh - 150px)" : "auto" },
        overflow: { xs: "visible", lg: selected ? "hidden" : "visible" },
      }}
    >
      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Box
        sx={{
          flex: { xs: 0, lg: selected ? 1 : 0 },
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: selected ? "minmax(0, 1fr) minmax(340px, 440px)" : "1fr",
          },
          gridTemplateRows: {
            xs: "auto",
            lg: selected ? "minmax(0, 1fr)" : "auto",
          },
          gap: 2,
          alignItems: { xs: "start", lg: selected ? "stretch" : "start" },
          minHeight: 0,
          height: {
            xs: "auto",
            lg: selected ? "100%" : "auto",
          },
          overflow: { xs: "visible", lg: selected ? "hidden" : "visible" },
        }}
      >
        <Box
          ref={listColumnRef}
          sx={{
            minWidth: 0,
            minHeight: 0,
            pr: { lg: 0.5 },
            overflowY: { xs: "visible", lg: selected ? "auto" : "visible" },
            alignSelf: { lg: selected ? "stretch" : undefined },
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Chamados Recebidos ({tickets.length})
          </Typography>
          <TicketsTable
            tickets={tickets}
            selectedTicketId={selected?.id ?? null}
            onRowActivate={(t) => {
              setSelected((prev) => (prev?.id === t.id ? null : t));
              setError("");
              setSuccess("");
            }}
            emptyMessage="Nenhum chamado recebido no momento."
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<Archive style={{ width: 18, height: 18 }} />}
            onClick={() => {
              setConcludedSectionOpen((open) => {
                const next = !open;
                if (next) void loadConcludedTickets();
                return next;
              });
            }}
            sx={{ mt: 2, alignSelf: "flex-start" }}
          >
            {concludedSectionOpen ? "Ocultar chamados concluídos" : "Ver chamados concluídos"}
          </Button>
          <Collapse
            in={concludedSectionOpen}
            timeout={{ enter: 440, exit: 300 }}
            easing={theme.transitions.easing.easeInOut}
            unmountOnExit
            sx={{ width: "100%" }}
          >
            <Fade in={concludedSectionOpen} timeout={360} easing={theme.transitions.easing.easeOut}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Chamados concluídos ({concludedTickets.length})
                </Typography>
                {concludedLoading ? (
                  <Skeleton variant="rounded" height={280} sx={{ borderRadius: 1 }} />
                ) : (
                  <TicketsTable
                    tickets={concludedTickets}
                    selectedTicketId={selected?.id ?? null}
                    onRowActivate={(t) => {
                      setSelected((prev) => (prev?.id === t.id ? null : t));
                      setError("");
                      setSuccess("");
                    }}
                    emptyMessage="Nenhum chamado concluído encontrado."
                  />
                )}
              </Box>
            </Fade>
          </Collapse>
        </Box>

        {selected && (
          <Card
            sx={{
              minHeight: 0,
              height: { xs: "auto", lg: "100%" },
              maxHeight: { xs: "none", lg: "100%" },
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2, sm: 3 },
                minHeight: 0,
                overflowY: { xs: "visible", lg: "auto" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {selected.assunto}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                    {selected.numero_protocolo}
                  </Typography>
                </Box>
                <Chip label={selected.status} color={statusColor(selected.status)} size="small" variant="outlined" />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Solicitante</Typography>
                  <Typography variant="body2">{selected.solicitante_nome || "N/A"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body2">{selected.solicitante_email || "N/A"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Setor</Typography>
                  <Typography variant="body2">{selected.setor}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Departamento</Typography>
                  <Typography variant="body2">{selected.area_destino}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Data</Typography>
                  <Typography variant="body2">{formatDate(selected.created_at)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Responsável</Typography>
                  <Typography variant="body2">{selected.responsavel_nome || "Não atribuído"}</Typography>
                </Box>
                {selected.prioridade && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Prioridade</Typography>
                    <Typography variant="body2">{selected.prioridade}</Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Mensagem</Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {selected.mensagem}
              </Typography>

              {selected.dados_extras && Object.keys(selected.dados_extras).length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Campos adicionais</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    {Object.entries(selected.dados_extras).map(([key, value]) => {
                      const field = templateFields.find((f) => f.id === key || f.key === key);
                      const label = field?.label || key.replace(/_/g, " ").replace(/^field\s*/i, "");
                      const displayValue =
                        value == null
                          ? "-"
                          : Array.isArray(value)
                            ? value.join(", ")
                            : String(value);
                      return (
                        <Box key={key}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {displayValue}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Conversa
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  minWidth: 0,
                }}
              >
                <Box
                  ref={threadScrollRef}
                  sx={{
                    maxHeight: { xs: "min(45vh, 400px)", sm: "min(42vh, 440px)" },
                    minHeight: 120,
                    overflow: "auto",
                    pr: 0.5,
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    "&::-webkit-scrollbar": {
                      width: 0,
                      height: 0,
                      display: "none",
                    },
                  }}
                >
                  <TicketChatThread ticket={selected} currentUserEmail={user?.email} plain />
                </Box>
                <Box
                  sx={{
                    flexShrink: 0,
                    pt: 1.5,
                    mt: 1,
                    borderTop: 1,
                    borderColor: "divider",
                  }}
                >
                  <TicketChatComposer
                    ticket={selected}
                    canComment
                    onReply={handleReply}
                    replyLoading={replyLoading}
                    plain
                    allowReplyWhenConcluded
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle2 style={{ width: 18, height: 18 }} />}
                  onClick={handleConclude}
                  disabled={actionLoading || selected.status === "Concluído"}
                >
                  Concluir
                </Button>
                <Button variant="outlined" startIcon={<ArrowLeft style={{ width: 18, height: 18 }} />} onClick={() => setSelected(null)}>
                  Voltar
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
