import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Grid,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Reply as ReplyIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { ticketAPI } from '../services/api';
import TicketCard from '../components/Tickets/TicketCard';
import TemplateEditor from '../components/Templates/TemplateEditor';
import { getAllDepartamentos } from '../constants/departamentos';

const AdminPanel = () => {
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);
  const [templateDepartamento, setTemplateDepartamento] = useState('');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const departamentos = getAllDepartamentos();

  useEffect(() => {
    loadTickets();
    
    // Se houver um ticketId na navegação, abrir detalhes
    if (location.state?.ticketId) {
      loadTicketDetails(location.state.ticketId);
    }
  }, [location.state]);

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await ticketAPI.getReceivedTickets();
      if (response.success) {
        setTickets(response.tickets || []);
        
        // Se houver ticketId na navegação, encontrar e selecionar
        if (location.state?.ticketId) {
          const ticket = response.tickets.find(t => t.id === location.state.ticketId);
          if (ticket) {
            setSelectedTicket(ticket);
          }
        }
      }
    } catch (err) {
      setError('Erro ao carregar chamados. Tente novamente.');
      console.error('Erro ao carregar chamados:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadTicketDetails = async (ticketId) => {
    try {
      const response = await ticketAPI.getTicketById(ticketId);
      if (response.success) {
        setSelectedTicket(response.ticket);
      }
    } catch (err) {
      setError('Erro ao carregar detalhes do chamado.');
      console.error('Erro ao carregar detalhes:', err);
    }
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setError('');
    setSuccess('');
  };

  const handleOpenResponseDialog = () => {
    setResponseDialogOpen(true);
    setResponseText('');
  };

  const handleCloseResponseDialog = () => {
    setResponseDialogOpen(false);
    setResponseText('');
  };

  const handleSendResponse = async () => {
    if (!responseText.trim()) {
      setError('Por favor, digite uma resposta.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ticketAPI.addResponse(selectedTicket.id, {
        mensagem: responseText,
        autor: 'Administrador',
      });

      if (response.success) {
        setSuccess('Resposta enviada com sucesso!');
        setResponseDialogOpen(false);
        setResponseText('');
        // Recarregar tickets e atualizar ticket selecionado
        await loadTickets();
        await loadTicketDetails(selectedTicket.id);
      }
    } catch (err) {
      setError('Erro ao enviar resposta. Tente novamente.');
      console.error('Erro ao enviar resposta:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConcludeTicket = async () => {
    if (!window.confirm('Tem certeza que deseja concluir este chamado?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ticketAPI.updateTicketStatus(selectedTicket.id, 'Concluído');

      if (response.success) {
        setSuccess('Chamado concluído com sucesso!');
        // Recarregar tickets
        await loadTickets();
        setSelectedTicket(null);
      }
    } catch (err) {
      setError('Erro ao concluir chamado. Tente novamente.');
      console.error('Erro ao concluir chamado:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Painel Administrativo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie chamados e templates por departamento.
        </Typography>
      </Box>

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Chamados recebidos" />
        <Tab label="Templates por departamento" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {tabValue === 1 && (
        <Box sx={{ mb: 4 }}>
          <FormControl sx={{ minWidth: 280, mb: 2 }}>
            <InputLabel>Departamento</InputLabel>
            <Select
              value={templateDepartamento}
              label="Departamento"
              onChange={(e) => setTemplateDepartamento(e.target.value)}
            >
              <MenuItem value="">
                <em>Selecione um departamento</em>
              </MenuItem>
              {departamentos.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TemplateEditor departamento={templateDepartamento} />
        </Box>
      )}

      {tabValue === 0 && (
      <Grid container spacing={3}>
        {/* Lista de Chamados */}
        <Grid item xs={12} md={selectedTicket ? 4 : 12}>
          <Paper sx={{ p: 2, maxHeight: '80vh', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Chamados Recebidos ({tickets.length})
            </Typography>
            {loadingTickets ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : tickets.length === 0 ? (
              <Alert severity="info">Nenhum chamado recebido no momento.</Alert>
            ) : (
              tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onView={handleViewTicket}
                  showActions={true}
                />
              ))
            )}
          </Paper>
        </Grid>

        {/* Detalhes do Chamado Selecionado */}
        {selectedTicket && (
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {selectedTicket.assunto}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {selectedTicket.id}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedTicket.status}
                    color={
                      selectedTicket.status === 'Concluído'
                        ? 'success'
                        : selectedTicket.status === 'Em Andamento'
                        ? 'warning'
                        : 'error'
                    }
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Nome
                    </Typography>
                    <Typography variant="body1">{selectedTicket.nome}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{selectedTicket.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Setor
                    </Typography>
                    <Typography variant="body1">{selectedTicket.setor}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Área
                    </Typography>
                    <Typography variant="body1">{selectedTicket.area}</Typography>
                  </Grid>
                  {selectedTicket.tipoSuporte && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tipo de Suporte
                      </Typography>
                      <Typography variant="body1">{selectedTicket.tipoSuporte}</Typography>
                    </Grid>
                  )}
                  {selectedTicket.ramal && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Ramal
                      </Typography>
                      <Typography variant="body1">{selectedTicket.ramal}</Typography>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Data de Criação
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedTicket.dataCriacao)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Mensagem
                </Typography>
                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedTicket.mensagem}
                </Typography>

                {selectedTicket.dadosExtras && Object.keys(selectedTicket.dadosExtras).length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Dados adicionais
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {Object.entries(selectedTicket.dadosExtras).map(([key, value]) => (
                        <Box key={key} sx={{ mb: 1 }}>
                          {Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && !Array.isArray(value[0]) ? (
                            <Paper variant="outlined" sx={{ p: 1, overflow: 'auto' }}>
                              <Typography variant="caption" color="text.secondary">
                                {key}
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    {Object.keys(value[0]).map((col) => (
                                      <TableCell key={col}>{col}</TableCell>
                                    ))}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {value.map((row, i) => (
                                    <TableRow key={i}>
                                      {Object.values(row).map((cell, j) => (
                                        <TableCell key={j}>{String(cell)}</TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Paper>
                          ) : (
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {key}
                              </Typography>
                              <Typography variant="body1">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </Typography>
                            </>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </>
                )}

                {selectedTicket.respostas && selectedTicket.respostas.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Respostas ({selectedTicket.respostas.length})
                    </Typography>
                    {selectedTicket.respostas.map((resposta, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {resposta.autor}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(resposta.dataCriacao)}
                          </Typography>
                        </Box>
                        <Typography variant="body2">{resposta.mensagem}</Typography>
                      </Paper>
                    ))}
                  </>
                )}

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<ReplyIcon />}
                    onClick={handleOpenResponseDialog}
                    disabled={loading || selectedTicket.status === 'Concluído'}
                  >
                    Responder
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={handleConcludeTicket}
                    disabled={loading || selectedTicket.status === 'Concluído'}
                  >
                    Concluir Chamado
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={() => setSelectedTicket(null)}
                  >
                    Voltar
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
      )}

      {/* Dialog de Resposta */}
      <Dialog open={responseDialogOpen} onClose={handleCloseResponseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Responder Chamado</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Resposta"
            fullWidth
            multiline
            rows={6}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResponseDialog}>Cancelar</Button>
          <Button
            onClick={handleSendResponse}
            variant="contained"
            disabled={loading || !responseText.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Enviar Resposta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPanel;
