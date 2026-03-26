import express from 'express';
import { ticketController } from '../controllers/ticketController.js';
import { validateTicket, validateResponse, validateStatusChange } from '../middleware/validation.js';
import { requireAuth } from '../middleware/auth.js';
import { attachActor } from '../middleware/authorization.js';

const router = express.Router();
router.use(requireAuth, attachActor);

// Criar novo chamado
router.post('/', validateTicket, ticketController.createTicket);

// Listar todos os chamados
router.get('/', ticketController.getAllTickets);

// Meus chamados por usuário autenticado (prioridade quando logado)
router.get('/meus-chamados-by-auth', ticketController.getMeusChamadosByAuthUser);
// Buscar chamados recebidos (Painel Administrativo)
router.get('/recebidos/concluidos', ticketController.getReceivedConcludedTickets);
router.get('/recebidos', ticketController.getReceivedTickets);

// Buscar chamado por ID
router.get('/:id', ticketController.getTicketById);

// Atualizar status do chamado
router.patch('/:id/status', validateStatusChange, ticketController.updateTicketStatus);

// Adicionar resposta ao chamado
router.post('/:id/resposta', validateResponse, ticketController.addResponse);

export default router;
