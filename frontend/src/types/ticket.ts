export type TicketStatus = "Aberto" | "Em Andamento" | "Concluído";
export type TicketPriority = "Baixa" | "Normal" | "Alta" | "Urgente";

export interface TicketResponse {
  id: string;
  ticket_id: string;
  autor_id: string;
  autor_nome?: string;
  mensagem: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  numero_protocolo: string;
  solicitante_id: string;
  solicitante_nome?: string;
  solicitante_email?: string;
  area_destino: string;
  setor: string;
  assunto: string;
  mensagem: string;
  tipo_suporte?: string;
  dados_extras: Record<string, unknown>;
  status: TicketStatus;
  prioridade: TicketPriority;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  respostas?: TicketResponse[];
}
