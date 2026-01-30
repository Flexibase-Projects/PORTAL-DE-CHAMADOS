import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Description as DocIcon,
  VideoLibrary as VideoIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';

const areas = ['TI', 'RH', 'Financeiro', 'Operações'];

const KnowledgeBase = () => {
  const [selectedArea, setSelectedArea] = useState(areas[0]);
  const [tabValue, setTabValue] = useState(0);

  const handleAreaChange = (event, newValue) => {
    setSelectedArea(areas[newValue]);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Dados mockados de tutoriais e documentos
  const tutorials = {
    TI: [
      {
        id: 1,
        title: 'Como abrir um chamado de suporte técnico',
        description: 'Aprenda passo a passo como criar um chamado para problemas técnicos',
        type: 'video',
      },
      {
        id: 2,
        title: 'Solução de problemas comuns de rede',
        description: 'Guia rápido para resolver problemas de conectividade',
        type: 'article',
      },
    ],
    RH: [
      {
        id: 1,
        title: 'Como solicitar férias',
        description: 'Tutorial completo sobre o processo de solicitação de férias',
        type: 'article',
      },
      {
        id: 2,
        title: 'Acesso ao sistema de ponto',
        description: 'Como acessar e utilizar o sistema de registro de ponto',
        type: 'video',
      },
    ],
    Financeiro: [
      {
        id: 1,
        title: 'Como solicitar reembolso',
        description: 'Passo a passo para solicitar reembolso de despesas',
        type: 'article',
      },
    ],
    Operações: [
      {
        id: 1,
        title: 'Processo de abertura de chamado operacional',
        description: 'Guia para criar chamados relacionados a operações',
        type: 'article',
      },
    ],
  };

  const documents = {
    TI: [
      { id: 1, name: 'Política de TI', type: 'PDF' },
      { id: 2, name: 'Manual de Usuário - Sistema', type: 'PDF' },
    ],
    RH: [
      { id: 1, name: 'Manual do Colaborador', type: 'PDF' },
      { id: 2, name: 'Política de Férias', type: 'PDF' },
      { id: 3, name: 'Regulamento Interno', type: 'PDF' },
    ],
    Financeiro: [
      { id: 1, name: 'Política de Reembolso', type: 'PDF' },
      { id: 2, name: 'Procedimentos Financeiros', type: 'PDF' },
    ],
    Operações: [
      { id: 1, name: 'Manual Operacional', type: 'PDF' },
    ],
  };

  const getTutorialIcon = (type) => {
    switch (type) {
      case 'video':
        return <VideoIcon />;
      case 'article':
        return <ArticleIcon />;
      default:
        return <ArticleIcon />;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Base de Conhecimento & Tutoriais
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Acesse tutoriais, documentação e guias por área para aprender como abrir e gerenciar chamados.
        </Typography>
      </Box>

      {/* Seleção de Área */}
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={areas.indexOf(selectedArea)}
          onChange={handleAreaChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {areas.map((area) => (
            <Tab key={area} label={area} />
          ))}
        </Tabs>
      </Box>

      {/* Tabs de Conteúdo */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Tutoriais" />
          <Tab label="Documentos" />
        </Tabs>
      </Box>

      {/* Conteúdo de Tutoriais */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            Tutoriais - {selectedArea}
          </Typography>
          {tutorials[selectedArea] && tutorials[selectedArea].length > 0 ? (
            <Grid container spacing={3}>
              {tutorials[selectedArea].map((tutorial) => (
                <Grid item xs={12} md={6} key={tutorial.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {getTutorialIcon(tutorial.type)}
                        <Chip
                          label={tutorial.type === 'video' ? 'Vídeo' : 'Artigo'}
                          size="small"
                          sx={{ ml: 1 }}
                          color={tutorial.type === 'video' ? 'primary' : 'secondary'}
                        />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {tutorial.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tutorial.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" variant="contained">
                        Acessar Tutorial
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                  Nenhum tutorial disponível para esta área no momento.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Conteúdo de Documentos */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            Documentos - {selectedArea}
          </Typography>
          {documents[selectedArea] && documents[selectedArea].length > 0 ? (
            <Grid container spacing={2}>
              {documents[selectedArea].map((doc) => (
                <Grid item xs={12} key={doc.id}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <DocIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Typography variant="body1" sx={{ flexGrow: 1 }}>
                          {doc.name}
                        </Typography>
                        <Chip label={doc.type} size="small" sx={{ mr: 2 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Documento disponível para download. Clique no botão abaixo para acessar.
                      </Typography>
                      <Button variant="contained" startIcon={<DocIcon />}>
                        Baixar Documento
                      </Button>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                  Nenhum documento disponível para esta área no momento.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Seção de Informações Gerais */}
      <Box sx={{ mt: 6 }}>
        <Divider sx={{ my: 4 }} />
        <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Precisa de mais ajuda?
            </Typography>
            <Typography variant="body2" paragraph>
              Se você não encontrou o que procurava, não hesite em criar um novo chamado.
              Nossa equipe está pronta para ajudar!
            </Typography>
            <Button variant="contained" color="inherit" href="/criar-chamado">
              Criar Novo Chamado
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default KnowledgeBase;
