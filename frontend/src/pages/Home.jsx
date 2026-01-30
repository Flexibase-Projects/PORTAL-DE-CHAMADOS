import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Send as SendIcon,
  Inbox as InboxIcon,
  AdminPanelSettings as AdminIcon,
  MenuBook as KnowledgeIcon,
} from '@mui/icons-material';

const areas = ['TI', 'RH', 'Financeiro', 'Operações'];

const Home = () => {
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState('');

  const handleAreaChange = (event) => {
    setSelectedArea(event.target.value);
  };

  const handleNavigate = (path) => {
    if (path === '/criar-chamado' && !selectedArea) {
      alert('Por favor, selecione uma área antes de criar um chamado.');
      return;
    }
    navigate(path, { state: { area: selectedArea } });
  };

  const menuCards = [
    {
      title: 'Enviar um Chamado',
      description: 'Crie um novo chamado para solicitar suporte',
      icon: <SendIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      path: '/criar-chamado',
      color: 'primary',
    },
    {
      title: 'Ver Meus Chamados',
      description: 'Visualize e acompanhe seus chamados enviados e recebidos',
      icon: <InboxIcon sx={{ fontSize: 48, color: 'secondary.main' }} />,
      path: '/meus-chamados',
      color: 'secondary',
    },
    {
      title: 'Painel Administrativo',
      description: 'Gerencie e responda aos chamados recebidos',
      icon: <AdminIcon sx={{ fontSize: 48, color: 'success.main' }} />,
      path: '/painel-administrativo',
      color: 'success',
    },
    {
      title: 'Base de Conhecimento',
      description: 'Acesse tutoriais e documentação por área',
      icon: <KnowledgeIcon sx={{ fontSize: 48, color: 'info.main' }} />,
      path: '/base-conhecimento',
      color: 'info',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Portal de Chamados
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Bem-vindo ao sistema de gerenciamento de chamados. Selecione a área do chamado e escolha uma opção abaixo.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <FormControl fullWidth sx={{ maxWidth: 400 }}>
          <InputLabel id="area-select-label">Seleção da Área do Chamado</InputLabel>
          <Select
            labelId="area-select-label"
            id="area-select"
            value={selectedArea}
            label="Seleção da Área do Chamado"
            onChange={handleAreaChange}
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
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {menuCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 3 }}>
                <Box sx={{ mb: 2 }}>{card.icon}</Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="contained"
                  color={card.color}
                  onClick={() => handleNavigate(card.path)}
                  fullWidth
                >
                  Acessar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home;
