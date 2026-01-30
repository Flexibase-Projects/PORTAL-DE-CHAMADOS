import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { ticketAPI } from '../services/api';
import TicketCard from '../components/Tickets/TicketCard';

const MyTickets = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [enviados, setEnviados] = useState([]);
  const [recebidos, setRecebidos] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!email || !email.includes('@')) {
      setError('Por favor, insira um email válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ticketAPI.getTicketsByEmail(email);
      if (response.success) {
        setEnviados(response.enviados || []);
        setRecebidos(response.recebidos || []);
      }
    } catch (err) {
      setError('Erro ao buscar chamados. Tente novamente.');
      console.error('Erro ao buscar chamados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticket) => {
    // Se for um chamado recebido, redireciona para o painel administrativo
    if (recebidos.some(t => t.id === ticket.id)) {
      navigate('/painel-administrativo', { state: { ticketId: ticket.id } });
    } else {
      // Para chamados enviados, pode mostrar detalhes ou redirecionar
      navigate('/painel-administrativo', { state: { ticketId: ticket.id } });
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Meus Chamados
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Digite seu email para visualizar seus chamados enviados e recebidos.
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading || !email}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Buscar'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {enviados.length > 0 || recebidos.length > 0 ? (
        <Box>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab
              label={`Chamados Enviados (${enviados.length})`}
              disabled={enviados.length === 0}
            />
            <Tab
              label={`Chamados Recebidos (${recebidos.length})`}
              disabled={recebidos.length === 0}
            />
          </Tabs>

          {tabValue === 0 && (
            <Box>
              {enviados.length === 0 ? (
                <Alert severity="info">
                  Você não possui chamados enviados.
                </Alert>
              ) : (
                enviados.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onView={handleViewTicket}
                  />
                ))
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              {recebidos.length === 0 ? (
                <Alert severity="info">
                  Você não possui chamados recebidos.
                </Alert>
              ) : (
                recebidos.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onView={handleViewTicket}
                  />
                ))
              )}
            </Box>
          )}
        </Box>
      ) : (
        !loading && email && (
          <Alert severity="info">
            Nenhum chamado encontrado para este email.
          </Alert>
        )
      )}
    </Container>
  );
};

export default MyTickets;
