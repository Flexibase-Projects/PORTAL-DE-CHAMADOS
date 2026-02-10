import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import CircularProgress from "@mui/material/CircularProgress";
import { Save } from "lucide-react";
import { permissionService, type AuthUserListItem, type PermissaoTipo } from "@/services/permissionService";
import { getAllDepartamentos } from "@/constants/departamentos";

const PERMISSAO_LABELS: Record<PermissaoTipo, string> = {
  view: "Ver",
  view_edit: "Ver e editar",
};

export function PermissionsPage() {
  const [users, setUsers] = useState<AuthUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<AuthUserListItem | null>(null);
  const [perms, setPerms] = useState<Record<string, PermissaoTipo>>({});
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadPermsLoading, setLoadPermsLoading] = useState(false);

  const departamentos = getAllDepartamentos();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await permissionService.listAuthUsers();
      if (res.success) setUsers(res.users || []);
      else setError("Não foi possível carregar usuários.");
    } catch {
      setError("Erro ao carregar lista de usuários do Auth. Configure SUPABASE_SERVICE_ROLE_KEY no backend para listar usuários.");
    } finally {
      setLoading(false);
    }
  };

  const openUserPerms = async (user: AuthUserListItem) => {
    setSelectedUser(user);
    setDialogOpen(true);
    setLoadPermsLoading(true);
    setPerms({});
    try {
      const res = await permissionService.getByAuthUserId(user.id);
      if (res.success) setPerms(res.permissions || {});
    } catch {
      setPerms({});
    } finally {
      setLoadPermsLoading(false);
    }
  };

  const handlePermChange = (departamento: string, value: PermissaoTipo | "") => {
    if (!value) {
      const next = { ...perms };
      delete next[departamento];
      setPerms(next);
    } else {
      setPerms((p) => ({ ...p, [departamento]: value }));
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setError("");
    try {
      const res = await permissionService.setForAuthUser(selectedUser.id, perms);
      if (res.success) {
        setPerms(res.permissions || {});
        setDialogOpen(false);
      }
    } catch {
      setError("Erro ao salvar permissões.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 0.25 }}>
          Permissões por usuário
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Defina para cada usuário (Supabase Auth) as permissões por departamento: Ver ou Ver e editar chamados da área.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Usuários do Supabase Auth
          </Typography>
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="rounded" height={48} />
              ))}
            </Box>
          ) : users.length === 0 ? (
            <Alert severity="info">
              Nenhum usuário encontrado. Crie usuários no Supabase Auth (Dashboard → Authentication → Users) e
              configure SUPABASE_SERVICE_ROLE_KEY no backend para listar aqui.
            </Alert>
          ) : (
            <List dense disablePadding>
              {users.map((u) => (
                <ListItem key={u.id} disablePadding>
                  <ListItemButton onClick={() => openUserPerms(u)}>
                    <ListItemText
                      primary={u.nome || u.email || u.id}
                      secondary={u.email}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Permissões — {selectedUser?.nome || selectedUser?.email || "Usuário"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Por departamento: sem permissão = não vê chamados da área. &quot;Ver&quot; = só visualizar; &quot;Ver e editar&quot; = pode
            alterar status e responder.
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
                    value={perms[dept] ?? ""}
                    label={dept}
                    onChange={(e) => handlePermChange(dept, (e.target.value as PermissaoTipo) || "")}
                  >
                    <MenuItem value="">Sem permissão</MenuItem>
                    <MenuItem value="view">{PERMISSAO_LABELS.view}</MenuItem>
                    <MenuItem value="view_edit">{PERMISSAO_LABELS.view_edit}</MenuItem>
                  </Select>
                </FormControl>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <Save size={16} />}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
