import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import { useTheme } from "@mui/material/styles";
import { Reply, MessageSquare, GitBranch, FilePlus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";
import type { TemplateField } from "@/types/template";
import { TicketStatusPill } from "./TicketStatusPill";

export interface TicketDetailContentProps {
  ticket: Ticket;
  templateFields?: TemplateField[];
  canComment: boolean;
  onReply: (mensagem: string) => Promise<void>;
  replyLoading?: boolean;
  currentUserEmail?: string | null;
}

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderColor: "divider", boxShadow: "none", bgcolor: "background.paper" }}>
      <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2, letterSpacing: "0.02em" }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      {typeof children === "string" || typeof children === "number" ? (
        <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
          {children}
        </Typography>
      ) : (
        children
      )}
    </Box>
  );
}

function SolicitanteBlock({ ticket }: { ticket: Ticket }) {
  const name = ticket.solicitante_nome?.trim();
  if (!name) {
    return <Typography variant="body2">—</Typography>;
  }
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Avatar sx={{ width: 40, height: 40, fontSize: "0.875rem", fontWeight: 700, bgcolor: "primary.main", color: "primary.contrastText" }}>
        {getInitials(name)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600}>
          {name}
        </Typography>
        {ticket.solicitante_email ? (
          <Typography variant="caption" color="text.secondary" display="block">
            {ticket.solicitante_email}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

const personCaptionSx = {
  display: "block",
  mb: 1.5,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  fontSize: "0.7rem",
};

/** Mesma coluna visual que “Atualizado em” / campos da direita (grid 1fr 1fr). */
function TecnicoResponsavelBlock({ ticket }: { ticket: Ticket }) {
  const name = ticket.responsavel_nome?.trim();
  return (
    <Box sx={{ minWidth: 0, width: "100%" }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={personCaptionSx}>
        Técnico responsável
      </Typography>
      {name ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              fontSize: "0.875rem",
              fontWeight: 700,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              flexShrink: 0,
            }}
          >
            {getInitials(name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700}>
              {name}
            </Typography>
            {ticket.responsavel_email ? (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25, wordBreak: "break-word" }}>
                {ticket.responsavel_email}
              </Typography>
            ) : null}
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Não atribuído
        </Typography>
      )}
    </Box>
  );
}

export function TicketDetailContent({
  ticket,
  templateFields = [],
  canComment,
  onReply,
  replyLoading = false,
  currentUserEmail = null,
}: TicketDetailContentProps) {
  const theme = useTheme();
  const [responseText, setResponseText] = useState("");
  const normalizedCurrentEmail = (currentUserEmail || "").trim().toLowerCase();

  const handleSendReply = async () => {
    if (!responseText.trim()) return;
    await onReply(responseText.trim());
    setResponseText("");
  };

  const hasExtras = ticket.dados_extras && Object.keys(ticket.dados_extras).length > 0;

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        bgcolor: "background.default",
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderColor: "divider", boxShadow: "none", bgcolor: "background.paper" }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <Typography component="h2" variant="h5" fontWeight={700} color="primary.main" sx={{ lineHeight: 1.3, flex: 1, minWidth: 0, pr: 1 }}>
                {ticket.assunto || "Sem assunto"}
              </Typography>
              <Box sx={{ flexShrink: 0 }}>
                <TicketStatusPill status={ticket.status} />
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                columnGap: 2,
                rowGap: 2.5,
                mt: 0,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={personCaptionSx}>
                  Solicitante
                </Typography>
                <SolicitanteBlock ticket={ticket} />
              </Box>
              <TecnicoResponsavelBlock ticket={ticket} />

              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ ...personCaptionSx, mt: { xs: 0.5, sm: 0 }, gridColumn: { xs: "1", sm: "1 / -1" } }}
              >
                Datas
              </Typography>
              <DetailField label="Criado em">{formatDate(ticket.created_at)}</DetailField>
              <DetailField label="Atualizado em">
                {formatDate(ticket.updated_at?.trim() ? ticket.updated_at : ticket.created_at)}
              </DetailField>

              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ ...personCaptionSx, gridColumn: { xs: "1", sm: "1 / -1" } }}
              >
                Classificação
              </Typography>
              <DetailField label="Tipo de suporte">{ticket.tipo_suporte?.trim() || "—"}</DetailField>
              <DetailField label="Setor">{ticket.setor || "—"}</DetailField>
              <DetailField label="Área de destino">{ticket.area_destino || "—"}</DetailField>
              <DetailField label="Prioridade">{ticket.prioridade || "—"}</DetailField>
            </Box>
          </Paper>

          <SectionCard title="Descrição">
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "text.primary" }}>
              {ticket.mensagem || "—"}
            </Typography>
          </SectionCard>

          {hasExtras ? (
            <SectionCard title="Campos adicionais">
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                {Object.entries(ticket.dados_extras!).map(([key, value]) => {
                  const field = templateFields.find((f) => f.id === key || (f as { key?: string }).key === key);
                  const label = field?.label || key.replace(/_/g, " ");
                  const displayValue =
                    value == null ? "—" : Array.isArray(value) ? value.join(", ") : String(value);
                  return <DetailField key={key} label={label}>{displayValue}</DetailField>;
                })}
              </Box>
            </SectionCard>
          ) : null}

          {ticket.respostas && ticket.respostas.length > 0 ? (
            <SectionCard title={`Conversa (${ticket.respostas.length})`}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "action.hover",
                }}
              >
                {ticket.respostas.map((r) => {
                  const isOwn =
                    normalizedCurrentEmail && (r.autor_email || "").trim().toLowerCase() === normalizedCurrentEmail;
                  return (
                    <Box
                      key={r.id}
                      sx={{
                        display: "flex",
                        justifyContent: isOwn ? "flex-end" : "flex-start",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 0.75,
                          maxWidth: "min(85%, 400px)",
                          "& .message-time": { opacity: 0 },
                          "&:hover .message-time": { opacity: 1 },
                        }}
                      >
                        {isOwn && (
                          <Typography
                            className="message-time"
                            variant="caption"
                            sx={{
                              flexShrink: 0,
                              transition: "opacity 0.15s ease",
                              fontSize: "0.7rem",
                              color: "text.secondary",
                            }}
                          >
                            {formatDate(r.created_at)}
                          </Typography>
                        )}
                        <Box
                          sx={{
                            minWidth: 0,
                            p: 1.5,
                            borderRadius: 2,
                            ...(isOwn
                              ? {
                                  background: "linear-gradient(180deg, #405de6 0%, #5851d8 100%)",
                                  color: "#fff",
                                }
                              : {
                                  bgcolor: "background.paper",
                                  color: "text.primary",
                                }),
                          }}
                        >
                          {!isOwn && (
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 700, fontSize: "0.875rem", opacity: 0.9, display: "block", mb: 0.25 }}
                            >
                              {r.autor_nome || "—"}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {r.mensagem}
                          </Typography>
                        </Box>
                        {!isOwn && (
                          <Typography
                            className="message-time"
                            variant="caption"
                            sx={{
                              flexShrink: 0,
                              transition: "opacity 0.15s ease",
                              fontSize: "0.7rem",
                              color: "text.secondary",
                            }}
                          >
                            {formatDate(r.created_at)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </SectionCard>
          ) : null}

          {ticket.atividades && ticket.atividades.length > 0 ? (
            <SectionCard title="Histórico">
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                Quando aconteceu, quem fez e o que foi feito.
              </Typography>
              <Stack spacing={1}>
                {ticket.atividades.map((a) => (
                  <Box
                    key={a.id}
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      alignItems: "flex-start",
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: "action.hover",
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Box sx={{ flexShrink: 0, mt: 0.25, color: "text.secondary" }}>
                      {a.tipo === "criado" && <FilePlus size={18} color={theme.palette.primary.main} />}
                      {a.tipo === "comentario" && <MessageSquare size={18} color={theme.palette.info.main} />}
                      {a.tipo === "status_alterado" && <GitBranch size={18} color={theme.palette.warning.main} />}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5, mb: 0.25 }}>
                        <Typography variant="caption" fontWeight={600}>
                          {a.autor_nome || "Sistema"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(a.created_at)}
                        </Typography>
                      </Box>
                      {a.tipo === "criado" && (
                        <Typography variant="body2" color="text.secondary">
                          Chamado criado.
                        </Typography>
                      )}
                      {a.tipo === "comentario" && a.detalhes?.mensagem != null && (
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                          {a.detalhes.mensagem}
                          {a.detalhes.mensagem && a.detalhes.mensagem.length >= 300 && "…"}
                        </Typography>
                      )}
                      {a.tipo === "status_alterado" && (
                        <Typography variant="body2" color="text.secondary">
                          Status alterado de <strong>{a.detalhes?.status_anterior ?? "—"}</strong> para{" "}
                          <strong>{a.detalhes?.status_novo ?? "—"}</strong>.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </SectionCard>
          ) : null}

          {canComment && ticket.status !== "Concluído" ? (
            <SectionCard title="Nova mensagem">
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
                startIcon={
                  replyLoading ? <CircularProgress size={16} /> : <Reply style={{ width: 16, height: 16 }} />
                }
                onClick={handleSendReply}
                disabled={replyLoading || !responseText.trim()}
                sx={{ mt: 1.5 }}
              >
                Enviar comentário
              </Button>
            </SectionCard>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
