import { useLayoutEffect, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grow from "@mui/material/Grow";
import { useTheme, alpha } from "@mui/material/styles";
import { X } from "lucide-react";

const FULLSCREEN_GROW_MS = 520;

function triggerChartResize() {
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("resize"));
  });
}

export interface ChartFullscreenDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** id estável para aria-labelledby (ex.: useId sem dois-pontos). */
  titleId: string;
  children: React.ReactNode;
}

export function ChartFullscreenDialog({
  open,
  onClose,
  title,
  titleId,
  children,
}: ChartFullscreenDialogProps) {
  const theme = useTheme();

  const onEntered = useCallback(() => {
    triggerChartResize();
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => triggerChartResize());
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      aria-labelledby={titleId}
      TransitionComponent={Grow}
      TransitionProps={{
        timeout: FULLSCREEN_GROW_MS,
        easing: theme.transitions.easing.easeOut,
        style: { transformOrigin: "50% 45%" },
        onEntered,
      }}
      slotProps={{
        paper: {
          elevation: 8,
          sx: {
            width: "min(96vw, 1200px)",
            height: "min(88vh, 900px)",
            maxHeight: 900,
            display: "flex",
            flexDirection: "column",
            borderRadius: "14px",
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
          },
        },
        backdrop: {
          invisible: false,
          sx: {
            backgroundColor: alpha(
              theme.palette.primary.main,
              theme.palette.mode === "dark" ? 0.14 : 0.08
            ),
            backdropFilter: "blur(6px)",
          },
        },
      }}
    >
      <DialogTitle
        id={titleId}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          pr: 1,
          py: 1.5,
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} component="span">
          {title}
        </Typography>
        <IconButton aria-label="Fechar visualização ampliada" onClick={onClose} size="small" edge="end">
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          px: 2,
          pb: 2,
          pt: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </Box>
    </Dialog>
  );
}
