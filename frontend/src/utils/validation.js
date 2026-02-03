// Utilitários de validação

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateForm = (formData) => {
  const errors = {};

  if (!formData.nome || formData.nome.trim().length === 0) {
    errors.nome = 'Nome é obrigatório';
  }

  if (!formData.email || formData.email.trim().length === 0) {
    errors.email = 'Email é obrigatório';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Email inválido';
  }

  if (!formData.setor || formData.setor.trim().length === 0) {
    errors.setor = 'Setor é obrigatório';
  }

  if (!formData.area || formData.area.trim().length === 0) {
    errors.area = 'Departamento é obrigatório';
  }

  if (!formData.assunto || formData.assunto.trim().length === 0) {
    errors.assunto = 'Assunto é obrigatório';
  }

  if (!formData.mensagem || formData.mensagem.trim().length === 0) {
    errors.mensagem = 'Mensagem é obrigatória';
  }

  if (formData.ramal && isNaN(formData.ramal)) {
    errors.ramal = 'Ramal deve ser um número';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
