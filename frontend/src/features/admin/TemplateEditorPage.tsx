import { useState, useMemo, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { TemplateEditor } from "./components/TemplateEditor";
import { DepartmentPickerCards } from "@/features/tickets/components/DepartmentPickerCards";
import { useAuth } from "@/contexts/AuthContext";
import {
  canEditTemplateForDepartment,
  getDepartamentosComEdicaoTemplate,
} from "./utils/templateDepartamentosEditaveis";

export function TemplateEditorPage() {
  const { permissions, templateDepartamentos, departamento: userDepartamento, meLoaded } = useAuth();
  const [departamento, setDepartamento] = useState("");

  const departamentosComEdicao = useMemo(
    () => getDepartamentosComEdicaoTemplate(permissions, templateDepartamentos, userDepartamento),
    [permissions, templateDepartamentos, userDepartamento]
  );

  const explicitTemplateSet = useMemo(
    () => new Set((templateDepartamentos || []).map((d) => (d || "").trim().toUpperCase())),
    [templateDepartamentos]
  );

  const canEdit =
    !!departamento &&
    (explicitTemplateSet.has(departamento.trim().toUpperCase()) ||
      canEditTemplateForDepartment(permissions, userDepartamento, departamento));

  useEffect(() => {
    if (meLoaded && departamento && departamentosComEdicao.length > 0 && !departamentosComEdicao.includes(departamento)) {
      setDepartamento("");
    }
  }, [meLoaded, departamento, departamentosComEdicao]);

  useEffect(() => {
    if (!meLoaded || departamentosComEdicao.length !== 1) return;
    const only = departamentosComEdicao[0];
    setDepartamento((prev) => (prev === only ? prev : only));
  }, [meLoaded, departamentosComEdicao]);

  useEffect(() => {
    if (!meLoaded || departamentosComEdicao.length <= 1) return;
    if (!departamento) setDepartamento(departamentosComEdicao[0]);
  }, [meLoaded, departamentosComEdicao, departamento]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 0.25 }}>
          Templates por Departamento
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Edite os campos do formulário de chamado por área.
        </Typography>
      </Box>

      {departamentosComEdicao.length > 0 && (
        <Card sx={{ borderRadius: 1 }}>
          <CardContent>
            <DepartmentPickerCards
              idPrefix="template-editor"
              ariaGroupLabel="Departamentos com permissão de template"
              selectedArea={departamento}
              allowedDepartamentos={departamentosComEdicao}
              onSelect={(area) => setDepartamento(area)}
            />
          </CardContent>
        </Card>
      )}

      {departamentosComEdicao.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Você não tem permissão de edição para nenhum departamento. Peça a um administrador (TI) para conceder
          &quot;Ver e editar&quot; ou &quot;Manipular templates&quot; no departamento desejado.
        </Typography>
      )}

      <TemplateEditor departamento={departamento} canEdit={canEdit} />
    </Box>
  );
}
