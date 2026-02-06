import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  List,
  ListItem,
  Chip,
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
  DragIndicator as DragIndicatorIcon,
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

function defaultField(type = 'text', order = 0) {
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: type || 'text',
    label: '',
    required: false,
    validation: null,
    options: [],
    rows: type === 'text' ? 1 : undefined,
    order,
  };
}

function getIconForType(type) {
  const t = FIELD_TYPES.find((x) => x.value === type);
  return t ? t.Icon : TextFieldsIcon;
}

function SortableFieldItem({ field, onEdit, onRemove }) {
  const id = String(field.id ?? '');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const Icon = getIconForType(field.type);
  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        bgcolor: isDragging ? 'action.selected' : 'background.paper',
        opacity: isDragging ? 0.9 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 0.5,
        px: 1,
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{ cursor: 'grab', touchAction: 'none', display: 'flex', alignItems: 'center', color: 'text.secondary' }}
        aria-label="Arrastar para reordenar"
      >
        <DragIndicatorIcon />
      </Box>
      <Icon sx={{ fontSize: 20, color: 'primary.main' }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap>
          {field.label || '(sem label)'}
          {field.required && (
            <Typography component="span" variant="caption" color="error" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>
      </Box>
      <IconButton size="small" onClick={() => onEdit(field)} title="Editar" sx={{ p: 0.5 }}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={() => onRemove(field.id)} color="error" title="Remover" sx={{ p: 0.5 }}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </ListItem>
  );
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
  const [newOptionInput, setNewOptionInput] = useState('');

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
            if (type === 'textarea') type = 'text';
            if (type === 'table') {
              type = 'info';
              label = label || '(Campo tabela removido)';
            }
            const order = typeof f.order === 'number' ? f.order : i;
            const rows = type === 'text' ? (f.rows ?? (f.type === 'textarea' ? 4 : 1)) : undefined;
            return {
              id: String(f.id || `field_${i}_${Date.now()}`),
              type,
              label,
              required: !!f.required,
              validation: f.validation || null,
              options: Array.isArray(f.options) ? f.options : [],
              rows,
              order,
              key: f.key,
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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((prev) => {
      const ids = prev.map((f) => String(f.id));
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((f, i) => ({ ...f, order: i }));
    });
  };

  const handleOpenAdd = (fieldType = 'text') => {
    setEditingField(null);
    setFormField({ ...defaultField(fieldType, fields.length), order: fields.length });
    setDialogOpen(true);
  };

  const handleOpenEdit = (field) => {
    setEditingField(field);
    setFormField({
      id: field.id,
      type: field.type || 'text',
      label: field.label || '',
      required: !!field.required,
      validation: field.validation || null,
      options: Array.isArray(field.options) ? [...field.options] : [],
      rows: field.rows ?? (field.type === 'text' ? 1 : undefined),
      order: field.order ?? 0,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingField(null);
    setNewOptionInput('');
  };

  const handleAddOption = () => {
    const val = newOptionInput.trim();
    if (!val) return;
    setFormField((p) => ({ ...p, options: [...(Array.isArray(p.options) ? p.options : []), val] }));
    setNewOptionInput('');
  };

  const handleRemoveOption = (index) => {
    setFormField((p) => ({
      ...p,
      options: (p.options || []).filter((_, i) => i !== index),
    }));
  };

  const handleSaveField = () => {
    const label = (formField.label || '').trim();
    if (!label) {
      setError('Label é obrigatório.');
      return;
    }
    const optionsText = typeof formField.options === 'string' ? formField.options : (formField.options || []).join('\n');
    const options = optionsText.split(/\n/).map((s) => s.trim()).filter(Boolean);
    const rows =
      formField.type === 'text' ? Math.min(20, Math.max(1, formField.rows ?? 1)) : undefined;
    const newField = {
      id: formField.id,
      type: formField.type,
      key: formField.id,
      label: formField.label.trim(),
      required: formField.required,
      validation: formField.validation || null,
      options,
      rows,
      order: formField.order,
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
    setFields((prev) => prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })));
  };

  const handleSaveTemplate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const ordered = fields.map((f, i) => ({ ...f, order: i, key: f.key ?? f.id }));
      const res = await templateAPI.saveTemplate(departamento, ordered);
      if (res.success) {
        setSuccess('Template salvo com sucesso.');
        setFields(res.template?.fields ?? ordered);
      }
    } catch (err) {
      let msg = err.response?.data?.message || err.message || 'Erro ao salvar template.';
      if (err.code === 'ERR_NETWORK' || (err.message && err.message.includes('Network'))) {
        msg =
          'Não foi possível conectar ao servidor. Verifique se o backend está rodando (ex.: na raiz do projeto: npm run dev:backend ou npm run dev).';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!departamento) {
    return (
      <Typography color="text.secondary">Selecione um departamento para editar o template.</Typography>
    );
  }

  if (loadingTemplate) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const sortedFields = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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
            Tipos de campo — clique para adicionar:
          </Typography>
          {FIELD_TYPES.map(({ value, label, Icon }) => (
            <Tooltip key={value} title={label} arrow placement="bottom">
              <Box
                component="span"
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
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background 0.15s',
                }}
              >
                <Icon sx={{ fontSize: 22 }} />
              </Box>
            </Tooltip>
          ))}
        </Box>

        <Box sx={{ p: 2, maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
          {sortedFields.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              Nenhum campo. Clique em um ícone acima para adicionar.
            </Typography>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedFields.map((f) => String(f.id))} strategy={verticalListSortingStrategy}>
                <List disablePadding>
                  {sortedFields.map((field) => (
                    <SortableFieldItem
                      key={field.id}
                      field={field}
                      onEdit={handleOpenEdit}
                      onRemove={handleRemove}
                    />
                  ))}
                </List>
              </SortableContext>
            </DndContext>
          )}
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
            <TextField
              fullWidth
              label="Label"
              value={formField.label}
              onChange={(e) => setFormField((p) => ({ ...p, label: e.target.value }))}
              required
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
            {formField.type === 'text' && (
              <TextField
                fullWidth
                type="number"
                label="Número de linhas"
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
            {(formField.type === 'select' || formField.type === 'radio' || formField.type === 'checkbox') && (
              <Box>
                <TextField
                  fullWidth
                  label="Opções"
                  placeholder="Digite uma opção e pressione Enter para adicionar"
                  value={newOptionInput}
                  onChange={(e) => setNewOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddOption();
                    }
                  }}
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {(Array.isArray(formField.options) ? formField.options : []).map((opt, idx) => (
                    <Chip
                      key={`${opt}-${idx}`}
                      label={opt}
                      size="small"
                      onDelete={() => handleRemoveOption(idx)}
                    />
                  ))}
                </Box>
              </Box>
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
