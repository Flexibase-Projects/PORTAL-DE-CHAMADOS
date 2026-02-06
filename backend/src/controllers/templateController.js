import { templateService } from '../services/templateService.js';

export const templateController = {
  async getTemplate(req, res) {
    try {
      const template = await templateService.getByDepartamento(req.params.departamento);
      res.json({ success: true, template });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar template', message: error.message });
    }
  },

  async saveTemplate(req, res) {
    try {
      const { departamento, fields } = req.body || {};
      if (!departamento || typeof departamento !== 'string') {
        return res.status(400).json({ success: false, error: 'Departamento é obrigatório' });
      }
      const template = await templateService.save(departamento, fields);
      res.json({ success: true, template });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Erro ao salvar template', message: error.message });
    }
  },
};
