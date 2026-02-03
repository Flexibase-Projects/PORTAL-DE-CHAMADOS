// Modelo de dados para Chamado (Ticket)
export class Ticket {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.nome = data.nome || '';
    this.email = data.email || '';
    this.setor = data.setor || '';
    this.area = data.area || '';
    this.tipoSuporte = data.tipoSuporte || '';
    this.ramal = data.ramal || null;
    this.assunto = data.assunto || '';
    this.mensagem = data.mensagem || '';
    this.anexo = data.anexo || null;
    this.dadosExtras = data.dadosExtras || {};
    this.status = data.status || 'Pendente';
    this.dataCriacao = data.dataCriacao || new Date().toISOString();
    this.dataAtualizacao = data.dataAtualizacao || new Date().toISOString();
    this.respostas = data.respostas || [];
    this.usuarioId = data.usuarioId || null; // Para rastrear quem enviou
    this.administradorId = data.administradorId || null; // Para rastrear quem está atendendo
  }

  generateId() {
    return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      setor: this.setor,
      area: this.area,
      tipoSuporte: this.tipoSuporte,
      ramal: this.ramal,
      assunto: this.assunto,
      mensagem: this.mensagem,
      anexo: this.anexo,
      dadosExtras: this.dadosExtras,
      status: this.status,
      dataCriacao: this.dataCriacao,
      dataAtualizacao: this.dataAtualizacao,
      respostas: this.respostas,
      usuarioId: this.usuarioId,
      administradorId: this.administradorId
    };
  }
}
