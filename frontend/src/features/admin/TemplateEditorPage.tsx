import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { TemplateEditor } from "./components/TemplateEditor";
import { getAllDepartamentos } from "@/constants/departamentos";

export function TemplateEditorPage() {
  const [departamento, setDepartamento] = useState("");

  const departamentos = getAllDepartamentos();

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
      <FormControl sx={{ minWidth: 200, maxWidth: { xs: "100%", sm: 280 } }}>
        <InputLabel>Departamento</InputLabel>
        <Select
          value={departamento}
          label="Departamento"
          onChange={(e) => setDepartamento(e.target.value)}
        >
          {departamentos.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TemplateEditor departamento={departamento} />
    </Box>
  );
}
