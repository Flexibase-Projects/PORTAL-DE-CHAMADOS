// Middleware de validação

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTicket = (req, res, next) => {
  const { nome, email, setor, area, tipoSuporte, assunto, mensagem } = req.body;

  const errors = [];

  if (!nome || nome.trim().length === 0) {
    errors.push('Nome é obrigatório');
  }

  if (!email || email.trim().length === 0) {
    errors.push('Email é obrigatório');
  } else if (!validateEmail(email)) {
    errors.push('Email inválido');
  }

  if (!setor || setor.trim().length === 0) {
    errors.push('Setor é obrigatório');
  }

  if (!area || area.trim().length === 0) {
    errors.push('Área é obrigatória');
  }

  if (!tipoSuporte || tipoSuporte.trim().length === 0) {
    errors.push('Tipo de Suporte é obrigatório');
  }

  if (!assunto || assunto.trim().length === 0) {
    errors.push('Assunto é obrigatório');
  }

  if (!mensagem || mensagem.trim().length === 0) {
    errors.push('Mensagem é obrigatória');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

export const validateResponse = (req, res, next) => {
  const { mensagem } = req.body;

  if (!mensagem || mensagem.trim().length === 0) {
    return res.status(400).json({ error: 'Mensagem da resposta é obrigatória' });
  }

  next();
};
