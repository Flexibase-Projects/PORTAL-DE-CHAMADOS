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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  GripVertical,
  Pencil,
  Trash2,
  Save,
  Loader2,
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
  const Icon =
    FIELD_TYPES.find((t) => t.value === field.type)?.Icon || Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md border p-2 ${
        isDragging ? "bg-accent opacity-80" : "bg-card"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <span className="flex-1 text-sm truncate">
        {field.label || "(sem label)"}
        {field.required && (
          <span className="text-destructive ml-1">*</span>
        )}
      </span>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(field)}>
        <Pencil className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive"
        onClick={() => onRemove(field.id)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
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
      <p className="text-sm text-muted-foreground">
        Selecione um departamento para editar o template.
      </p>
    );
  }

  if (loadingTemplate) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 rounded-md" />
        ))}
      </div>
    );
  }

  const sorted = [...fields].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSaveTemplate} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Template
        </Button>
      </div>

      <div className="rounded-lg border">
        <div className="flex flex-wrap gap-1 p-3 bg-muted/50 border-b">
          <span className="text-xs text-muted-foreground mr-2 self-center">
            Adicionar:
          </span>
          {FIELD_TYPES.map(({ value, label, Icon }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleOpenAdd(value)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="p-3 space-y-2 max-h-[60vh] overflow-auto">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum campo. Clique em um ícone acima para adicionar.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sorted.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
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
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField ? "Editar Campo" : "Adicionar Campo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formField.type}
                onValueChange={(v) =>
                  setFormField((p) => ({ ...p, type: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={formField.label}
                onChange={(e) =>
                  setFormField((p) => ({ ...p, label: e.target.value }))
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={formField.required}
                onCheckedChange={(c) =>
                  setFormField((p) => ({ ...p, required: !!c }))
                }
              />
              Obrigatório
            </label>

            {formField.type === "text" && (
              <div className="space-y-2">
                <Label>Número de linhas</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={formField.rows ?? 1}
                  onChange={(e) =>
                    setFormField((p) => ({
                      ...p,
                      rows: Math.min(20, Math.max(1, parseInt(e.target.value) || 1)),
                    }))
                  }
                />
              </div>
            )}

            {["select", "radio", "checkbox"].includes(formField.type) && (
              <div className="space-y-2">
                <Label>Opções</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova opção"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newOption.trim()) {
                          setFormField((p) => ({
                            ...p,
                            options: [...p.options, newOption.trim()],
                          }));
                          setNewOption("");
                        }
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (newOption.trim()) {
                        setFormField((p) => ({
                          ...p,
                          options: [...p.options, newOption.trim()],
                        }));
                        setNewOption("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formField.options.map((opt, i) => (
                    <Badge
                      key={`${opt}-${i}`}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() =>
                        setFormField((p) => ({
                          ...p,
                          options: p.options.filter((_, idx) => idx !== i),
                        }))
                      }
                    >
                      {opt} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveField}>
              {editingField ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
