import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

const getStatusColor = (status) => {
  switch (status) {
    case 'Concluído':
      return 'success';
    case 'Em Andamento':
      return 'warning';
    case 'Pendente':
    default:
      return 'error';
  }
};

const TicketCard = ({ ticket, onView, showActions = true }) => {
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
    <Card
      sx={{
        mb: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="h3" gutterBottom>
              {ticket.assunto}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {ticket.id}
            </Typography>
          </Box>
          <Chip
            label={ticket.status}
            color={getStatusColor(ticket.status)}
            size="small"
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <EmailIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
            {ticket.email}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <BusinessIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
            {ticket.area} - {ticket.setor}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <TimeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
            {formatDate(ticket.dataCriacao)}
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ mb: 2 }}>
          {ticket.mensagem.length > 150
            ? `${ticket.mensagem.substring(0, 150)}...`
            : ticket.mensagem}
        </Typography>

        {ticket.respostas && ticket.respostas.length > 0 && (
          <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
            {ticket.respostas.length} resposta(s)
          </Typography>
        )}

        {showActions && onView && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => onView(ticket)}
            fullWidth
          >
            Ver Detalhes
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketCard;
