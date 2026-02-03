import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { ticketAPI, templateAPI } from '../services/api';
import { validateForm } from '../utils/validation';
import { SETORES, DEPARTAMENTOS_POR_SETOR } from '../constants/departamentos';
import TemplateFieldRenderer from '../components/Templates/TemplateFieldRenderer';

const CreateTicket = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    setor: '',
    area: '',
    ramal: '',
    assunto: '',
    mensagem: '',
  });
  const [templateFields, setTemplateFields] = useState([]);
  const [dadosExtras, setDadosExtras] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (formData.area) {
      templateAPI
        .getTemplate(formData.area)
        .then((res) => {
          if (res.success && res.template && Array.isArray(res.template.fields)) {
            setTemplateFields(res.template.fields.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'setor') {
        next.area = '';
      }
      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleDynamicChange = (key, value) => {
    setDadosExtras((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const validateDynamicFields = () => {
    const dynamicErrors = {};
    templateFields.forEach((field) => {
      if (field.type === 'info') return;
      if (!field.required) return;
      const val = dadosExtras[field.key];
      if (val === undefined || val === null || val === '') {
        dynamicErrors[field.key] = `${field.label || field.key} é obrigatório`;
      }
    });
    return dynamicErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    const dynamicErrors = validateDynamicFields();
    if (Object.keys(dynamicErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...dynamicErrors }));
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = { ...formData, dadosExtras };
      const response = await ticketAPI.createTicket(payload);
      if (response.success) {
        setTicketId(response.ticket.id);
        setSuccess(true);
      }
    } catch (error) {
      setErrors({ submit: 'Erro ao criar chamado. Tente novamente.' });
      console.error('Erro ao criar chamado:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success && ticketId) {
    return (
      <Container maxWidth="md">
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                Chamado Criado com Sucesso!
              </Typography>
              <Typography variant="h5" sx={{ my: 3 }}>
                ID do Chamado: <strong>{ticketId}</strong>
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Anote este ID para consultar seu chamado posteriormente.
              </Typography>
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/meus-chamados')}
                  size="large"
                >
                  Ver Meus Chamados
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSuccess(false);
                    setFormData({
                      nome: '',
                      email: '',
                      setor: '',
                      area: '',
                      ramal: '',
                      assunto: '',
                      mensagem: '',
                    });
                    setDadosExtras({});
                    setTemplateFields([]);
                  }}
                  size="large"
                >
                  Criar Novo Chamado
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Enviar um Chamado
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Preencha os dados abaixo para criar um novo chamado.
        </Typography>
      </Box>

      {errors.submit && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.submit}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  error={!!errors.nome}
                  helperText={errors.nome}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.setor}>
                  <InputLabel>Qual Setor</InputLabel>
                  <Select
                    name="setor"
                    value={formData.setor}
                    onChange={handleChange}
                    label="Qual Setor"
                  >
                    <MenuItem value="">
                      <em>Selecione um setor</em>
                    </MenuItem>
                    {SETORES.map((setor) => (
                      <MenuItem key={setor} value={setor}>
                        {setor}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.setor && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.setor}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.area} disabled={!formData.setor}>
                  <InputLabel>Departamento</InputLabel>
                  <Select
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    label="Departamento"
                  >
                    <MenuItem value="">
                      <em>Selecione um departamento</em>
                    </MenuItem>
                    {(DEPARTAMENTOS_POR_SETOR[formData.setor] || []).map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.area && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.area}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ramal"
                  name="ramal"
                  type="number"
                  value={formData.ramal}
                  onChange={handleChange}
                  error={!!errors.ramal}
                  helperText={errors.ramal}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Assunto"
                  name="assunto"
                  value={formData.assunto}
                  onChange={handleChange}
                  error={!!errors.assunto}
                  helperText={errors.assunto || 'Título que aparecerá para o responsável pelo chamado'}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mensagem"
                  name="mensagem"
                  multiline
                  rows={6}
                  value={formData.mensagem}
                  onChange={handleChange}
                  error={!!errors.mensagem}
                  helperText={errors.mensagem}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    minHeight: 500,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  {templateFields.map((field, index) => {
                    const key = field.key;
                    const value = dadosExtras[key];
                    const err = errors[key];
                    let xPct = field.x;
                    let yPct = field.y;
                    let widthPct = field.widthPct;
                    let heightPct = field.heightPct;
                    if (xPct == null || yPct == null || widthPct == null || heightPct == null) {
                      if (field.widthPx != null && field.heightPx != null && field.widthPx <= 100 && field.heightPx <= 100) {
                        xPct = field.x ?? 0;
                        yPct = field.y ?? 0;
                        widthPct = field.widthPx;
                        heightPct = field.heightPx;
                      } else if (field.widthPx != null && field.heightPx != null) {
                        xPct = ((field.x ?? 0) / 1920) * 100;
                        yPct = ((field.y ?? 0) / 1080) * 100;
                        widthPct = ((field.widthPx ?? 400) / 1920) * 100;
                        heightPct = ((field.heightPx ?? 120) / 1080) * 100;
                      } else {
                        const col = field.col ?? 0;
                        const row = field.row ?? field.order ?? index;
                        const colSpan = Math.min(12, Math.max(1, field.colSpan ?? field.width ?? (field.size === 'half' ? 6 : 12)));
                        const rowSpan = Math.max(1, field.rowSpan ?? 1);
                        xPct = (col / 12) * 100;
                        yPct = row * 8;
                        widthPct = (colSpan / 12) * 100;
                        heightPct = rowSpan * 8;
                      }
                    }
                    const x = Math.max(0, Math.min(100 - (widthPct ?? 50), xPct ?? 0));
                    const y = Math.max(0, Math.min(100 - (heightPct ?? 15), yPct ?? 0));
                    const w = Math.min(100, Math.max(5, widthPct ?? 50));
                    const h = Math.min(100, Math.max(3, heightPct ?? 15));
                    return (
                      <Box
                        key={field.id}
                        sx={{
                          position: 'absolute',
                          left: `${x}%`,
                          top: `${y}%`,
                          width: `${w}%`,
                          height: `${h}%`,
                          minWidth: 0,
                          boxSizing: 'border-box',
                          overflow: 'auto',
                          p: 1,
                        }}
                      >
                        <TemplateFieldRenderer
                          field={field}
                          value={value}
                          onChange={(v) => handleDynamicChange(key, v)}
                          error={err}
                          preview={false}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/')}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Enviando...' : 'Enviar Chamado'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreateTicket;
