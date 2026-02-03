import { templateService } from '../services/templateService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG_LOG = path.join(__dirname, '..', '..', 'debug.log');
function agentLog(payload) {
  try {
    fs.mkdirSync(path.dirname(DEBUG_LOG), { recursive: true });
    fs.appendFileSync(DEBUG_LOG, JSON.stringify({ ...payload, timestamp: Date.now(), sessionId: 'debug-session' }) + '\n');
  } catch (_) {}
}

export const templateController = {
  getTemplate(req, res) {
    try {
      const { departamento } = req.params;
      const template = templateService.getByDepartamento(departamento);
      res.json({ success: true, template });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar template',
        message: error.message
      });
    }
  },

  saveTemplate(req, res) {
    try {
      const body = req.body;
      // #region agent log
      agentLog({ location: 'templateController.js:saveTemplate', message: 'entry', data: { hasBody: !!body, departamento: body?.departamento, depType: typeof body?.departamento, fieldsLen: Array.isArray(body?.fields) ? body.fields.length : 'not-array' }, hypothesisId: 'C' });
      // #endregion
      if (!body || typeof body !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Erro ao salvar template',
          message: 'Corpo da requisição inválido ou vazio.'
        });
      }
      const departamento = body.departamento;
      const fields = body.fields;
      if (!departamento || typeof departamento !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Erro ao salvar template',
          message: 'Departamento é obrigatório e deve ser um texto.'
        });
      }
      const template = templateService.save(departamento, fields);
      res.json({ success: true, template });
    } catch (error) {
      // #region agent log
      agentLog({ location: 'templateController.js:saveTemplate', message: 'catch', data: { errorMessage: error.message }, hypothesisId: 'A' });
      // #endregion
      res.status(400).json({
        success: false,
        error: 'Erro ao salvar template',
        message: error.message
      });
    }
  }
};
