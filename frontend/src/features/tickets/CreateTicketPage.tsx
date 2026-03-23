import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { CheckCircle2 } from "lucide-react";
import { ticketService } from "@/services/ticketService";
import { templateService } from "@/services/templateService";
import { useAuth } from "@/contexts/AuthContext";
import { validateTicketForm, type FormErrors } from "@/utils/validation";
import { TIPOS_SUPORTE_TI } from "@/constants/departamentos";
import { TemplateFieldRenderer } from "./components/TemplateFieldRenderer";
import type { TemplateField } from "@/types/template";
import {
  readCreateTicketDepartmentsDraft,
  clearCreateTicketDepartmentsDraft,
} from "./createTicketDepartmentsStorage";

export function CreateTicketPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [formReady, setFormReady] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    setor_origem: "",
    area_origem: "",
    setor_destino: "",
    area_destino: "",
    ramal: "",
    tipoSuporte: "",
    assunto: "",
    mensagem: "",
  });
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [dadosExtras, setDadosExtras] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const draft = readCreateTicketDepartmentsDraft();
    if (!draft) {
      navigate("/criar-chamado", { replace: true });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      area_origem: draft.area_origem,
      setor_origem: draft.setor_origem,
      area_destino: draft.area_destino,
      setor_destino: draft.setor_destino,
    }));
    setFormReady(true);
  }, [navigate]);

  useEffect(() => {
    if (formData.area_destino) {
      templateService
        .getTemplate(formData.area_destino)
        .then((res) => {
          if (res.success && res.template && Array.isArray(res.template.fields)) {
            setTemplateFields(
              res.template.fields.sort(
                (a: TemplateField, b: TemplateField) => (a.order ?? 0) - (b.order ?? 0)
              )
            );
          } else {
            setTemplateFields([]);
          }
        })
        .catch(() => setTemplateFields([]));
      setDadosExtras({});
    } else {
      setTemplateFields([]);
      setDadosExtras({});
    }
  }, [formData.area_destino]);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => {
      const updates: Partial<typeof prev> = {};
      if (prev.email === "" && user.email) updates.email = user.email;
      if (prev.nome === "" && user.nome) updates.nome = user.nome;
      return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
    });
  }, [user?.id, user?.email, user?.nome]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "area_destino" && value !== "TI") next.tipoSuporte = "";
      return next;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDynamicChange = (key: string, value: unknown) => {
    setDadosExtras((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateTicketForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      if (
        validation.errors.area_origem ||
        validation.errors.setor_origem ||
        validation.errors.area_destino ||
        validation.errors.setor_destino
      ) {
        navigate("/criar-chamado", { replace: true });
      }
      return;
    }
    const dynErrors: FormErrors = {};
    templateFields.forEach((field) => {
      if (field.type === "info" || !field.required) return;
      const fieldId = field.id ?? field.key;
      const val = dadosExtras[fieldId];
      const isEmpty =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0);
      if (isEmpty) dynErrors[fieldId] = `${field.label || fieldId} e obrigatorio`;
    });
    if (Object.keys(dynErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...dynErrors }));
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const payload = {
        ...formData,
        area_origem: formData.area_origem,
        area_destino: formData.area_destino,
        setor: formData.setor_destino,
        dadosExtras,
      };
      const response = await ticketService.create(payload);
      if (response.success) {
        clearCreateTicketDepartmentsDraft();
        setTicketId(response.ticket.id || response.ticket.numero_protocolo);
        setSuccess(true);
      }
    } catch {
      setErrors({ submit: "Erro ao criar chamado. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  if (!formReady) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress aria-label="Carregando formulário" />
      </Box>
    );
  }

  if (success && ticketId) {
    return (
      <Box sx={{ maxWidth: 560, mx: "auto", width: "100%" }}>
        <Card>
          <CardContent sx={{ py: { xs: 4, sm: 5 }, textAlign: "center" }}>
            <CheckCircle2 style={{ width: 56, height: 56, color: "var(--mui-palette-success-main)", margin: "0 auto 12px" }} />
            <Typography variant="h5" gutterBottom>
              Chamado Criado!
            </Typography>
            <Typography component="p" fontFamily="monospace" fontSize="1rem" gutterBottom>
              {ticketId}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Anote este protocolo para consultar seu chamado.
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
              <Button variant="contained" size={isMobile ? "small" : "medium"} onClick={() => navigate("/meus-chamados")}>
                Ver Meus Chamados
              </Button>
              <Button
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                onClick={() => {
                  setSuccess(false);
                  setFormData({
                    nome: "",
                    email: "",
                    setor_origem: "",
                    area_origem: "",
                    setor_destino: "",
                    area_destino: "",
                    ramal: "",
                    tipoSuporte: "",
                    assunto: "",
                    mensagem: "",
                  });
                  setDadosExtras({});
                  setTemplateFields([]);
                  setFormReady(false);
                  navigate("/criar-chamado", { replace: true });
                }}
              >
                Novo Chamado
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: { xs: 2, md: 2.5 },
        maxWidth: { xs: "100%", md: 720 },
        mx: "auto",
        width: "100%",
      }}
    >
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 0.25 }}>
          Dados do chamado
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Revise origem e destino, depois preencha assunto e mensagem.
        </Typography>
      </Box>

      {errors.submit && (
        <Alert
          severity="error"
          onClose={() =>
            setErrors((p) => {
              const next = { ...p };
              delete next.submit;
              return next;
            })
          }
        >
          {errors.submit}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Origem e destino
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" sx={{ mb: 1 }}>
                <Chip size="small" variant="outlined" label={`Origem: ${formData.area_origem}`} />
                <Chip size="small" variant="outlined" label={`Destino: ${formData.area_destino}`} />
              </Stack>
              <Button size="small" variant="text" onClick={() => navigate("/criar-chamado")}>
                Alterar departamentos
              </Button>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Nome *"
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                error={Boolean(errors.nome)}
                helperText={errors.nome}
                fullWidth
              />
              <TextField
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={Boolean(errors.email)}
                helperText={errors.email}
                fullWidth
              />
              <TextField
                label="Ramal"
                type="number"
                value={formData.ramal}
                onChange={(e) => handleChange("ramal", e.target.value)}
                error={Boolean(errors.ramal)}
                helperText={errors.ramal}
                fullWidth
                sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}
              />
              {formData.area_destino === "TI" && (
                <FormControl fullWidth sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                  <InputLabel>Tipo de Suporte</InputLabel>
                  <Select
                    value={formData.tipoSuporte}
                    label="Tipo de Suporte"
                    onChange={(e) => handleChange("tipoSuporte", e.target.value)}
                  >
                    {TIPOS_SUPORTE_TI.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            <TextField
              label="Assunto *"
              value={formData.assunto}
              onChange={(e) => handleChange("assunto", e.target.value)}
              error={Boolean(errors.assunto)}
              helperText={errors.assunto}
              fullWidth
            />
            <TextField
              label="Mensagem *"
              multiline
              rows={isMobile ? 4 : 5}
              value={formData.mensagem}
              onChange={(e) => handleChange("mensagem", e.target.value)}
              error={Boolean(errors.mensagem)}
              helperText={errors.mensagem}
              fullWidth
            />

            {templateFields.length > 0 && (
              <Box
                sx={{
                  bgcolor: "rgba(37, 99, 235, 0.06)",
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "rgba(37, 99, 235, 0.2)",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {templateFields.map((field) => {
                  const fieldId = field.id ?? field.key;
                  return (
                    <TemplateFieldRenderer
                      key={fieldId}
                      field={field}
                      value={dadosExtras[fieldId]}
                      onChange={(v) => handleDynamicChange(fieldId, v)}
                      error={errors[fieldId]}
                    />
                  );
                })}
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, pt: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" onClick={() => navigate("/")} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading && <CircularProgress size={18} sx={{ mr: 1 }} />}
                {loading ? "Enviando..." : "Enviar Chamado"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
