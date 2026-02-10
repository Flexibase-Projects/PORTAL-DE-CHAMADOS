import { useState } from "react";
import { useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { TicketManagement } from "./components/TicketManagement";
import { TemplateEditor } from "./components/TemplateEditor";
import { UsersPage } from "@/features/users/UsersPage";
import { getAllDepartamentos } from "@/constants/departamentos";

export function AdminPage() {
  const location = useLocation();
  const initialTicketId = (location.state as { ticketId?: string })?.ticketId;
  const [templateDepartamento, setTemplateDepartamento] = useState("");
  const [tab, setTab] = useState(0);
  const departamentos = getAllDepartamentos();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Painel Administrativo
        </Typography>
        <Typography color="text.secondary">
          Gerencie chamados, templates e usuários.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Chamados" />
        <Tab label="Templates" />
        <Tab label="Usuários" />
      </Tabs>

      {tab === 0 && <TicketManagement initialTicketId={initialTicketId} />}

      {tab === 1 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl sx={{ minWidth: 220 }} size="small">
            <InputLabel>Departamento</InputLabel>
            <Select
              value={templateDepartamento}
              label="Departamento"
              onChange={(e) => setTemplateDepartamento(e.target.value)}
            >
              {departamentos.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TemplateEditor departamento={templateDepartamento} />
        </Box>
      )}

      {tab === 2 && <UsersPage />}
    </Box>
  );
}
