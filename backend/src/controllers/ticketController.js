import { ticketService } from '../services/ticketService.js';

export const ticketController = {
  async createTicket(req, res) {
    try {
      const authUserId = req.headers['x-auth-user-id'] || null;
      const ticket = await ticketService.createTicket(req.body, authUserId);
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
      const authUserEmail = (req.query.auth_user_email || '').trim() || null;

      const result = await ticketService.getMeusChamadosByAuthUser(authUserId, authUserEmail);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getReceivedTickets(req, res) {
    try {
      const authUserId = req.headers['x-auth-user-id'] || req.query.auth_user_id || null;
      const authUserEmail = (req.query.auth_user_email || '').trim() || null;
      if (!authUserId) {
        return res.status(400).json({ success: false, error: 'auth_user_id obrigatório para listar chamados recebidos' });
      }
      const tickets = await ticketService.getReceivedTickets(authUserId, authUserEmail);
      res.json({ success: true, tickets });
    } catch (error) {
      console.error('[tickets] recebidos:', error?.message || error);
      res.status(200).json({
        success: true,
        tickets: [],
        degraded: true,
        message: error?.message || String(error),
      });
    }
  },

  async getReceivedConcludedTickets(req, res) {
    try {
      const authUserId = req.headers['x-auth-user-id'] || req.query.auth_user_id || null;
      const authUserEmail = (req.query.auth_user_email || '').trim() || null;
      if (!authUserId) {
        return res.status(400).json({ success: false, error: 'auth_user_id obrigatório para listar chamados concluídos' });
      }
      const tickets = await ticketService.getReceivedConcludedTickets(authUserId, authUserEmail);
      res.json({ success: true, tickets });
    } catch (error) {
      console.error('[tickets] recebidos/concluidos:', error?.message || error);
      res.status(200).json({
        success: true,
        tickets: [],
        degraded: true,
        message: error?.message || String(error),
      });
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

      const authUserId = req.headers['x-auth-user-id'] || req.query.auth_user_id || req.body.auth_user_id || null;
      const authUserEmail = (req.body.auth_user_email || req.query.auth_user_email || '').trim() || null;
      const ticket = await ticketService.updateTicketStatus(req.params.id, status, authUserId, authUserEmail);
      if (!ticket) return res.status(404).json({ success: false, error: 'Chamado não encontrado' });

      res.json({ success: true, message: 'Status atualizado', ticket });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao atualizar status', message: error.message });
    }
  },

  async addResponse(req, res) {
    try {
      const authUserId = req.headers['x-auth-user-id'] || req.query.auth_user_id || req.body.auth_user_id || null;
      const authUserEmail = (req.body.auth_user_email || req.query.auth_user_email || '').trim() || null;
      const ticket = await ticketService.addResponse(req.params.id, req.body, authUserId, authUserEmail);
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
