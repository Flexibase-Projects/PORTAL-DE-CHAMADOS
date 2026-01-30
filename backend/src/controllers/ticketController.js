import { ticketService } from '../services/ticketService.js';

export const ticketController = {
  // Criar novo chamado
  createTicket(req, res) {
    try {
      const ticket = ticketService.createTicket(req.body);
      res.status(201).json({
        success: true,
        message: 'Chamado criado com sucesso',
        ticket
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao criar chamado',
        message: error.message
      });
    }
  },

  // Listar todos os chamados
  getAllTickets(req, res) {
    try {
      const tickets = ticketService.getAllTickets();
      res.json({
        success: true,
        tickets
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar chamados',
        message: error.message
      });
    }
  },

  // Buscar chamado por ID
  getTicketById(req, res) {
    try {
      const { id } = req.params;
      const ticket = ticketService.getTicketById(id);
      
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Chamado não encontrado'
        });
      }

      res.json({
        success: true,
        ticket
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar chamado',
        message: error.message
      });
    }
  },

  // Buscar chamados por email
  getTicketsByEmail(req, res) {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email é obrigatório'
        });
      }

      const tickets = ticketService.getTicketsByEmail(email);
      
      // Separar ENVIADOS e RECEBIDOS
      const enviados = tickets.filter(t => t.email === email);
      const recebidos = tickets.filter(t => t.email !== email && t.status !== 'Concluído');

      res.json({
        success: true,
        enviados,
        recebidos
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar chamados',
        message: error.message
      });
    }
  },

  // Buscar chamados recebidos (Painel Administrativo)
  getReceivedTickets(req, res) {
    try {
      const tickets = ticketService.getReceivedTickets();
      res.json({
        success: true,
        tickets
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar chamados recebidos',
        message: error.message
      });
    }
  },

  // Atualizar status do chamado
  updateTicketStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status é obrigatório'
        });
      }

      const validStatuses = ['Pendente', 'Em Andamento', 'Concluído'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Status inválido'
        });
      }

      const ticket = ticketService.updateTicketStatus(id, status);
      
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Chamado não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Status atualizado com sucesso',
        ticket
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao atualizar status',
        message: error.message
      });
    }
  },

  // Adicionar resposta ao chamado
  addResponse(req, res) {
    try {
      const { id } = req.params;
      const ticket = ticketService.addResponse(id, req.body);
      
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Chamado não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Resposta adicionada com sucesso',
        ticket
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao adicionar resposta',
        message: error.message
      });
    }
  },

  // Buscar chamados por área
  getTicketsByArea(req, res) {
    try {
      const { area } = req.query;
      
      if (!area) {
        return res.status(400).json({
          success: false,
          error: 'Área é obrigatória'
        });
      }

      const tickets = ticketService.getTicketsByArea(area);
      res.json({
        success: true,
        tickets
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar chamados por área',
        message: error.message
      });
    }
  }
};
