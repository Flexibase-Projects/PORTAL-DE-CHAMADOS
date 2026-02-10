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
import CircularProgress from "@mui/material/CircularProgress";
import { CheckCircle2 } from "lucide-react";
import { ticketService } from "@/services/ticketService";
import { templateService } from "@/services/templateService";
import { validateTicketForm, type FormErrors } from "@/utils/validation";
import {
  SETORES_CHAMADO,
  DEPARTAMENTOS_POR_SETOR,
  TIPOS_SUPORTE_TI,
} from "@/constants/departamentos";
import { TemplateFieldRenderer } from "./components/TemplateFieldRenderer";
import type { TemplateField } from "@/types/template";

export function CreateTicketPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    setor: "",
    area: "",
    ramal: "",
    tipoSuporte: "",
    assunto: "",
    mensagem: "",
  });
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [dadosExtras, setDadosExtras] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (formData.area) {
      templateService
        .getTemplate(formData.area)
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
  }, [formData.area]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "setor") next.area = "";
      if (name === "area" && value !== "TI") next.tipoSuporte = "";
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
      if (isEmpty) dynErrors[fieldId] = `${field.label || fieldId} é obrigatório`;
    });
    if (Object.keys(dynErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...dynErrors }));
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const response = await ticketService.create({ ...formData, dadosExtras });
      if (response.success) {
        setTicketId(response.ticket.id || response.ticket.numero_protocolo);
        setSuccess(true);
      }
    } catch {
      setErrors({ submit: "Erro ao criar chamado. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  if (success && ticketId) {
    return (
      <Box sx={{ maxWidth: 672, mx: "auto" }}>
        <Card variant="outlined">
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <CheckCircle2 style={{ width: 64, height: 64, color: "var(--mui-palette-success-main)", margin: "0 auto 16px" }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Chamado Criado com Sucesso!
            </Typography>
            <Typography component="p" fontFamily="monospace" fontSize="1.125rem" gutterBottom>
              {ticketId}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Anote este protocolo para consultar seu chamado posteriormente.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
              <Button variant="contained" onClick={() => navigate("/meus-chamados")}>
                Ver Meus Chamados
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setSuccess(false);
                  setFormData({
                    nome: "",
                    email: "",
                    setor: "",
                    area: "",
                    ramal: "",
                    tipoSuporte: "",
                    assunto: "",
                    mensagem: "",
                  });
                  setDadosExtras({});
                  setTemplateFields([]);
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Enviar um Chamado
        </Typography>
        <Typography color="text.secondary">
          Preencha os dados abaixo para criar um novo chamado.
        </Typography>
      </Box>

      {errors.submit && (
        <Alert severity="error" onClose={() => setErrors((p) => ({ ...p, submit: undefined }))}>
          {errors.submit}
        </Alert>
      )}

      <Card variant="outlined">
        <CardContent sx={{ pt: 3 }}>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Nome *"
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                error={Boolean(errors.nome)}
                helperText={errors.nome}
                fullWidth
              />
              <TextField
                label="Email *"
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={Boolean(errors.email)}
                helperText={errors.email}
                fullWidth
              />

              <FormControl fullWidth error={Boolean(errors.setor)}>
                <InputLabel>Setor *</InputLabel>
                <Select
                  value={formData.setor}
                  label="Setor *"
                  onChange={(e) => handleChange("setor", e.target.value)}
                >
                  {SETORES_CHAMADO.map((setor) => (
                    <MenuItem key={setor} value={setor}>
                      {setor}
                    </MenuItem>
                  ))}
                </Select>
                {errors.setor && <Typography variant="caption" color="error">{errors.setor}</Typography>}
              </FormControl>

              <FormControl fullWidth disabled={!formData.setor} error={Boolean(errors.area)}>
                <InputLabel>Departamento *</InputLabel>
                <Select
                  value={formData.area}
                  label="Departamento *"
                  onChange={(e) => handleChange("area", e.target.value)}
                >
                  {(DEPARTAMENTOS_POR_SETOR[formData.setor] || []).map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
                {errors.area && <Typography variant="caption" color="error">{errors.area}</Typography>}
              </FormControl>

              <TextField
                label="Ramal"
                id="ramal"
                type="number"
                value={formData.ramal}
                onChange={(e) => handleChange("ramal", e.target.value)}
                error={Boolean(errors.ramal)}
                helperText={errors.ramal}
                fullWidth
              />

              {formData.area === "TI" && (
                <FormControl fullWidth>
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
              id="assunto"
              value={formData.assunto}
              onChange={(e) => handleChange("assunto", e.target.value)}
              error={Boolean(errors.assunto)}
              helperText={errors.assunto}
              fullWidth
            />

            <TextField
              label="Mensagem *"
              id="mensagem"
              multiline
              rows={5}
              value={formData.mensagem}
              onChange={(e) => handleChange("mensagem", e.target.value)}
              error={Boolean(errors.mensagem)}
              helperText={errors.mensagem}
              fullWidth
            />

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

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, pt: 2 }}>
              <Button type="button" variant="outlined" onClick={() => navigate("/")} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
                {loading ? "Enviando..." : "Enviar Chamado"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
