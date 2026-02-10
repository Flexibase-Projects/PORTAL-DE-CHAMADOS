import { useState } from "react";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import { Reply, CheckCircle2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";
import type { TemplateField } from "@/types/template";

interface TicketDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  templateFields?: TemplateField[];
  canEdit: boolean;
  canComment: boolean;
  onReply: (mensagem: string) => Promise<void>;
  onConclude: () => Promise<void>;
  replyLoading?: boolean;
}

function statusColor(s: string): "default" | "primary" | "warning" | "success" {
  switch (s) {
    case "Concluído": return "success";
    case "Em Andamento": return "warning";
    default: return "default";
  }
}

export function TicketDetailDrawer({
  open,
  onClose,
  ticket,
  templateFields = [],
  canEdit,
  canComment,
  onReply,
  onConclude,
  replyLoading = false,
}: TicketDetailDrawerProps) {
  const [responseText, setResponseText] = useState("");

  const handleSendReply = async () => {
    if (!responseText.trim()) return;
    await onReply(responseText.trim());
    setResponseText("");
  };

  if (!ticket) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}
    >
      <Box sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" fontWeight={600} noWrap>
              {ticket.assunto}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
              {ticket.numero_protocolo}
            </Typography>
          </Box>
          <Chip label={ticket.status} color={statusColor(ticket.status)} size="small" variant="outlined" />
          <IconButton size="small" onClick={onClose} aria-label="Fechar">
            <X style={{ width: 20, height: 20 }} />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Solicitante</Typography>
              <Typography variant="body2">{ticket.solicitante_nome || "—"}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Área</Typography>
              <Typography variant="body2">{ticket.area_destino}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Data</Typography>
              <Typography variant="body2">{formatDate(ticket.created_at)}</Typography>
            </Box>
            {ticket.prioridade && (
              <Box>
                <Typography variant="caption" color="text.secondary">Prioridade</Typography>
                <Typography variant="body2">{ticket.prioridade}</Typography>
              </Box>
            )}
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Mensagem</Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
            {ticket.mensagem}
          </Typography>

          {ticket.dados_extras && Object.keys(ticket.dados_extras).length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Campos adicionais</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 2 }}>
                {Object.entries(ticket.dados_extras).map(([key, value]) => {
                  const field = templateFields.find((f) => f.id === key || (f as { key?: string }).key === key);
                  const label = field?.label || key.replace(/_/g, " ");
                  const displayValue = value == null ? "—" : Array.isArray(value) ? value.join(", ") : String(value);
                  return (
                    <Box key={key}>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" sx={{ wordBreak: "break-word" }}>{displayValue}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}

          {ticket.respostas && ticket.respostas.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Respostas ({ticket.respostas.length})</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                {ticket.respostas.map((r) => (
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
                      <Typography variant="caption" fontWeight={600}>{r.autor_nome || "—"}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDate(r.created_at)}</Typography>
                    </Box>
                    <Typography variant="body2">{r.mensagem}</Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>

        {(canComment || canEdit) && ticket.status !== "Concluído" && (
          <>
            <Divider sx={{ my: 2 }} />
            {canComment && (
              <Box sx={{ mb: 1 }}>
                <TextField
                  multiline
                  rows={3}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Adicionar comentário..."
                  fullWidth
                  size="small"
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={replyLoading ? <CircularProgress size={16} /> : <Reply style={{ width: 16, height: 16 }} />}
                  onClick={handleSendReply}
                  disabled={replyLoading || !responseText.trim()}
                  sx={{ mt: 1 }}
                >
                  Enviar comentário
                </Button>
              </Box>
            )}
            {canEdit && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<CheckCircle2 style={{ width: 16, height: 16 }} />}
                  onClick={onConclude}
                  disabled={replyLoading}
                >
                  Concluir chamado
                </Button>
              </Box>
            )}
          </>
        )}

        <Button variant="text" size="small" onClick={onClose} sx={{ mt: 1 }}>
          Fechar
        </Button>
      </Box>
    </Drawer>
  );
}
