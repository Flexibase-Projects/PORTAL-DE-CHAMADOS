import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Armazenamento em memória (um template por departamento)
const templatesByDepartamento = {};

// #region agent log
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG_LOG = path.join(__dirname, '..', '..', 'debug.log');
function agentLog(payload) {
  try {
    fs.mkdirSync(path.dirname(DEBUG_LOG), { recursive: true });
    fs.appendFileSync(DEBUG_LOG, JSON.stringify({ ...payload, timestamp: Date.now(), sessionId: 'debug-session' }) + '\n');
  } catch (_) {}
}
// #endregion

export const templateService = {
  getByDepartamento(departamento) {
    const template = templatesByDepartamento[departamento];
    return template ? { departamento, fields: [...template.fields] } : { departamento: departamento || '', fields: [] };
  },

  save(departamento, fields) {
    // #region agent log
    agentLog({ location: 'templateService.js:save', message: 'entry', data: { departamento, depType: typeof departamento, fieldsIsArray: Array.isArray(fields), fieldsLen: fields?.length }, hypothesisId: 'C,E' });
    // #endregion
    if (!departamento || typeof departamento !== 'string') {
      throw new Error('Departamento é obrigatório');
    }
    const normalized = Array.isArray(fields) ? fields.map((f, i) => ({
      id: f.id || `field_${Date.now()}_${i}`,
      type: f.type || 'text',
      key: f.key || `field_${i}`,
      label: f.label || '',
      placeholder: f.placeholder || '',
      required: !!f.required,
      validation: f.validation || null,
      options: Array.isArray(f.options) ? f.options : [],
      size: f.size === 'half' ? 'half' : 'full',
      order: typeof f.order === 'number' ? f.order : i,
      x: typeof f.x === 'number' ? f.x : 0,
      y: typeof f.y === 'number' ? f.y : 0,
      widthPct: typeof f.widthPct === 'number' ? f.widthPct : 50,
      heightPct: typeof f.heightPct === 'number' ? f.heightPct : 15,
      rows: typeof f.rows === 'number' ? f.rows : undefined
    })) : [];
    normalized.sort((a, b) => a.order - b.order);
    templatesByDepartamento[departamento] = { departamento, fields: normalized };
    return templatesByDepartamento[departamento];
  },

  getAllDepartamentos() {
    return Object.keys(templatesByDepartamento);
  }
};
