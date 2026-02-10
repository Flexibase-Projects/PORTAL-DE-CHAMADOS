import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import {
  GripVertical,
  Pencil,
  Trash2,
  Save,
  Type,
  Hash,
  List,
  CircleDot,
  CheckSquare,
  Paperclip,
  Image,
  Info,
} from "lucide-react";
import { templateService } from "@/services/templateService";

const FIELD_TYPES = [
  { value: "text", label: "Texto", Icon: Type },
  { value: "number", label: "Número", Icon: Hash },
  { value: "select", label: "Lista", Icon: List },
  { value: "radio", label: "Radio", Icon: CircleDot },
  { value: "checkbox", label: "Checkbox", Icon: CheckSquare },
  { value: "file", label: "Arquivo", Icon: Paperclip },
  { value: "image", label: "Imagem", Icon: Image },
  { value: "info", label: "Informação", Icon: Info },
] as const;

interface FieldData {
  id: string;
  type: string;
  key?: string;
  label: string;
  required: boolean;
  validation?: string | null;
  options: string[];
  rows?: number;
  order: number;
}

function defaultField(type = "text", order = 0): FieldData {
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    label: "",
    required: false,
    options: [],
    rows: type === "text" ? 1 : undefined,
    order,
  };
}

function SortableItem({
  field,
  onEdit,
  onRemove,
}: {
  field: FieldData;
  onEdit: (f: FieldData) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = FIELD_TYPES.find((t) => t.value === field.type)?.Icon || Type;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        p: 1,
        bgcolor: isDragging ? "action.hover" : "background.paper",
        opacity: isDragging ? 0.9 : 1,
      }}
    >
      <IconButton size="small" sx={{ cursor: "grab", touchAction: "none" }} {...attributes} {...listeners}>
        <GripVertical style={{ width: 18, height: 18 }} />
      </IconButton>
      <Icon style={{ width: 18, height: 18, color: "var(--mui-palette-primary-main)", flexShrink: 0 }} />
      <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
        {field.label || "(sem label)"}
        {field.required && <Typography component="span" color="error"> *</Typography>}
      </Typography>
      <IconButton size="small" onClick={() => onEdit(field)}>
        <Pencil style={{ width: 14, height: 14 }} />
      </IconButton>
      <IconButton size="small" color="error" onClick={() => onRemove(field.id)}>
        <Trash2 style={{ width: 14, height: 14 }} />
      </IconButton>
    </Box>
  );
}

interface Props {
  departamento: string;
}

export function TemplateEditor({ departamento }: Props) {
  const [fields, setFields] = useState<FieldData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldData | null>(null);
  const [formField, setFormField] = useState<FieldData>(defaultField());
  const [newOption, setNewOption] = useState("");

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
    try {
      const res = await templateService.getTemplate(departamento);
      if (res.success && res.template?.fields) {
        setFields(
          res.template.fields.map((f: FieldData, i: number) => ({
            id: String(f.id || `field_${i}_${Date.now()}`),
            type: f.type === "textarea" ? "text" : f.type || "text",
            label: f.label || "",
            required: !!f.required,
            options: Array.isArray(f.options) ? f.options : [],
            rows: f.type === "text" ? (f.rows ?? 1) : undefined,
            order: typeof f.order === "number" ? f.order : i,
            key: f.key,
          }))
        );
      } else {
        setFields([]);
      }
    } catch {
      setError("Erro ao carregar template.");
      setFields([]);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleDragEnd = (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((prev) => {
      const ids = prev.map((f) => f.id);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex).map((f, i) => ({ ...f, order: i }));
    });
  };

  const handleOpenAdd = (type = "text") => {
    setEditingField(null);
    setFormField(defaultField(type, fields.length));
    setDialogOpen(true);
  };

  const handleOpenEdit = (field: FieldData) => {
    setEditingField(field);
    setFormField({ ...field, options: [...field.options] });
    setDialogOpen(true);
  };

  const handleSaveField = () => {
    if (!formField.label.trim()) {
      setError("Label é obrigatório.");
      return;
    }
    const newField: FieldData = {
      ...formField,
      key: formField.key ?? formField.id,
    };
    let next: FieldData[];
    if (editingField) {
      next = fields.map((f) => (f.id === editingField.id ? newField : f));
    } else {
      next = [...fields, newField].map((f, i) => ({ ...f, order: i }));
    }
    setFields(next);
    setDialogOpen(false);
    setError("");
  };

  const handleSaveTemplate = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const ordered = fields.map((f, i) => ({ ...f, order: i, key: f.key ?? f.id }));
      const res = await templateService.saveTemplate(departamento, ordered);
      if (res.success) {
        setSuccess("Template salvo com sucesso.");
        setFields(res.template?.fields ?? ordered);
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "ERR_NETWORK") {
        setError("Não foi possível conectar ao servidor.");
      } else {
        setError(e.message || "Erro ao salvar template.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!departamento) {
    return (
      <Typography variant="body2" color="text.secondary">
        Selecione um departamento para editar o template.
      </Typography>
    );
  }

  if (loadingTemplate) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={48} />
        ))}
      </Box>
    );
  }

  const sorted = [...fields].sort((a, b) => a.order - b.order);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={handleSaveTemplate}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} /> : <Save style={{ width: 18, height: 18 }} />}
        >
          {loading ? "Salvando..." : "Salvar Template"}
        </Button>
      </Box>

      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, p: 1.5, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center", mr: 1 }}>
            Adicionar:
          </Typography>
          {FIELD_TYPES.map(({ value, label, Icon }) => (
            <Tooltip key={value} title={label}>
              <IconButton size="small" onClick={() => handleOpenAdd(value)}>
                <Icon style={{ width: 18, height: 18 }} />
              </IconButton>
            </Tooltip>
          ))}
        </Box>

        <Box sx={{ p: 1.5, maxHeight: "60vh", overflow: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
          {sorted.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              Nenhum campo. Clique em um ícone acima para adicionar.
            </Typography>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sorted.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                {sorted.map((field) => (
                  <SortableItem
                    key={field.id}
                    field={field}
                    onEdit={handleOpenEdit}
                    onRemove={(id) =>
                      setFields((prev) =>
                        prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i }))
                      )
                    }
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingField ? "Editar Campo" : "Adicionar Campo"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small">
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
              label="Label"
              size="small"
              value={formField.label}
              onChange={(e) => setFormField((p) => ({ ...p, label: e.target.value }))}
              fullWidth
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formField.required}
                  onChange={(_, c) => setFormField((p) => ({ ...p, required: !!c }))}
                />
              }
              label="Obrigatório"
            />

            {formField.type === "text" && (
              <TextField
                label="Número de linhas"
                type="number"
                size="small"
                inputProps={{ min: 1, max: 20 }}
                value={formField.rows ?? 1}
                onChange={(e) =>
                  setFormField((p) => ({
                    ...p,
                    rows: Math.min(20, Math.max(1, parseInt(e.target.value) || 1)),
                  }))
                }
                fullWidth
              />
            )}

            {["select", "radio", "checkbox"].includes(formField.type) && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Opções</Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <TextField
                    placeholder="Nova opção"
                    size="small"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newOption.trim()) {
                          setFormField((p) => ({ ...p, options: [...p.options, newOption.trim()] }));
                          setNewOption("");
                        }
                      }
                    }}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (newOption.trim()) {
                        setFormField((p) => ({ ...p, options: [...p.options, newOption.trim()] }));
                        setNewOption("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {formField.options.map((opt, i) => (
                    <Chip
                      key={`${opt}-${i}`}
                      label={`${opt} ×`}
                      size="small"
                      onDelete={() =>
                        setFormField((p) => ({
                          ...p,
                          options: p.options.filter((_, idx) => idx !== i),
                        }))
                      }
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveField}>
            {editingField ? "Salvar" : "Adicionar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
