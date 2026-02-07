import express from 'express';
import { ticketController } from '../controllers/ticketController.js';
import { validateTicket, validateResponse } from '../middleware/validation.js';

const router = express.Router();

// Criar novo chamado
router.post('/', validateTicket, ticketController.createTicket);

// Listar todos os chamados
router.get('/', ticketController.getAllTickets);

// Buscar chamados por nome do usuário (para "Meus Chamados")
router.get('/meus-chamados', ticketController.getTicketsByNome);

// Buscar chamados recebidos (Painel Administrativo)
router.get('/recebidos', ticketController.getReceivedTickets);

// Buscar chamados por área
router.get('/area', ticketController.getTicketsByArea);

// Buscar chamado por ID
router.get('/:id', ticketController.getTicketById);

// Atualizar status do chamado
router.patch('/:id/status', ticketController.updateTicketStatus);

// Adicionar resposta ao chamado
router.post('/:id/resposta', validateResponse, ticketController.addResponse);

export default router;
