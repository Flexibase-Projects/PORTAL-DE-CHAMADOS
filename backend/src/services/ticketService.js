import { Ticket } from '../models/Ticket.js';

// Armazenamento em memória (será substituído por Supabase no futuro)
let tickets = [];
let nextId = 1;

export const ticketService = {
  // Criar novo chamado
  createTicket(ticketData) {
    const ticket = new Ticket(ticketData);
    tickets.push(ticket);
    return ticket.toJSON();
  },

  // Buscar todos os chamados
  getAllTickets() {
    return tickets.map(t => t.toJSON());
  },

  // Buscar chamado por ID
  getTicketById(id) {
    const ticket = tickets.find(t => t.id === id);
    return ticket ? ticket.toJSON() : null;
  },

  // Buscar chamados por email (para "Meus Chamados")
  getTicketsByEmail(email) {
    return tickets.filter(t => t.email === email).map(t => t.toJSON());
  },

  // Buscar chamados recebidos (para Painel Administrativo)
  // Por enquanto, retorna todos os chamados não concluídos
  getReceivedTickets() {
    return tickets.filter(t => t.status !== 'Concluído').map(t => t.toJSON());
  },

  // Atualizar status do chamado
  updateTicketStatus(id, status) {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      ticket.status = status;
      ticket.dataAtualizacao = new Date().toISOString();
      return ticket.toJSON();
    }
    return null;
  },

  // Adicionar resposta ao chamado
  addResponse(id, responseData) {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      const response = {
        id: `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        mensagem: responseData.mensagem,
        autor: responseData.autor || 'Administrador',
        dataCriacao: new Date().toISOString()
      };
      ticket.respostas.push(response);
      ticket.dataAtualizacao = new Date().toISOString();
      // Atualiza status para "Em Andamento" se ainda estiver pendente
      if (ticket.status === 'Pendente') {
        ticket.status = 'Em Andamento';
      }
      return ticket.toJSON();
    }
    return null;
  },

  // Deletar chamado (opcional)
  deleteTicket(id) {
    const index = tickets.findIndex(t => t.id === id);
    if (index !== -1) {
      tickets.splice(index, 1);
      return true;
    }
    return false;
  },

  // Buscar chamados por área
  getTicketsByArea(area) {
    return tickets.filter(t => t.area === area).map(t => t.toJSON());
  },

  // Buscar chamados por status
  getTicketsByStatus(status) {
    return tickets.filter(t => t.status === status).map(t => t.toJSON());
  }
};
