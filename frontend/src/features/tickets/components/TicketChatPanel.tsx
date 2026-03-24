import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { Reply } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";

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

export interface TicketChatThreadProps {
  ticket: Ticket;
  currentUserEmail?: string | null;
  /** Sem card nem título "Conversa (n)" — só as bolhas (título fica fora, ex.: Gestão de Chamados). */
  plain?: boolean;
}

/** Bolhas da conversa (sem composer). */
export function TicketChatThread({ ticket, currentUserEmail = null, plain = false }: TicketChatThreadProps) {
  const normalizedCurrentEmail = (currentUserEmail || "").trim().toLowerCase();
  const count = ticket.respostas?.length ?? 0;

  const body =
    count > 0 ? (
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
        {ticket.respostas!.map((r) => {
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
    ) : (
      <Typography variant="body2" color="text.secondary">
        Nenhuma mensagem na conversa ainda.
      </Typography>
    );

  if (plain) {
    return body;
  }

  return <SectionCard title={`Conversa (${count})`}>{body}</SectionCard>;
}

export interface TicketChatComposerProps {
  ticket: Ticket;
  canComment: boolean;
  onReply: (mensagem: string) => Promise<void>;
  replyLoading?: boolean;
  /** Sem card "Nova mensagem" — campo logo abaixo do thread (ex.: Gestão de Chamados). */
  plain?: boolean;
  /** Gestão: permitir comentário em chamado concluído sem reabrir o status. */
  allowReplyWhenConcluded?: boolean;
}

export function TicketChatComposer({
  ticket,
  canComment,
  onReply,
  replyLoading = false,
  plain = false,
  allowReplyWhenConcluded = false,
}: TicketChatComposerProps) {
  const [responseText, setResponseText] = useState("");

  const handleSendReply = async () => {
    if (!responseText.trim()) return;
    await onReply(responseText.trim());
    setResponseText("");
  };

  const blockedByStatus = ticket.status === "Concluído" && !allowReplyWhenConcluded;
  if (!canComment || blockedByStatus) return null;

  const fields = (
    <>
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
        sx={{ mt: plain ? 1 : 1.5 }}
      >
        Enviar comentário
      </Button>
    </>
  );

  if (plain) {
    return <Box sx={{ width: "100%" }}>{fields}</Box>;
  }

  return <SectionCard title="Nova mensagem">{fields}</SectionCard>;
}

export interface TicketChatPanelProps {
  ticket: Ticket;
  canComment: boolean;
  onReply: (mensagem: string) => Promise<void>;
  replyLoading?: boolean;
  currentUserEmail?: string | null;
  /** Sem padding de página (dentro de CardContent). */
  embedded?: boolean;
  /** Thread sem card duplicado (título da conversa fica no pai). */
  plainThread?: boolean;
}

/** Thread + composer (Gestão de Chamados ou uso compacto). */
export function TicketChatPanel({
  ticket,
  canComment,
  onReply,
  replyLoading = false,
  currentUserEmail = null,
  embedded = false,
  plainThread = false,
}: TicketChatPanelProps) {
  const inner = (
    <Stack spacing={plainThread ? 1 : 2}>
      <TicketChatThread ticket={ticket} currentUserEmail={currentUserEmail} plain={plainThread} />
      <TicketChatComposer
        ticket={ticket}
        canComment={canComment}
        onReply={onReply}
        replyLoading={replyLoading}
        plain={plainThread}
      />
    </Stack>
  );

  if (embedded) {
    return inner;
  }

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
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>{inner}</Box>
    </Box>
  );
}
