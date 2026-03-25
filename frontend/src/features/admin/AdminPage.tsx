import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import { TicketManagement } from "./components/TicketManagement";
import { TemplateEditor } from "./components/TemplateEditor";
import { DepartmentPickerCards } from "@/features/tickets/components/DepartmentPickerCards";
import { UsersPage } from "@/features/users/UsersPage";
import { useAuth } from "@/contexts/AuthContext";
import {
  canEditTemplateForDepartment,
  getDepartamentosComEdicaoTemplate,
} from "./utils/templateDepartamentosEditaveis";

export function AdminPage() {
  const location = useLocation();
  const { permissions, templateDepartamentos, departamento: userDepartamento, meLoaded } = useAuth();
  const initialTicketId = (location.state as { ticketId?: string })?.ticketId;
  const [templateDepartamento, setTemplateDepartamento] = useState("");
  const [tab, setTab] = useState(0);

  const departamentosComEdicao = useMemo(
    () => getDepartamentosComEdicaoTemplate(permissions, templateDepartamentos, userDepartamento),
    [permissions, templateDepartamentos, userDepartamento]
  );

  const explicitTemplateSet = useMemo(
    () => new Set((templateDepartamentos || []).map((d) => (d || "").trim().toUpperCase())),
    [templateDepartamentos]
  );

  const canEditTemplate =
    !!templateDepartamento &&
    (explicitTemplateSet.has(templateDepartamento.trim().toUpperCase()) ||
      canEditTemplateForDepartment(permissions, userDepartamento, templateDepartamento));

  useEffect(() => {
    if (meLoaded && departamentosComEdicao.length === 1) {
      const only = departamentosComEdicao[0];
      setTemplateDepartamento((prev) => (prev === only ? prev : only));
    }
  }, [meLoaded, departamentosComEdicao]);

  useEffect(() => {
    if (!meLoaded || departamentosComEdicao.length <= 1) return;
    if (!templateDepartamento) setTemplateDepartamento(departamentosComEdicao[0]);
  }, [meLoaded, departamentosComEdicao, templateDepartamento]);

  useEffect(() => {
    if (
      meLoaded &&
      templateDepartamento &&
      departamentosComEdicao.length > 0 &&
      !departamentosComEdicao.includes(templateDepartamento)
    ) {
      setTemplateDepartamento(departamentosComEdicao[0] ?? "");
    }
  }, [meLoaded, templateDepartamento, departamentosComEdicao]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 0.25 }}>
          Painel Administrativo
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gerencie chamados, templates e usuarios.
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ borderBottom: 1, borderColor: "divider" }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab label="Chamados" />
        <Tab label="Templates" />
        <Tab label="Usuarios" />
      </Tabs>

      {tab === 0 && <TicketManagement initialTicketId={initialTicketId} />}

      {tab === 1 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {departamentosComEdicao.length > 0 ? (
            <Card sx={{ borderRadius: 1 }}>
              <CardContent>
                <DepartmentPickerCards
                  idPrefix="template-admin"
                  ariaGroupLabel="Departamentos com permissão de template"
                  selectedArea={templateDepartamento}
                  allowedDepartamentos={departamentosComEdicao}
                  onSelect={(area) => setTemplateDepartamento(area)}
                />
              </CardContent>
            </Card>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Você não tem permissão para editar templates de nenhum departamento.
            </Typography>
          )}
          <TemplateEditor departamento={templateDepartamento} canEdit={canEditTemplate} />
        </Box>
      )}

      {tab === 2 && <UsersPage />}
    </Box>
  );
}
