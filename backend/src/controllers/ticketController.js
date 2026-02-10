import { ticketService } from '../services/ticketService.js';

export const ticketController = {
  async createTicket(req, res) {
    try {
      const ticket = await ticketService.createTicket(req.body);
      res.status(201).json({ success: true, message: 'Chamado criado com sucesso', ticket });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao criar chamado', message: error.message });
    }
  },

  async getAllTickets(req, res) {
    try {
      const tickets = await ticketService.getAllTickets();
      res.json({ success: true, tickets });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar chamados', message: error.message });
    }
  },

  async getTicketById(req, res) {
    try {
      const ticket = await ticketService.getTicketById(req.params.id);
      if (!ticket) return res.status(404).json({ success: false, error: 'Chamado não encontrado' });
      res.json({ success: true, ticket });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar chamado', message: error.message });
    }
  },

  async getTicketsByNome(req, res) {
    try {
      const { nome } = req.query;
      const nomeTrim = (nome || '').trim();
      if (!nomeTrim) return res.status(400).json({ success: false, error: 'Nome do usuário é obrigatório' });

      const tickets = await ticketService.getTicketsByNome(nomeTrim);
      res.json({ success: true, enviados: tickets, recebidos: [] });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar chamados', message: error.message });
    }
  },

  async getMeusChamadosByAuthUser(req, res) {
    try {
      const authUserId = req.query.auth_user_id || req.headers['x-auth-user-id'];
      if (!authUserId) return res.status(400).json({ success: false, error: 'auth_user_id é obrigatório (query ou header x-auth-user-id)' });

      const result = await ticketService.getMeusChamadosByAuthUser(authUserId);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getReceivedTickets(req, res) {
    try {
      const tickets = await ticketService.getReceivedTickets();
      res.json({ success: true, tickets });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar chamados recebidos', message: error.message });
    }
  },

  async updateTicketStatus(req, res) {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ success: false, error: 'Status é obrigatório' });

      const validStatuses = ['Aberto', 'Em Andamento', 'Concluído'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: 'Status inválido' });
      }

      const ticket = await ticketService.updateTicketStatus(req.params.id, status);
      if (!ticket) return res.status(404).json({ success: false, error: 'Chamado não encontrado' });

      res.json({ success: true, message: 'Status atualizado', ticket });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao atualizar status', message: error.message });
    }
  },

  async addResponse(req, res) {
    try {
      const ticket = await ticketService.addResponse(req.params.id, req.body);
      if (!ticket) return res.status(404).json({ success: false, error: 'Chamado não encontrado' });
      res.json({ success: true, message: 'Resposta adicionada', ticket });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao adicionar resposta', message: error.message });
    }
  },

  async getTicketsByArea(req, res) {
    try {
      const { area } = req.query;
      if (!area) return res.status(400).json({ success: false, error: 'Área é obrigatória' });
      const tickets = await ticketService.getTicketsByArea(area);
      res.json({ success: true, tickets });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar chamados', message: error.message });
    }
  },
};
