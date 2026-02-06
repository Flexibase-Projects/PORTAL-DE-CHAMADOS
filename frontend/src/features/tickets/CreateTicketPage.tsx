import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2 } from "lucide-react";
import { ticketService } from "@/services/ticketService";
import { templateService } from "@/services/templateService";
import { validateTicketForm, type FormErrors } from "@/utils/validation";
import {
  SETORES,
  DEPARTAMENTOS_POR_SETOR,
  TIPOS_SUPORTE_TI,
} from "@/constants/departamentos";
import { TemplateFieldRenderer } from "./components/TemplateFieldRenderer";
import type { TemplateField } from "@/types/template";

export function CreateTicketPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    setor: "",
    area: "",
    ramal: "",
    tipoSuporte: "",
    assunto: "",
    mensagem: "",
  });
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [dadosExtras, setDadosExtras] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (formData.area) {
      templateService
        .getTemplate(formData.area)
        .then((res) => {
          if (
            res.success &&
            res.template &&
            Array.isArray(res.template.fields)
          ) {
            setTemplateFields(
              res.template.fields.sort(
                (a: TemplateField, b: TemplateField) =>
                  (a.order ?? 0) - (b.order ?? 0)
              )
            );
          } else {
            setTemplateFields([]);
          }
        })
        .catch(() => setTemplateFields([]));
      setDadosExtras({});
    } else {
      setTemplateFields([]);
      setDadosExtras({});
    }
  }, [formData.area]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "setor") next.area = "";
      if (name === "area" && value !== "TI") next.tipoSuporte = "";
      return next;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDynamicChange = (key: string, value: unknown) => {
    setDadosExtras((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateTicketForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Validate dynamic fields
    const dynErrors: FormErrors = {};
    templateFields.forEach((field) => {
      if (field.type === "info" || !field.required) return;
      const fieldId = field.id ?? field.key;
      const val = dadosExtras[fieldId];
      const isEmpty =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0);
      if (isEmpty) dynErrors[fieldId] = `${field.label || fieldId} é obrigatório`;
    });
    if (Object.keys(dynErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...dynErrors }));
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const response = await ticketService.create({ ...formData, dadosExtras });
      if (response.success) {
        setTicketId(response.ticket.id || response.ticket.numero_protocolo);
        setSuccess(true);
      }
    } catch {
      setErrors({ submit: "Erro ao criar chamado. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  if (success && ticketId) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Chamado Criado com Sucesso!</h2>
            <p className="text-lg font-mono">{ticketId}</p>
            <p className="text-muted-foreground">
              Anote este protocolo para consultar seu chamado posteriormente.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={() => navigate("/meus-chamados")}>
                Ver Meus Chamados
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setFormData({
                    nome: "",
                    email: "",
                    setor: "",
                    area: "",
                    ramal: "",
                    tipoSuporte: "",
                    assunto: "",
                    mensagem: "",
                  });
                  setDadosExtras({});
                  setTemplateFields([]);
                }}
              >
                Novo Chamado
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Enviar um Chamado</h1>
        <p className="text-muted-foreground">
          Preencha os dados abaixo para criar um novo chamado.
        </p>
      </div>

      {errors.submit && (
        <Alert variant="destructive">
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  className={errors.nome ? "border-destructive" : ""}
                />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Setor <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.setor}
                  onValueChange={(v) => handleChange("setor", v)}
                >
                  <SelectTrigger
                    className={errors.setor ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {SETORES.map((setor) => (
                      <SelectItem key={setor} value={setor}>
                        {setor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.setor && (
                  <p className="text-xs text-destructive">{errors.setor}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Departamento <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.area}
                  onValueChange={(v) => handleChange("area", v)}
                  disabled={!formData.setor}
                >
                  <SelectTrigger
                    className={errors.area ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(DEPARTAMENTOS_POR_SETOR[formData.setor] || []).map(
                      (dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                {errors.area && (
                  <p className="text-xs text-destructive">{errors.area}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ramal">Ramal</Label>
                <Input
                  id="ramal"
                  type="number"
                  value={formData.ramal}
                  onChange={(e) => handleChange("ramal", e.target.value)}
                  className={errors.ramal ? "border-destructive" : ""}
                />
                {errors.ramal && (
                  <p className="text-xs text-destructive">{errors.ramal}</p>
                )}
              </div>

              {formData.area === "TI" && (
                <div className="space-y-2">
                  <Label>Tipo de Suporte</Label>
                  <Select
                    value={formData.tipoSuporte}
                    onValueChange={(v) => handleChange("tipoSuporte", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_SUPORTE_TI.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assunto">
                Assunto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="assunto"
                value={formData.assunto}
                onChange={(e) => handleChange("assunto", e.target.value)}
                className={errors.assunto ? "border-destructive" : ""}
              />
              {errors.assunto && (
                <p className="text-xs text-destructive">{errors.assunto}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensagem">
                Mensagem <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="mensagem"
                rows={5}
                value={formData.mensagem}
                onChange={(e) => handleChange("mensagem", e.target.value)}
                className={errors.mensagem ? "border-destructive" : ""}
              />
              {errors.mensagem && (
                <p className="text-xs text-destructive">{errors.mensagem}</p>
              )}
            </div>

            {templateFields.map((field) => {
              const fieldId = field.id ?? field.key;
              return (
                <TemplateFieldRenderer
                  key={fieldId}
                  field={field}
                  value={dadosExtras[fieldId]}
                  onChange={(v) => handleDynamicChange(fieldId, v)}
                  error={errors[fieldId]}
                />
              );
            })}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Enviando..." : "Enviar Chamado"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
