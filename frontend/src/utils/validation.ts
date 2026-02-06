export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export interface FormErrors {
  [key: string]: string;
}

export interface TicketFormData {
  nome: string;
  email: string;
  setor: string;
  area: string;
  ramal: string;
  tipoSuporte: string;
  assunto: string;
  mensagem: string;
}

export function validateTicketForm(formData: TicketFormData): {
  isValid: boolean;
  errors: FormErrors;
} {
  const errors: FormErrors = {};

  if (!formData.nome?.trim()) errors.nome = "Nome é obrigatório";
  if (!formData.email?.trim()) {
    errors.email = "Email é obrigatório";
  } else if (!validateEmail(formData.email)) {
    errors.email = "Email inválido";
  }
  if (!formData.setor?.trim()) errors.setor = "Setor é obrigatório";
  if (!formData.area?.trim()) errors.area = "Departamento é obrigatório";
  if (!formData.assunto?.trim()) errors.assunto = "Assunto é obrigatório";
  if (!formData.mensagem?.trim()) errors.mensagem = "Mensagem é obrigatória";
  if (formData.ramal && isNaN(Number(formData.ramal)))
    errors.ramal = "Ramal deve ser um número";

  return { isValid: Object.keys(errors).length === 0, errors };
}
