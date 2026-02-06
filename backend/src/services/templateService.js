import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Armazenamento em memória (um template por departamento)
const templatesByDepartamento = {};

// #region agent log
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG_LOG = path.join(__dirname, '..', '..', '..', '.cursor', 'debug.log');
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
    // #region agent log
    if (template) {
      agentLog({ location: 'templateService.js:getByDepartamento', message: 'hasTemplate', data: { fieldsIsArray: Array.isArray(template.fields), fieldsType: typeof template.fields }, hypothesisId: 'D' });
    }
    // #endregion
    return template ? { departamento, fields: [...(Array.isArray(template.fields) ? template.fields : [])] } : { departamento: departamento || '', fields: [] };
  },

  save(departamento, fields) {
    // #region agent log
    agentLog({ location: 'templateService.js:save', message: 'entry', data: { departamento, depType: typeof departamento, fieldsIsArray: Array.isArray(fields), fieldsLen: fields?.length }, hypothesisId: 'C,E' });
    // #endregion
    if (!departamento || typeof departamento !== 'string') {
      throw new Error('Departamento é obrigatório');
    }
    const safeGet = (obj, key, def) => {
      try {
        const v = obj[key];
        return v !== undefined && v !== null ? v : def;
      } catch {
        return def;
      }
    };
    const safeFields = Array.isArray(fields) ? fields.filter((f) => f != null && typeof f === 'object') : [];
    const normalized = safeFields.map((f, i) => {
      const base = `field_${Date.now()}_${i}`;
      let options = [];
      try {
        const raw = safeGet(f, 'options', []);
        options = Array.isArray(raw) ? raw.map((o) => (typeof o === 'string' ? o : (o && typeof o === 'object' && o.value !== undefined ? o.value : String(o)))) : [];
      } catch {
        options = [];
      }
      return {
        id: safeGet(f, 'id', base) || base,
        type: safeGet(f, 'type', 'text') || 'text',
        key: safeGet(f, 'key', `field_${i}`) || `field_${i}`,
        label: safeGet(f, 'label', '') || '',
        placeholder: safeGet(f, 'placeholder', '') || '',
        required: !!safeGet(f, 'required', false),
        validation: safeGet(f, 'validation', null),
        options,
        size: safeGet(f, 'size', 'full') === 'half' ? 'half' : 'full',
        order: typeof safeGet(f, 'order', i) === 'number' ? safeGet(f, 'order', i) : i,
        x: typeof safeGet(f, 'x', 0) === 'number' ? safeGet(f, 'x', 0) : 0,
        y: typeof safeGet(f, 'y', 0) === 'number' ? safeGet(f, 'y', 0) : 0,
        widthPct: typeof safeGet(f, 'widthPct', 50) === 'number' ? safeGet(f, 'widthPct', 50) : 50,
        heightPct: typeof safeGet(f, 'heightPct', 15) === 'number' ? safeGet(f, 'heightPct', 15) : 15,
        rows: typeof safeGet(f, 'rows', undefined) === 'number' ? safeGet(f, 'rows', undefined) : undefined
      };
    });
    normalized.sort((a, b) => a.order - b.order);
    // #region agent log
    try {
      JSON.stringify({ departamento, fields: normalized });
      agentLog({ location: 'templateService.js:save', message: 'serializeOk', data: { normalizedLen: normalized.length }, hypothesisId: 'A' });
    } catch (serErr) {
      agentLog({ location: 'templateService.js:save', message: 'serializeErr', data: { serErrMessage: serErr?.message }, hypothesisId: 'A' });
      throw serErr;
    }
    // #endregion
    templatesByDepartamento[departamento] = { departamento, fields: normalized };
    return templatesByDepartamento[departamento];
  },

  getAllDepartamentos() {
    return Object.keys(templatesByDepartamento);
  }
};
