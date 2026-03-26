import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { alpha, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Divider from "@mui/material/Divider";
import { ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const LOGIN_LEFT_BACKGROUND = "/images/login-left-background.webp";
const REMEMBER_KEY = "cdt-login-remember-30d";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type RightPaneMode = "loginForm" | "sobreScreen";

const CHIP_LABELS = [
  "Abertura",
  "Triagem",
  "Em andamento",
  "Pausas",
  "Conclusão",
  "SLA",
  "Histórico",
  "Indicadores",
] as const;

const FAQ_ITEMS = [
  {
    title: "Abertura de chamado",
    body: "Permite registrar solicitações com assunto, categoria e contexto do problema para iniciar o atendimento com informações completas.",
  },
  {
    title: "Triagem e priorização",
    body: "Organiza os chamados por criticidade e urgência, ajudando o time a atacar primeiro o que gera mais impacto.",
  },
  {
    title: "Fluxo de status",
    body: "Cada demanda passa por etapas como Aberto, Em andamento, Pausado e Concluído, com timeline para rastrear mudanças.",
  },
  {
    title: "SLA e prazos",
    body: "Acompanha tempo de atendimento e tempo de resolução para identificar riscos de atraso e melhorar previsibilidade.",
  },
  {
    title: "Pausas com justificativa",
    body: "Quando necessário, o chamado pode ser pausado com motivo registrado, mantendo transparência e histórico da decisão.",
  },
  {
    title: "Histórico completo",
    body: "Todas as movimentações ficam registradas para auditoria e consulta rápida, incluindo quem alterou e quando alterou.",
  },
  {
    title: "Colaboração entre áreas",
    body: "Solicitantes e equipes de destino acompanham o mesmo contexto, reduzindo retrabalho e ruído de comunicação.",
  },
  {
    title: "Indicadores de operação",
    body: "Dashboards exibem volume de chamados, taxa de conclusão e distribuição por setor para apoiar melhorias contínuas.",
  },
] as const;

interface RememberPayload {
  email: string;
  password: string;
  expiresAt: number;
}

export function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<RightPaneMode>("loginForm");
  const [remember30d, setRemember30d] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<RememberPayload>;
      if (!parsed?.email || !parsed?.password || typeof parsed?.expiresAt !== "number") {
        localStorage.removeItem(REMEMBER_KEY);
        return;
      }
      if (parsed.expiresAt <= Date.now()) {
        localStorage.removeItem(REMEMBER_KEY);
        return;
      }
      setEmail(parsed.email);
      setPassword(parsed.password);
      setRemember30d(true);
    } catch {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }, []);

  const leftGradient = theme.palette.mode === "dark"
    ? "linear-gradient(145deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)"
    : "linear-gradient(145deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)";
  const leftOverlay =
    theme.palette.mode === "dark"
      ? `linear-gradient(180deg, ${alpha("#07122B", 0.62)} 0%, ${alpha("#0A1C42", 0.72)} 100%), radial-gradient(circle at 18% 20%, rgba(255,255,255,0.08), rgba(255,255,255,0) 44%)`
      : "linear-gradient(180deg, rgba(37,99,235,0.66) 0%, rgba(29,78,216,0.74) 100%), radial-gradient(circle at 14% 14%, rgba(255,255,255,0.14), rgba(255,255,255,0) 42%)";

  const brandDescription = useMemo(
    () =>
      "Sistema central para registrar, priorizar e acompanhar chamados entre áreas, com rastreabilidade completa de status, responsáveis, prazos e histórico de atendimento.",
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: err } = await signIn(email.trim(), password);
      if (err) {
        setError(err);
        return;
      }
      if (remember30d) {
        const payload: RememberPayload = {
          email: email.trim(),
          password,
          expiresAt: Date.now() + THIRTY_DAYS_MS,
        };
        localStorage.setItem(REMEMBER_KEY, JSON.stringify(payload));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        overflow: "hidden",
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: { xs: "100%", md: "50%" },
          minHeight: { xs: 210, sm: 240, md: "100%" },
          px: { xs: 2.25, sm: 4, md: 6 },
          py: { xs: 2, md: 5 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          color: "#fff",
          background: leftGradient,
          isolation: "isolate",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            background: leftOverlay,
          },
        }}
      >
        <Box
          component="img"
          src={LOGIN_LEFT_BACKGROUND}
          alt=""
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
            zIndex: 0,
            transform: { xs: "scale(1.02)", md: "scale(1.04)" },
            filter: "saturate(0.85) contrast(1.04)",
          }}
        />
        <Box sx={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 620, textAlign: "center" }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              fontSize: { xs: "1.7rem", sm: "2rem", md: "2.5rem" },
              mb: 1.5,
              color: "#FFFFFF",
              textShadow: "0 2px 10px rgba(0,0,0,0.35)",
            }}
          >
            Portal de Chamados
          </Typography>
          <Typography
            sx={{
              color: "#f1f5f9",
              textShadow: "0 1px 8px rgba(0,0,0,0.3)",
              maxWidth: 560,
              mb: 2.5,
              mx: "auto",
            }}
          >
            {brandDescription}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
            {CHIP_LABELS.map((label) => (
              <Chip
                key={label}
                label={label}
                size="small"
                sx={{
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.34)",
                  backgroundColor: "rgba(255,255,255,0.16)",
                  color: "#f1f5f9",
                  fontWeight: 600,
                }}
              />
            ))}
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          width: { xs: "100%", md: "50%" },
          height: { xs: "calc(100vh - 210px)", sm: "calc(100vh - 240px)", md: "100%" },
          overflow: "hidden",
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 2, sm: 3, md: 5 },
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
          <ThemeToggle />
        </Box>

        {mode === "loginForm" ? (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ width: "100%", maxWidth: 460, mx: "auto", my: "auto" }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: "-0.01em", mb: 0.75 }}>
              Bem-vindo(a)
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Acesse sua conta para continuar
            </Typography>
            <TextField
              fullWidth
              label="E-mail"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Senha"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              sx={{ mb: 2 }}
            />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{ mb: 1.25 }}
            >
              {loading ? "Acessando..." : "Acessar sistema"}
            </Button>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1.25 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={remember30d}
                    onChange={(e) => setRemember30d(e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Manter conectado por 30d"
              />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button variant="text" disabled={loading} onClick={() => setMode("sobreScreen")}>
                O que é este sistema?
              </Button>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              pr: 0.5,
            }}
          >
            <Box sx={{ maxWidth: 760, mx: "auto" }}>
              <Button variant="text" sx={{ mb: 1.5 }} onClick={() => setMode("loginForm")}>
                Voltar ao login
              </Button>
              <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "-0.01em", mb: 1 }}>
                  O que é este sistema
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2.5 }}>
                  {brandDescription}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 700 }}>
                      Visão executiva
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      O Portal de Chamados centraliza o ciclo completo de atendimento, da abertura à conclusão, com visibilidade de fila e status em tempo real.
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 700 }}>
                      Valor no dia a dia
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Equipes trabalham com prioridades claras, histórico consolidado e menos ruído entre áreas, acelerando resposta e decisão.
                    </Typography>
                  </Box>
                </Box>
                {FAQ_ITEMS.map((item) => (
                  <Accordion key={item.title} disableGutters elevation={0} sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                    <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {item.title}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary">
                        {item.body}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Paper>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
