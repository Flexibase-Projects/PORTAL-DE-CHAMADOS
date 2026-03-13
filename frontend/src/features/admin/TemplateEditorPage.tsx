import { useState, useMemo, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { TemplateEditor } from "./components/TemplateEditor";
import { getAllDepartamentos } from "@/constants/departamentos";
import { useAuth } from "@/contexts/AuthContext";

function canEditTemplateForDepartment(
  permissions: Record<string, string>,
  userDepartamento: string | null,
  departamento: string
): boolean {
  const d = departamento.trim();
  if (!d) return false;
  if (permissions[d] === "view_edit") return true;
  if (userDepartamento && userDepartamento.trim() === d) return true;
  return false;
}

export function TemplateEditorPage() {
  const { permissions, departamento: userDepartamento, meLoaded } = useAuth();
  const [departamento, setDepartamento] = useState("");

  const allDepartamentos = getAllDepartamentos();
  const departamentosComEdicao = useMemo(
    () => allDepartamentos.filter((d) => canEditTemplateForDepartment(permissions, userDepartamento, d)),
    [permissions, userDepartamento]
  );
  const canEdit = !!departamento && canEditTemplateForDepartment(permissions, userDepartamento, departamento);

  useEffect(() => {
    if (meLoaded && departamento && departamentosComEdicao.length > 0 && !departamentosComEdicao.includes(departamento)) {
      setDepartamento("");
    }
  }, [meLoaded, departamento, departamentosComEdicao]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 0.25 }}>
          Templates por Departamento
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Edite os campos do formulário de chamado por área. Só é possível editar departamentos em que você tem permissão &quot;Ver e editar&quot;.
        </Typography>
      </Box>
      <FormControl sx={{ minWidth: 200, maxWidth: { xs: "100%", sm: 280 } }}>
        <InputLabel>Departamento</InputLabel>
        <Select
          value={departamento}
          label="Departamento"
          onChange={(e) => setDepartamento(e.target.value)}
        >
          {departamentosComEdicao.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {departamentosComEdicao.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Você não tem permissão de edição para nenhum departamento. Peça a um administrador (TI) para conceder &quot;Ver e editar&quot; no departamento desejado.
        </Typography>
      )}
      <TemplateEditor departamento={departamento} canEdit={canEdit} />
    </Box>
  );
}
