import { templateService } from '../services/templateService.js';
import { permissionService } from '../services/permissionService.js';

function canEditTemplateForDepartment(permissions, userDepartamento, departamento) {
  const dept = (departamento || '').trim();
  if (!dept) return false;
  const p = permissions?.[dept];
  if (p === 'view_edit' || p === 'manage_templates') return true;
  if (userDepartamento && (userDepartamento || '').trim() === dept) return true;
  return false;
}

export const templateController = {
  async getTemplate(req, res) {
    try {
      const departamento = req.params.departamento;
      if (!departamento || !departamento.trim()) {
        return res.status(400).json({ success: false, error: 'Departamento é obrigatório' });
      }
      const template = await templateService.getByDepartamento(departamento);
      res.json({ success: true, template });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao buscar template', message: error.message });
    }
  },

  async saveTemplate(req, res) {
    try {
      const authUserId = req.auth?.user?.id;
      if (!authUserId) return res.status(401).json({ success: false, error: 'Não autenticado' });
      const { departamento, fields } = req.body || {};
      if (!departamento || typeof departamento !== 'string') {
        return res.status(400).json({ success: false, error: 'Departamento é obrigatório' });
      }
      const { permissions, userDepartamento, templateDepartamentos } = await permissionService.getByAuthUserId(authUserId);
      const fromTemplateList = (templateDepartamentos || [])
        .some((d) => (d || '').trim().toUpperCase() === departamento.trim().toUpperCase());
      if (!fromTemplateList && !canEditTemplateForDepartment(permissions, userDepartamento, departamento)) {
        return res.status(403).json({ success: false, error: 'Sem permissão de edição para este departamento' });
      }
      const template = await templateService.save(departamento, fields);
      res.json({ success: true, template });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Erro ao salvar template', message: error.message });
    }
  },
};
