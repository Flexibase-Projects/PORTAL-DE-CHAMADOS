import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export interface StatusChangeReasonDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (mensagem: string) => void | Promise<void>;
}

export function StatusChangeReasonDialog({
  open,
  title,
  description = "Descreva o motivo da alteração. A mensagem será registrada no histórico do chamado.",
  confirmLabel = "Confirmar",
  loading = false,
  onClose,
  onConfirm,
}: StatusChangeReasonDialogProps) {
  const [mensagem, setMensagem] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setMensagem("");
      setTouched(false);
    }
  }, [open]);

  const trimmed = mensagem.trim();
  const showError = touched && trimmed.length === 0;

  const handleConfirm = async () => {
    setTouched(true);
    if (!trimmed) return;
    await onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="status-reason-title">
      <DialogTitle id="status-reason-title">{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        <TextField
          autoFocus
          multiline
          minRows={4}
          fullWidth
          label="Mensagem"
          placeholder="Ex.: Aguardando retorno do fornecedor…"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          onBlur={() => setTouched(true)}
          error={showError}
          helperText={showError ? "A mensagem é obrigatória" : " "}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={loading || trimmed.length === 0}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
