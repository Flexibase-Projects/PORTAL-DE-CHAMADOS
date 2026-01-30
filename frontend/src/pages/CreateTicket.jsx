import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { ticketAPI } from '../services/api';
import { validateForm } from '../utils/validation';

const areas = ['TI', 'RH', 'Financeiro', 'Operações'];
const setores = ['Vendas', 'Suporte', 'Administração', 'Produção'];
const tiposSuporte = ['Técnico', 'Consulta', 'Solicitação', 'Problema'];

const CreateTicket = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    setor: '',
    area: location.state?.area || '',
    tipoSuporte: '',
    ramal: '',
    assunto: '',
    mensagem: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (location.state?.area) {
      setFormData((prev) => ({ ...prev, area: location.state.area }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await ticketAPI.createTicket(formData);
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
                      tipoSuporte: '',
                      ramal: '',
                      assunto: '',
                      mensagem: '',
                    });
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
                    {setores.map((setor) => (
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
                <FormControl fullWidth error={!!errors.area}>
                  <InputLabel>Área</InputLabel>
                  <Select
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    label="Área"
                  >
                    <MenuItem value="">
                      <em>Selecione uma área</em>
                    </MenuItem>
                    {areas.map((area) => (
                      <MenuItem key={area} value={area}>
                        {area}
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
                <FormControl fullWidth error={!!errors.tipoSuporte}>
                  <InputLabel>Tipo de Suporte</InputLabel>
                  <Select
                    name="tipoSuporte"
                    value={formData.tipoSuporte}
                    onChange={handleChange}
                    label="Tipo de Suporte"
                  >
                    <MenuItem value="">
                      <em>Selecione um tipo</em>
                    </MenuItem>
                    {tiposSuporte.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.tipoSuporte && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.tipoSuporte}
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
                  helperText={errors.assunto}
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
