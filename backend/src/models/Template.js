// Estrutura do template por departamento
// Cada campo em fields: id, type, key, label, placeholder, required, validation, options, size, order
export function createTemplate(data) {
  return {
    departamento: data.departamento || '',
    fields: Array.isArray(data.fields) ? data.fields : []
  };
}
