import axios from 'axios';

// Em produção, usar a mesma origem (backend serve o frontend)
// Em desenvolvimento, usar a URL completa
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const ticketAPI = {
  // Criar novo chamado
  createTicket: async (ticketData) => {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  },

  // Buscar todos os chamados
  getAllTickets: async () => {
    const response = await api.get('/tickets');
    return response.data;
  },

  // Buscar chamado por ID
  getTicketById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  // Buscar chamados por email
  getTicketsByEmail: async (email) => {
    const response = await api.get('/tickets/meus-chamados', {
      params: { email }
    });
    return response.data;
  },

  // Buscar chamados recebidos (Painel Administrativo)
  getReceivedTickets: async () => {
    const response = await api.get('/tickets/recebidos');
    return response.data;
  },

  // Atualizar status do chamado
  updateTicketStatus: async (id, status) => {
    const response = await api.patch(`/tickets/${id}/status`, { status });
    return response.data;
  },

  // Adicionar resposta ao chamado
  addResponse: async (id, responseData) => {
    const response = await api.post(`/tickets/${id}/resposta`, responseData);
    return response.data;
  },

  // Buscar chamados por área
  getTicketsByArea: async (area) => {
    const response = await api.get('/tickets/area', {
      params: { area }
    });
    return response.data;
  },
};

export const templateAPI = {
  getTemplate: async (departamento) => {
    const response = await api.get(`/templates/${encodeURIComponent(departamento)}`);
    return response.data;
  },
  saveTemplate: async (departamento, fields) => {
    const response = await api.put('/templates', { departamento, fields });
    return response.data;
  },
};

export default api;
