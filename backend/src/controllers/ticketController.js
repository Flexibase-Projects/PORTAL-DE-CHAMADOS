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

  async getTicketsByEmail(req, res) {
    try {
      const { email } = req.query;
      if (!email) return res.status(400).json({ success: false, error: 'Email é obrigatório' });

      const tickets = await ticketService.getTicketsByEmail(email);
      const enviados = tickets.filter(t => t.solicitante_email === email);
      const recebidos = [];

      res.json({ success: true, enviados, recebidos });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar chamados', message: error.message });
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
