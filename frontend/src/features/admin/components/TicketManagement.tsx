import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { Reply, CheckCircle2, ArrowLeft } from "lucide-react";
import { ticketService } from "@/services/ticketService";
import { templateService } from "@/services/templateService";
import { TicketCard } from "@/features/tickets/components/TicketCard";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";
import type { TemplateField } from "@/types/template";

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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);

  useEffect(() => {
    loadTickets();
  }, []);

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
    if (initialTicketId && tickets.length > 0) {
      const found = tickets.find((t) => t.id === initialTicketId);
      if (found) setSelected(found);
    }
  }, [initialTicketId, tickets]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await ticketService.getReceived();
      if (res.success) setTickets(res.tickets || []);
    } catch {
      setError("Erro ao carregar chamados.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = async () => {
    if (!responseText.trim() || !selected) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await ticketService.addResponse(selected.id, {
        mensagem: responseText,
        autor_id: "admin",
      });
      if (res.success) {
        setSuccess("Resposta enviada!");
        setDialogOpen(false);
        setResponseText("");
        await loadTickets();
        if (selected) {
          const detail = await ticketService.getById(selected.id);
          if (detail.success) setSelected(detail.ticket);
        }
      }
    } catch {
      setError("Erro ao enviar resposta.");
    } finally {
      setActionLoading(false);
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
      }
    } catch {
      setError("Erro ao concluir chamado.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={120} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: selected ? "1fr 2fr" : "1fr" }, gap: 2 }}>
        <Box sx={{ maxHeight: { lg: "calc(100vh - 16rem)" }, overflow: "auto", pr: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Chamados Recebidos ({tickets.length})
          </Typography>
          {tickets.length === 0 ? (
            <Alert severity="info">Nenhum chamado recebido no momento.</Alert>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {tickets.map((t) => (
                <TicketCard
                  key={t.id}
                  ticket={t}
                  onView={() => {
                    setSelected(t);
                    setError("");
                    setSuccess("");
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {selected && (
          <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
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

              {selected.respostas && selected.respostas.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Respostas ({selected.respostas.length})
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {selected.respostas.map((r) => (
                      <Box
                        key={r.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: "action.hover",
                          border: 1,
                          borderColor: "divider",
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" fontWeight={600}>
                            {r.autor_nome || "Administrador"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(r.created_at)}
                          </Typography>
                        </Box>
                        <Typography variant="body2">{r.mensagem}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Reply style={{ width: 18, height: 18 }} />}
                  onClick={() => setDialogOpen(true)}
                  disabled={actionLoading || selected.status === "Concluído"}
                >
                  Responder
                </Button>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Responder Chamado</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={6}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Digite sua resposta..."
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSendResponse}
            disabled={actionLoading || !responseText.trim()}
            startIcon={actionLoading ? <CircularProgress size={18} /> : null}
          >
            {actionLoading ? "Enviando..." : "Enviar Resposta"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
