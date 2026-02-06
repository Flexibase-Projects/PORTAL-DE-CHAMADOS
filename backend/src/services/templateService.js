import supabase from '../config/supabase.js';

export const templateService = {
  async getByDepartamento(departamento) {
    if (!departamento) return { departamento: '', fields: [] };

    const { data, error } = await supabase
      .from('PDC_templates')
      .select('*')
      .eq('departamento', departamento)
      .single();

    if (error || !data) {
      return { departamento, fields: [] };
    }

    return {
      id: data.id,
      departamento: data.departamento,
      fields: Array.isArray(data.fields) ? data.fields : [],
    };
  },

  async save(departamento, fields) {
    if (!departamento || typeof departamento !== 'string') {
      throw new Error('Departamento é obrigatório');
    }

    const safeFields = Array.isArray(fields)
      ? fields.filter(f => f != null && typeof f === 'object').map((f, i) => ({
          id: f.id || `field_${Date.now()}_${i}`,
          type: f.type || 'text',
          key: f.key || `field_${i}`,
          label: f.label || '',
          placeholder: f.placeholder || '',
          required: !!f.required,
          validation: f.validation || null,
          options: Array.isArray(f.options) ? f.options : [],
          order: typeof f.order === 'number' ? f.order : i,
          rows: typeof f.rows === 'number' ? f.rows : undefined,
        }))
      : [];

    safeFields.sort((a, b) => a.order - b.order);

    const { data, error } = await supabase
      .from('PDC_templates')
      .upsert({
        departamento,
        fields: safeFields,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'departamento' })
      .select()
      .single();

    if (error) throw new Error(`Erro ao salvar template: ${error.message}`);
    return { departamento: data.departamento, fields: data.fields };
  },

  async getAllDepartamentos() {
    const { data, error } = await supabase
      .from('PDC_templates')
      .select('departamento')
      .eq('ativo', true);

    if (error) throw new Error(error.message);
    return (data || []).map(t => t.departamento);
  },
};
