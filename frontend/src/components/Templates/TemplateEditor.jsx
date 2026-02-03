import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Typography,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  TextFields as TextFieldsIcon,
  Numbers as NumbersIcon,
  List as ListIcon,
  RadioButtonChecked as RadioIcon,
  CheckBox as CheckBoxIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { templateAPI } from '../../services/api';
import TemplateFieldRenderer from './TemplateFieldRenderer';

const FIELD_TYPES = [
  { value: 'text', label: 'Texto', Icon: TextFieldsIcon },
  { value: 'number', label: 'Número', Icon: NumbersIcon },
  { value: 'select', label: 'Lista suspensa', Icon: ListIcon },
  { value: 'radio', label: 'Opção (radio)', Icon: RadioIcon },
  { value: 'checkbox', label: 'Checkbox', Icon: CheckBoxIcon },
  { value: 'file', label: 'Arquivo', Icon: AttachFileIcon },
  { value: 'image', label: 'Imagem', Icon: ImageIcon },
  { value: 'info', label: 'Informação', Icon: InfoIcon },
];

const ALIGN_TOLERANCE = 0.5; // %
const MIN_FIELD_W = 5;
const MIN_FIELD_H = 3;

function defaultField(type = 'text', yPct = 0) {
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: type || 'text',
    key: '',
    label: '',
    placeholder: '',
    required: false,
    validation: null,
    options: [],
    size: 'full',
    width: 12,
    rows: type === 'text' ? 1 : undefined,
    order: 0,
    x: 0,
    y: yPct,
    widthPct: 50,
    heightPct: 15,
  };
}

function rectsOverlapPct(a, b) {
  const aw = a.widthPct ?? MIN_FIELD_W;
  const ah = a.heightPct ?? MIN_FIELD_H;
  const bw = b.widthPct ?? MIN_FIELD_W;
  const bh = b.heightPct ?? MIN_FIELD_H;
  return !(a.x + aw <= b.x || b.x + bw <= a.x || a.y + ah <= b.y || b.y + bh <= a.y);
}

function nudgeToAvoidOverlap(field, others) {
  let { x, y, widthPct, heightPct } = field;
  const w = widthPct ?? MIN_FIELD_W;
  const h = heightPct ?? MIN_FIELD_H;
  const step = 2;
  const maxIterations = 100;
  for (let i = 0; i < maxIterations; i++) {
    const overlaps = others.filter((o) => o.id !== field.id && rectsOverlapPct({ x, y, widthPct: w, heightPct: h }, o));
    if (overlaps.length === 0) return { x, y };
    x += step;
    if (x + w > 100) {
      x = 0;
      y += step;
    }
    if (y + h > 100) y = Math.max(0, 100 - h);
  }
  return { x: field.x, y: field.y };
}

function getAlignmentLines(fields) {
  const lines = { horizontal: [], vertical: [] };
  const tol = ALIGN_TOLERANCE;
  fields.forEach((f) => {
    const top = f.y ?? 0;
    const left = f.x ?? 0;
    const bottom = top + (f.heightPct ?? MIN_FIELD_H);
    const right = left + (f.widthPct ?? MIN_FIELD_W);
    fields.forEach((g) => {
      if (g.id === f.id) return;
      const gTop = g.y ?? 0;
      const gLeft = g.x ?? 0;
      const gBottom = gTop + (g.heightPct ?? MIN_FIELD_H);
      const gRight = gLeft + (g.widthPct ?? MIN_FIELD_W);
      if (Math.abs(top - gTop) <= tol) lines.horizontal.push(top);
      if (Math.abs(bottom - gBottom) <= tol) lines.horizontal.push(bottom);
      if (Math.abs(left - gLeft) <= tol) lines.vertical.push(left);
      if (Math.abs(right - gRight) <= tol) lines.vertical.push(right);
    });
  });
  lines.horizontal = [...new Set(lines.horizontal)];
  lines.vertical = [...new Set(lines.vertical)];
  return lines;
}

const TemplateEditor = ({ departamento }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formField, setFormField] = useState(defaultField());
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [hoveredFieldId, setHoveredFieldId] = useState(null);

  const updateCanvasDimensions = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    setCanvasSize({ width: el.clientWidth || 800, height: el.clientHeight || 500 });
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateCanvasDimensions) : null;
    const el = canvasRef.current;
    if (ro && el) ro.observe(el);
    window.addEventListener('resize', updateCanvasDimensions);
    return () => {
      if (ro && el) ro.unobserve(el);
      window.removeEventListener('resize', updateCanvasDimensions);
    };
  }, [updateCanvasDimensions, loadingTemplate]);

  useEffect(() => {
    if (departamento) {
      loadTemplate();
    } else {
      setFields([]);
      setLoadingTemplate(false);
    }
  }, [departamento]);

  const loadTemplate = async () => {
    setLoadingTemplate(true);
    setError('');
    try {
      const res = await templateAPI.getTemplate(departamento);
      if (res.success && res.template && Array.isArray(res.template.fields)) {
        setFields(
          res.template.fields.map((f, i) => {
            let type = f.type ?? 'text';
            let label = f.label ?? '';
            if (type === 'textarea') {
              type = 'text';
            } else if (type === 'table') {
              type = 'info';
              label = label || '(Campo tabela removido)';
            }
            const rows =
              type === 'text'
                ? (f.rows ?? (f.type === 'textarea' ? 4 : 1))
                : undefined;
            const order = f.order ?? i;
            let x = f.x;
            let y = f.y;
            let widthPct = f.widthPct;
            let heightPct = f.heightPct;
            if (x == null || y == null || widthPct == null || heightPct == null) {
              if (f.widthPx != null && f.heightPx != null && f.widthPx <= 100 && f.heightPx <= 100) {
                x = f.x ?? 0;
                y = f.y ?? 0;
                widthPct = f.widthPx;
                heightPct = f.heightPx;
              } else if (f.widthPx != null && f.heightPx != null) {
                x = ((f.x ?? 0) / 1920) * 100;
                y = ((f.y ?? 0) / 1080) * 100;
                widthPct = ((f.widthPx ?? 400) / 1920) * 100;
                heightPct = ((f.heightPx ?? 120) / 1080) * 100;
              } else {
                const col = f.col ?? 0;
                const row = f.row ?? order;
                const colSpan = Math.min(12, Math.max(1, f.colSpan ?? f.width ?? (f.size === 'half' ? 6 : 12)));
                const rowSpan = Math.max(1, f.rowSpan ?? 1);
                x = (col / 12) * 100;
                y = row * 8;
                widthPct = (colSpan / 12) * 100;
                heightPct = rowSpan * 8;
              }
            }
            const w = Math.min(100, Math.max(MIN_FIELD_W, widthPct ?? 50));
            const h = Math.min(100, Math.max(MIN_FIELD_H, heightPct ?? 15));
            return {
              ...f,
              type,
              label,
              order,
              rows,
              x: Math.max(0, Math.min(100 - w, x ?? 0)),
              y: Math.max(0, Math.min(100 - h, y ?? 0)),
              widthPct: w,
              heightPct: h,
            };
          })
        );
      } else {
        setFields([]);
      }
    } catch (err) {
      setError('Erro ao carregar template.');
      setFields([]);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleToolbarDragStart = (e, fieldType) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'toolbar', fieldType }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDraggingId(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
      if (data.source === 'toolbar' && data.fieldType) {
        const nextY =
          fields.length === 0 ? 0 : Math.min(100 - MIN_FIELD_H, Math.max(0, Math.max(...fields.map((f) => (f.y ?? 0) + (f.heightPct ?? MIN_FIELD_H))) + 2));
        const newField = defaultField(data.fieldType, nextY);
        setFields((prev) => [...prev, newField]);
        setFormField({ ...newField, order: fields.length });
        setEditingField(newField);
        setDialogOpen(true);
      }
    } catch (_) {}
  };

  const handleRndDragStop = (fieldId, _e, d) => {
    setDraggingId(null);
    const { width: cw, height: ch } = canvasSize;
    if (cw <= 0 || ch <= 0) return;
    let x = (d.x / cw) * 100;
    let y = (d.y / ch) * 100;
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const widthPct = field.widthPct ?? MIN_FIELD_W;
    const heightPct = field.heightPct ?? MIN_FIELD_H;
    x = Math.max(0, Math.min(100 - widthPct, x));
    y = Math.max(0, Math.min(100 - heightPct, y));
    const others = fields.filter((f) => f.id !== fieldId);
    const nudged = nudgeToAvoidOverlap({ ...field, x, y, widthPct, heightPct }, others);
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, x: nudged.x, y: nudged.y } : f))
    );
  };

  const handleRndResizeStop = (fieldId, _e, _dir, ref, _delta, position) => {
    const { width: cw, height: ch } = canvasSize;
    if (cw <= 0 || ch <= 0) return;
    const w = ref.offsetWidth;
    const h = ref.offsetHeight;
    const widthPct = Math.min(100, Math.max(MIN_FIELD_W, (w / cw) * 100));
    const heightPct = Math.min(100, Math.max(MIN_FIELD_H, (h / ch) * 100));
    let x = (position.x / cw) * 100;
    let y = (position.y / ch) * 100;
    x = Math.max(0, Math.min(100 - widthPct, x));
    y = Math.max(0, Math.min(100 - heightPct, y));
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const others = fields.filter((f) => f.id !== fieldId);
    const nudged = nudgeToAvoidOverlap({ ...field, x, y, widthPct, heightPct }, others);
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, x: nudged.x, y: nudged.y, widthPct, heightPct } : f))
    );
  };

  const handleOpenAdd = (fieldType = 'text') => {
    setEditingField(null);
    const nextY =
      fields.length === 0 ? 0 : Math.min(100 - MIN_FIELD_H, Math.max(0, Math.max(...fields.map((f) => (f.y ?? 0) + (f.heightPct ?? MIN_FIELD_H))) + 2));
    setFormField({ ...defaultField(fieldType, nextY), order: fields.length });
    setDialogOpen(true);
  };

  const handleOpenEdit = (field) => {
    setEditingField(field);
    setFormField({
      id: field.id,
      type: field.type || 'text',
      key: field.key || '',
      label: field.label || '',
      placeholder: field.placeholder || '',
      required: !!field.required,
      validation: field.validation || null,
      options: Array.isArray(field.options) ? [...field.options] : [],
      size: field.size === 'half' ? 'half' : 'full',
      width: field.width ?? 12,
      rows: field.rows ?? (field.type === 'text' ? 1 : undefined),
      order: field.order ?? 0,
      x: field.x ?? 0,
      y: field.y ?? 0,
      widthPct: field.widthPct ?? 50,
      heightPct: field.heightPct ?? 15,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingField(null);
  };

  const handleSaveField = () => {
    const key = (formField.key || '').trim();
    const label = (formField.label || '').trim();
    if (!key && formField.type !== 'info') {
      setError('Chave do campo é obrigatória.');
      return;
    }
    if (!label) {
      setError('Label é obrigatório.');
      return;
    }
    const optionsText = typeof formField.options === 'string' ? formField.options : (formField.options || []).join('\n');
    const options = optionsText.split(/\n/).map((s) => s.trim()).filter(Boolean);

    const widthPct = Math.min(100, Math.max(MIN_FIELD_W, formField.widthPct ?? 50));
    const heightPct = Math.min(100, Math.max(MIN_FIELD_H, formField.heightPct ?? 15));
    const rows =
      formField.type === 'text'
        ? Math.min(20, Math.max(1, formField.rows ?? 1))
        : undefined;
    const newField = {
      id: formField.id,
      type: formField.type,
      key: formField.type === 'info' ? `info_${Date.now()}` : key,
      label: formField.label,
      placeholder: formField.placeholder || '',
      required: formField.required,
      validation: formField.validation || null,
      options,
      size: formField.size,
      width: formField.width ?? 12,
      rows,
      order: formField.order,
      x: Math.max(0, Math.min(100 - widthPct, formField.x ?? 0)),
      y: Math.max(0, Math.min(100 - heightPct, formField.y ?? 0)),
      widthPct,
      heightPct,
    };

    let nextFields;
    if (editingField) {
      nextFields = fields.map((f) => (f.id === editingField.id ? newField : f));
    } else {
      nextFields = [...fields, newField].map((f, i) => ({ ...f, order: i }));
    }
    setFields(nextFields);
    handleCloseDialog();
    setError('');
  };

  const handleRemove = (id) => {
    if (selectedFieldId === id) setSelectedFieldId(null);
    setFields((prev) => prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })));
  };

  const handleSaveTemplate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const ordered = fields.map((f, i) => ({ ...f, order: i }));
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d1f6bbde-a9c1-4388-8444-b8d7d0522f82',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TemplateEditor.jsx:handleSaveTemplate',message:'before saveTemplate',data:{departamento,depType:typeof departamento,fieldsLen:ordered.length,firstFieldKeys:ordered[0]?Object.keys(ordered[0]):[]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,E'})}).catch(()=>{});
      // #endregion
      const res = await templateAPI.saveTemplate(departamento, ordered);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d1f6bbde-a9c1-4388-8444-b8d7d0522f82',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TemplateEditor.jsx:handleSaveTemplate',message:'after saveTemplate',data:{resSuccess:res?.success},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (res.success) {
        setSuccess('Template salvo com sucesso.');
        setFields(res.template?.fields ?? ordered);
      }
    } catch (err) {
      // #region agent log
      const catchData = { status: err.response?.status, data: err.response?.data, message: err.message, code: err.code };
      console.error('[TemplateEditor save]', catchData);
      fetch('http://127.0.0.1:7242/ingest/d1f6bbde-a9c1-4388-8444-b8d7d0522f82',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TemplateEditor.jsx:handleSaveTemplate',message:'catch',data:catchData,timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,D'})}).catch(()=>{});
      // #endregion
      let msg = err.response?.data?.message || err.message || 'Erro ao salvar template.';
      if (err.code === 'ERR_NETWORK' || (err.message && err.message.includes('Network'))) {
        msg = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando (ex.: na raiz do projeto: npm run dev:backend ou npm run dev).';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!departamento) {
    return (
      <Typography color="text.secondary">
        Selecione um departamento para editar o template.
      </Typography>
    );
  }

  if (loadingTemplate) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const alignmentLines = getAlignmentLines(fields);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveTemplate}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Salvar template'}
        </Button>
      </Box>

      {/* Quadro único: barra de ícones no topo + área de campos (margin 20px das laterais) */}
      <Paper
        variant="outlined"
        sx={{
          mx: '20px',
          overflow: 'hidden',
          border: '2px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        {/* Parte superior: ícones dos tipos de campo (arrastar ou clicar) */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: 'grey.100',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0.5,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
            Tipos de campo — arraste para o quadro ou clique:
          </Typography>
          {FIELD_TYPES.map(({ value, label, Icon }) => (
            <Tooltip key={value} title={label} arrow placement="bottom">
              <Box
                component="span"
                draggable
                onDragStart={(e) => handleToolbarDragStart(e, value)}
                onClick={() => handleOpenAdd(value)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'primary.main',
                  cursor: 'grab',
                  '&:active': { cursor: 'grabbing' },
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background 0.15s',
                }}
              >
                <Icon sx={{ fontSize: 22 }} />
              </Box>
            </Tooltip>
          ))}
        </Box>

        {/* Container com scroll para o canvas fluido */}
        <Box sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 280px)', borderTop: '1px solid', borderColor: 'divider' }}>
          <Box
            ref={canvasRef}
            sx={{
              width: '100%',
              minHeight: 500,
              p: 0,
              bgcolor: 'grey.100',
              position: 'relative',
              overflow: 'hidden',
            }}
            onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            setDragOverIndex(1);
          }}
          onDragLeave={() => setDragOverIndex(null)}
          onDrop={handleCanvasDrop}
          onClick={(e) => {
            if (!e.target.closest('.react-rnd')) setSelectedFieldId(null);
          }}
        >
          {fields.length === 0 && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed',
                borderColor: 'divider',
                color: 'text.secondary',
              }}
            >
              <Typography>Arraste um ícone para cá ou clique em um ícone acima</Typography>
            </Box>
          )}

          {/* Linhas tracejadas de alinhamento (%) */}
          {alignmentLines.horizontal.map((val, i) => (
            <Box
              key={`h-${i}-${val}`}
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${val}%`,
                height: 0,
                borderTop: '2px dashed',
                borderColor: 'primary.main',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          ))}
          {alignmentLines.vertical.map((val, i) => (
            <Box
              key={`v-${i}-${val}`}
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${val}%`,
                width: 0,
                borderLeft: '2px dashed',
                borderColor: 'primary.main',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          ))}

          {fields.map((field) => {
            const { width: cw, height: ch } = canvasSize;
            const xPx = ((field.x ?? 0) / 100) * cw;
            const yPx = ((field.y ?? 0) / 100) * ch;
            const wPx = ((field.widthPct ?? MIN_FIELD_W) / 100) * cw;
            const hPx = ((field.heightPct ?? MIN_FIELD_H) / 100) * ch;
            const showActions = selectedFieldId === field.id || hoveredFieldId === field.id;
            return (
              <Rnd
                key={field.id}
                position={{ x: xPx, y: yPx }}
                size={{ width: wPx, height: hPx }}
                minWidth={40}
                minHeight={32}
                bounds="parent"
                onDragStart={() => setDraggingId(field.id)}
                onDragStop={(e, d) => handleRndDragStop(field.id, e, d)}
                onResizeStop={(e, dir, ref, delta, position) =>
                  handleRndResizeStop(field.id, e, dir, ref, delta, position)
                }
                enableResizing={{ bottom: true, bottomRight: true, right: true }}
                style={{ zIndex: draggingId === field.id ? 10 : selectedFieldId === field.id ? 5 : 1, boxSizing: 'border-box' }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: draggingId === field.id ? 0.95 : 1,
                  }}
                  onMouseEnter={() => setHoveredFieldId(field.id)}
                  onMouseLeave={() => setHoveredFieldId(null)}
                  onClick={() => setSelectedFieldId(field.id)}
                >
                  {/* Ícones editar/apagar em overlay no canto (borda do Rnd = borda do campo) */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      zIndex: 2,
                      display: 'flex',
                      gap: 0.5,
                      opacity: showActions ? 1 : 0,
                      pointerEvents: showActions ? 'auto' : 'none',
                      transition: 'opacity 0.15s',
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      boxShadow: 1,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(field);
                      }}
                      title="Editar"
                      sx={{ p: 0.5 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(field.id);
                      }}
                      color="error"
                      title="Remover"
                      sx={{ p: 0.5 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ p: 0.5, height: '100%', overflow: 'auto', boxSizing: 'border-box' }}>
                    <TemplateFieldRenderer field={field} preview />
                  </Box>
                </Box>
              </Rnd>
            );
          })}
          </Box>
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingField ? 'Editar campo' : 'Adicionar campo'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formField.type}
                label="Tipo"
                onChange={(e) => setFormField((p) => ({ ...p, type: e.target.value }))}
              >
                {FIELD_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formField.type !== 'info' && (
              <TextField
                fullWidth
                label="Chave (key)"
                value={formField.key}
                onChange={(e) => setFormField((p) => ({ ...p, key: e.target.value }))}
                placeholder="ex: tipoSuporte"
              />
            )}
            <TextField
              fullWidth
              label="Label"
              value={formField.label}
              onChange={(e) => setFormField((p) => ({ ...p, label: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="Placeholder"
              value={formField.placeholder}
              onChange={(e) => setFormField((p) => ({ ...p, placeholder: e.target.value }))}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formField.required}
                  onChange={(e) => setFormField((p) => ({ ...p, required: e.target.checked }))}
                />
              }
              label="Obrigatório"
            />
            <TextField
              fullWidth
              type="number"
              label="Largura (%)"
              value={formField.widthPct ?? 50}
              onChange={(e) =>
                setFormField((p) => ({
                  ...p,
                  widthPct: Math.min(100, Math.max(MIN_FIELD_W, Number(e.target.value) || MIN_FIELD_W)),
                }))
              }
              inputProps={{ min: MIN_FIELD_W, max: 100 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Altura (%)"
              value={formField.heightPct ?? 15}
              onChange={(e) =>
                setFormField((p) => ({
                  ...p,
                  heightPct: Math.min(100, Math.max(MIN_FIELD_H, Number(e.target.value) || MIN_FIELD_H)),
                }))
              }
              inputProps={{ min: MIN_FIELD_H, max: 100 }}
            />
            {formField.type === 'text' && (
              <TextField
                fullWidth
                type="number"
                label="Altura (número de linhas)"
                value={formField.rows ?? 1}
                onChange={(e) =>
                  setFormField((p) => ({
                    ...p,
                    rows: Math.min(20, Math.max(1, parseInt(e.target.value, 10) || 1)),
                  }))
                }
                inputProps={{ min: 1, max: 20 }}
              />
            )}
            {(formField.type === 'select' || formField.type === 'radio') && (
              <TextField
                fullWidth
                label="Opções (uma por linha)"
                value={Array.isArray(formField.options) ? formField.options.join('\n') : ''}
                onChange={(e) =>
                  setFormField((p) => ({
                    ...p,
                    options: e.target.value.split(/\n/).map((s) => s.trim()).filter(Boolean),
                  }))
                }
                multiline
                rows={4}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveField} variant="contained">
            {editingField ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateEditor;
