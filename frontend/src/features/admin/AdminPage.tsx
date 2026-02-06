import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TicketManagement } from "./components/TicketManagement";
import { TemplateEditor } from "./components/TemplateEditor";
import { UsersPage } from "@/features/users/UsersPage";
import { getAllDepartamentos } from "@/constants/departamentos";

export function AdminPage() {
  const location = useLocation();
  const initialTicketId = (location.state as { ticketId?: string })?.ticketId;
  const [templateDepartamento, setTemplateDepartamento] = useState("");
  const departamentos = getAllDepartamentos();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground">
          Gerencie chamados, templates e usuários.
        </p>
      </div>

      <Tabs defaultValue="chamados">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chamados">Chamados</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="chamados" className="mt-4">
          <TicketManagement initialTicketId={initialTicketId} />
        </TabsContent>

        <TabsContent value="templates" className="mt-4 space-y-4">
          <div className="max-w-xs space-y-2">
            <Label>Departamento</Label>
            <Select
              value={templateDepartamento}
              onValueChange={setTemplateDepartamento}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um departamento" />
              </SelectTrigger>
              <SelectContent>
                {departamentos.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TemplateEditor departamento={templateDepartamento} />
        </TabsContent>

        <TabsContent value="usuarios" className="mt-4">
          <UsersPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
