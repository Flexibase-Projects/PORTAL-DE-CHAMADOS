import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { TicketCheck } from "lucide-react";

export function AppLoader() {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        bgcolor: "background.default",
        color: "text.primary",
        animation: "appLoaderFadeIn 0.25s ease-out",
        "@keyframes appLoaderFadeIn": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
      role="status"
      aria-label="Carregando Portal de Chamados"
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          color: "primary.main",
        }}
      >
        <TicketCheck style={{ width: 40, height: 40 }} aria-hidden />
        <Typography variant="h5" fontWeight={700} component="span">
          Portal de Chamados
        </Typography>
      </Box>
      <Box sx={{ width: "min(280px, 80%)" }}>
        <LinearProgress color="primary" sx={{ height: 6, borderRadius: 3 }} />
      </Box>
    </Box>
  );
}
