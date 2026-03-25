import { useEffect, useId, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import {
  ArrowRightLeft,
  CheckCircle2,
  FolderOpen,
  PauseCircle,
  PlayCircle,
  X,
} from "lucide-react";
import { statusHexForTimelineMarker } from "@/constants/ticketStatusColors";
import { formatDateTimePartsPtBr } from "@/lib/utils";
import { ticketService } from "@/services/ticketService";
import type { Ticket } from "@/types/ticket";
import {
  buildTicketStatusTimelineSteps,
  ticketStatusHistoryMissingActivities,
  type TimelineMarker,
} from "@/utils/ticketStatusTimeline";

const MARKER_ICON_PX = 24;

function TimelineStepMarkerIcon({ marker, color }: { marker: TimelineMarker; color: string }) {
  const common = {
    size: MARKER_ICON_PX,
    strokeWidth: 2.25,
    color,
    "aria-hidden": true as const,
  };
  switch (marker) {
    case "aberto":
      return <FolderOpen {...common} />;
    case "em_andamento":
      return <PlayCircle {...common} />;
    case "pausado":
      return <PauseCircle {...common} />;
    case "concluido":
      return <CheckCircle2 {...common} />;
    default:
      return <ArrowRightLeft {...common} />;
  }
}

export interface TicketStatusTimelineDialogProps {
  open: boolean;
  onClose: () => void;
  ticketId: string | null;
}

export function TicketStatusTimelineDialog({ open, onClose, ticketId }: TicketStatusTimelineDialogProps) {
  const theme = useTheme();
  const titleId = useId();
  const isNarrow = useMediaQuery(theme.breakpoints.down("sm"));
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !ticketId) {
      setTicket(null);
      setError("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    ticketService
      .getById(ticketId)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.ticket) setTicket(res.ticket);
        else setError(!res.success && "error" in res && res.error ? res.error : "Não foi possível carregar o chamado.");
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar o chamado.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, ticketId]);

  const steps = useMemo(() => (ticket ? buildTicketStatusTimelineSteps(ticket) : []), [ticket]);
  const historyMissing = Boolean(ticket && ticketStatusHistoryMissingActivities(ticket));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby={titleId}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.08),
            backdropFilter: "blur(8px)",
          },
        },
        paper: {
          sx: {
            borderRadius: "16px",
            border: `1px solid ${theme.palette.divider}`,
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.background.paper, 0.98)
                : alpha("#ffffff", 0.98),
            backdropFilter: "blur(16px)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 24px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)"
                : `0 16px 48px ${alpha(theme.palette.primary.main, 0.12)}, 0 4px 16px rgba(0,0,0,0.06)`,
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle
        id={titleId}
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          pr: 1,
          pb: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography component="span" variant="h6" fontWeight={700} sx={{ display: "block" }}>
            Linha do tempo
          </Typography>
          {ticket && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {ticket.numero_protocolo}
              {ticket.assunto ? ` · ${ticket.assunto}` : ""}
            </Typography>
          )}
        </Box>
        <IconButton aria-label="Fechar" size="small" onClick={onClose} sx={{ color: "text.secondary", mt: -0.25 }}>
          <X size={20} strokeWidth={2} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0, pb: 2 }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={36} aria-label="Carregando" />
          </Box>
        )}
        {!loading && error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}
        {!loading && !error && ticket && steps.length > 0 && (
          <>
          {historyMissing && (
            <Alert severity="info" variant="outlined" icon={false} sx={{ mb: 1.5 }} role="status">
              <Typography variant="subtitle2" component="p" fontWeight={700} sx={{ mb: 0.75 }}>
                Mesmo painel — Linha do tempo
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div" sx={{ lineHeight: 1.5 }}>
                Não é outra janela: esta faixa faz parte deste diálogo. O cadastro indica{" "}
                <strong>Estado atual: {ticket.status}</strong>, mas ainda não existem linhas de histórico de mudança de
                status (dados antigos ou alteração fora do portal) — por isso abaixo só aparece o marco{" "}
                <strong>Chamado aberto</strong>. Da próxima vez que alguém usar <strong>Pausar</strong> ou{" "}
                <strong>Retomar</strong> aqui, com a mensagem obrigatória, cada alteração ganha um marco à direita, na
                ordem em que ocorrer.
              </Typography>
            </Alert>
          )}
          <Box
            sx={{
              pt: 1,
              display: "flex",
              flexDirection: isNarrow ? "column" : "row",
              alignItems: isNarrow ? "stretch" : "flex-start",
              justifyContent: isNarrow ? "stretch" : "flex-start",
              gap: isNarrow ? 2.5 : 1,
              position: "relative",
              px: { xs: 0, sm: 0.5 },
              overflowX: isNarrow ? "visible" : "auto",
              pb: isNarrow ? 0 : 0.5,
            }}
          >
            {!isNarrow && (
              <Box
                sx={{
                  position: "absolute",
                  left: 48,
                  right: 48,
                  top: 58,
                  height: 3,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                  zIndex: 0,
                }}
              />
            )}
            {steps.map((step, i) => {
              const labelOnTop = isNarrow ? true : i % 2 === 0;
              const accent = statusHexForTimelineMarker(step.marker);
              const when = formatDateTimePartsPtBr(step.at);

              return (
                <Box
                  key={step.sourceActivityId ?? `${step.kind}-${step.at}-${i}-${step.label}`}
                  sx={{
                    flex: isNarrow ? "none" : "0 0 auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    position: "relative",
                    zIndex: 1,
                    minWidth: { xs: 0, sm: 108 },
                    maxWidth: { xs: "100%", sm: 168 },
                  }}
                >
                  {labelOnTop && (
                    <Box sx={{ minHeight: { sm: 44 }, display: "flex", alignItems: "flex-end", mb: { xs: 0.75, sm: 1 } }}>
                      <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.35, px: 0.25 }}>
                        {step.label}
                      </Typography>
                    </Box>
                  )}
                  <Box
                    title={step.label}
                    aria-label={step.label}
                    sx={{
                      minWidth: 52,
                      width: 52,
                      minHeight: 52,
                      height: 52,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(accent, theme.palette.mode === "dark" ? 0.35 : 0.18),
                      border: `2px solid ${alpha(accent, 0.65)}`,
                      color: accent,
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? `0 4px 14px rgba(0,0,0,0.35)`
                          : `0 4px 12px ${alpha(accent, 0.25)}`,
                    }}
                  >
                    <TimelineStepMarkerIcon marker={step.marker} color={accent} />
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.75, display: "block", maxWidth: 220, textAlign: "center", lineHeight: 1.35 }}
                  >
                    {when.full}
                  </Typography>
                  {step.subtitle && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block", maxWidth: 260 }}>
                      {step.subtitle}
                    </Typography>
                  )}
                  {!labelOnTop && (
                    <Box sx={{ minHeight: { sm: 44 }, display: "flex", alignItems: "flex-start", mt: { xs: 0.75, sm: 1 } }}>
                      <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.35, px: 0.25 }}>
                        {step.label}
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
          {steps.length === 1 && steps[0]?.kind === "abertura" && ticket.status === "Aberto" && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, px: 1, display: "block", textAlign: "center", lineHeight: 1.5, maxWidth: 520, mx: "auto" }}
            >
              A linha segue a ordem do tempo (esquerda → direita: mais antigo → mais recente). Cada pausa ou retomada pelo
              portal vira um marco à direita do anterior. Enquanto o chamado estiver só <strong>Aberto</strong>, só a
              abertura aparece.
            </Typography>
          )}
          </>
        )}
        {!loading && !error && ticket && steps.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Nenhum marco disponível para este chamado.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button onClick={onClose} variant="contained" color="inherit" sx={{ borderRadius: 1.5 }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
