import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { Shield } from "lucide-react";
import { permissionService, type AuthUserListItem, type PermissaoTipo } from "@/services/permissionService";
import { getAllDepartamentos } from "@/constants/departamentos";
import { useAuth } from "@/contexts/AuthContext";

type TicketPermissao = Exclude<PermissaoTipo, "manage_templates">;

const PERMISSAO_LABELS: Record<TicketPermissao, string> = {
  view: "Ver",
  view_edit: "Ver e editar",
};

export function UsersPage() {
  const { refreshMe } = useAuth();
  const [users, setUsers] = useState<AuthUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUser, setSelectedUser] = useState<AuthUserListItem | null>(null);
  const [ticketPerms, setTicketPerms] = useState<Record<string, TicketPermissao>>({});
  const [templatePerms, setTemplatePerms] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadPermsLoading, setLoadPermsLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savingDeptAuthId, setSavingDeptAuthId] = useState<string | null>(null);

  const departamentos = getAllDepartamentos();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const res = await permissionService.listAuthUsers();
      if (res.success) setUsers(res.users || []);
      else if (!silent) setError("Não foi possível carregar usuários.");
    } catch (err: unknown) {
      if (silent) return;
      const ax = err as { response?: { data?: { error?: string }; status?: number }; message?: string };
      const msg =
        ax?.response?.data?.error ||
        (ax?.response?.status === 500
          ? "Backend retornou erro. Verifique o terminal do backend e defina SUPABASE_SERVICE_ROLE_KEY no .env ou .env.local do backend."
          : ax?.message ||
            "Erro ao carregar usuários. Verifique se o backend está rodando e se SUPABASE_SERVICE_ROLE_KEY está no .env ou .env.local do backend.");
      setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const openPermissions = async (user: AuthUserListItem) => {
    setSelectedUser(user);
    setDialogOpen(true);
    setSaveError("");
    setLoadPermsLoading(true);
    setTicketPerms({});
    setTemplatePerms({});
    try {
      const res = await permissionService.getByAuthUserId(user.id);
      if (res.success) {
        const nextTicketPerms: Record<string, TicketPermissao> = {};
        const nextTemplatePerms: Record<string, boolean> = {};
        for (const [dept, perm] of Object.entries(res.permissions || {})) {
          if (perm === "manage_templates") nextTemplatePerms[dept] = true;
          if (perm === "view" || perm === "view_edit") nextTicketPerms[dept] = perm;
        }
        (res.templateDepartamentos || []).forEach((dept) => {
          if (dept?.trim()) nextTemplatePerms[dept.trim()] = true;
        });
        setTicketPerms(nextTicketPerms);
        setTemplatePerms(nextTemplatePerms);
      }
    } catch {
      setTicketPerms({});
      setTemplatePerms({});
    } finally {
      setLoadPermsLoading(false);
    }
  };

  const handlePermChange = (departamento: string, value: TicketPermissao | "") => {
    if (!value) {
      const next = { ...ticketPerms };
      delete next[departamento];
      setTicketPerms(next);
    } else {
      setTicketPerms((p) => ({ ...p, [departamento]: value }));
    }
  };

  const handleTemplatePermToggle = (departamento: string, checked: boolean) => {
    setTemplatePerms((prev) => ({ ...prev, [departamento]: checked }));
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setSaveError("");
    setError("");
    setSuccess("");
    try {
      const departamentosPayload: Record<string, PermissaoTipo> = { ...ticketPerms };
      for (const dept of departamentos) {
        const hasTicketPerm = !!ticketPerms[dept];
        const canManageTemplate = !!templatePerms[dept];
        if (!hasTicketPerm && canManageTemplate) {
          departamentosPayload[dept] = "manage_templates";
        }
      }
      const res = await permissionService.setForAuthUser(selectedUser.id, {
        departamentos: departamentosPayload,
        templateDepartamentos: departamentos.filter((dept) => !!templatePerms[dept]),
      });
      if (res.success) {
        const nextTicketPerms: Record<string, TicketPermissao> = {};
        const nextTemplatePerms: Record<string, boolean> = {};
        for (const [dept, perm] of Object.entries(res.permissions || {})) {
          if (perm === "manage_templates") nextTemplatePerms[dept] = true;
          if (perm === "view" || perm === "view_edit") nextTicketPerms[dept] = perm;
        }
        (res.templateDepartamentos || []).forEach((dept) => {
          if (dept?.trim()) nextTemplatePerms[dept.trim()] = true;
        });
        setTicketPerms(nextTicketPerms);
        setTemplatePerms(nextTemplatePerms);
        setSuccess("Permissões salvas com sucesso.");
        setDialogOpen(false);
        // Atualiza contexto global para refletir permissões na tela de Templates sem F5.
        await refreshMe();
        // Evita bloquear UX com recarga completa (listAuthUsers pode ser lenta em bases grandes).
        // Recarrega silenciosamente em segundo plano para manter dados atuais.
        void loadUsers(true);
      } else {
        setSaveError("Não foi possível salvar. Tente novamente.");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err as Error)?.message ||
        "Erro ao salvar permissões. Verifique se a tabela PDC_user_permissions existe e se o backend tem acesso ao Supabase.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDepartamentoChange = async (user: AuthUserListItem, newDept: string | null) => {
    setSavingDeptAuthId(user.id);
    setError("");
    setSuccess("");
    try {
      const res = await permissionService.setUserDepartamento(user.id, newDept || null);
      if (res.success) {
        setSuccess("Departamento atualizado.");
        await refreshMe();
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, departamento: res.userDepartamento ?? null } : u))
        );
      } else {
        setError("Não foi possível atualizar o departamento.");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err as Error)?.message ||
        "Erro ao atualizar departamento.";
      setError(msg);
    } finally {
      setSavingDeptAuthId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rounded" height={48} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 0.25 }}>
          Usuários
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Usuários do Supabase Auth. Defina o departamento do usuário na coluna &quot;Departamento&quot;. Use &quot;Permissões&quot; para conceder acesso a outros departamentos (Ver ou Ver e editar).
        </Typography>
      </Box>

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

      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {users.length === 0 && !error ? (
            <Alert severity="info" sx={{ m: 2 }}>
              Nenhum usuário encontrado. Crie usuários no Supabase Auth (Authentication → Users → Add user) e
              adicione SUPABASE_SERVICE_ROLE_KEY no .env.local do backend para listar aqui.
            </Alert>
          ) : users.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Não foi possível carregar a lista. Corrija o erro acima e recarregue a página.
              </Typography>
            </Box>
          ) : (
            <Table size="small" sx={{ minWidth: 360 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nome / Identificação</TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Email</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Departamento</TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell fontWeight={500}>{u.nome || u.email || u.id}</TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }} color="text.secondary">
                      {u.email ?? "—"}
                    </TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                      {savingDeptAuthId === u.id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Select
                          size="small"
                          value={u.departamento ?? ""}
                          displayEmpty
                          onChange={(e) => handleDepartamentoChange(u, (e.target.value as string) || null)}
                          sx={{ minWidth: 140, fontSize: "0.875rem" }}
                        >
                          <MenuItem value="">—</MenuItem>
                          {departamentos.map((d) => (
                            <MenuItem key={d} value={d}>
                              {d}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Shield style={{ width: 16, height: 16 }} />}
                        onClick={() => openPermissions(u)}
                      >
                        Permissões
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setSaveError(""); }} maxWidth="sm" fullWidth>
        <DialogTitle>Permissões — {selectedUser?.nome || selectedUser?.email || "Usuário"}</DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity="error" onClose={() => setSaveError("")} sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Defina em quais departamentos este usuário pode atuar. Sem permissão = não vê chamados;
            &quot;Ver&quot; = só visualizar; &quot;Ver e editar&quot; = pode alterar status e responder;
            para templates, use o controle abaixo de cada departamento.
          </Typography>
          {loadPermsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {departamentos.map((dept) => (
                <FormControl key={dept} size="small" fullWidth>
                  <InputLabel>{dept}</InputLabel>
                  <Select
                    value={ticketPerms[dept] ?? ""}
                    label={dept}
                    onChange={(e) => handlePermChange(dept, (e.target.value as TicketPermissao) || "")}
                  >
                    <MenuItem value="">Sem permissão</MenuItem>
                    <MenuItem value="view">{PERMISSAO_LABELS.view}</MenuItem>
                    <MenuItem value="view_edit">{PERMISSAO_LABELS.view_edit}</MenuItem>
                  </Select>
                  <FormControlLabel
                    sx={{ mt: 0.5, ml: 0.5 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={!!templatePerms[dept] || ticketPerms[dept] === "view_edit"}
                        onChange={(e) => handleTemplatePermToggle(dept, e.target.checked)}
                        disabled={ticketPerms[dept] === "view_edit"}
                      />
                    }
                    label={
                      ticketPerms[dept] === "view_edit"
                        ? "Template: já permitido por 'Ver e editar'"
                        : "Permitir manipular templates"
                    }
                  />
                </FormControl>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSavePermissions}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <Shield size={16} />}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
