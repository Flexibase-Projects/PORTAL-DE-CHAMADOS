import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { Plus, Pencil, UserX, UserCheck } from "lucide-react";
import { userService } from "@/services/userService";
import { SETORES, DEPARTAMENTOS_POR_SETOR } from "@/constants/departamentos";
import { ROLE_LABELS } from "@/constants/roles";
import type { User, Role } from "@/types/user";

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    nome: "",
    email: "",
    setor: "",
    departamento: "",
    ramal: "",
    role_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userService.getAll(),
        userService.getRoles(),
      ]);
      if (usersRes.success) setUsers(usersRes.users);
      if (rolesRes.success) setRoles(rolesRes.roles);
    } catch {
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setForm({
      nome: "",
      email: "",
      setor: "",
      departamento: "",
      ramal: "",
      role_id: roles.find((r) => r.nome === "usuario")?.id || "",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      nome: user.nome,
      email: user.email,
      setor: user.setor,
      departamento: user.departamento,
      ramal: user.ramal || "",
      role_id: user.role_id,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome || !form.email || !form.setor || !form.departamento || !form.role_id) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editingUser) {
        const res = await userService.update(editingUser.id, form);
        if (res.success) {
          setSuccess("Usuário atualizado!");
          setDialogOpen(false);
          await loadData();
        }
      } else {
        const res = await userService.create(form);
        if (res.success) {
          setSuccess("Usuário criado!");
          setDialogOpen(false);
          await loadData();
        }
      }
    } catch {
      setError("Erro ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const res = await userService.toggleActive(user.id);
      if (res.success) {
        setSuccess(`Usuário ${res.user.ativo ? "ativado" : "desativado"} com sucesso!`);
        await loadData();
      }
    } catch {
      setError("Erro ao alterar status do usuário.");
    }
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? ROLE_LABELS[role.nome] || role.nome : "—";
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rounded" height={48} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {users.length} usuário(s) cadastrado(s)
        </Typography>
        <Button variant="contained" startIcon={<Plus style={{ width: 18, height: 18 }} />} onClick={handleOpenCreate}>
          Novo Usuário
        </Button>
      </Box>

      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, overflow: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Email</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Departamento</TableCell>
              <TableCell>Perfil</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right" sx={{ width: 100 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }} color="text.secondary">
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell fontWeight={500}>{user.nome}</TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }} color="text.secondary">
                    {user.email}
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{user.departamento}</TableCell>
                  <TableCell>
                    <Chip label={getRoleName(user.role_id)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.ativo ? "Ativo" : "Inativo"}
                      size="small"
                      color={user.ativo ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEdit(user)}>
                      <Pencil style={{ width: 16, height: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleToggleActive(user)}>
                      {user.ativo ? (
                        <UserX style={{ width: 16, height: 16 }} color="inherit" />
                      ) : (
                        <UserCheck style={{ width: 16, height: 16 }} color="success" />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Nome *"
                size="small"
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Email *"
                type="email"
                size="small"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                fullWidth
              />
              <FormControl fullWidth size="small">
                <InputLabel>Setor *</InputLabel>
                <Select
                  value={form.setor}
                  label="Setor *"
                  onChange={(e) => setForm((p) => ({ ...p, setor: e.target.value, departamento: "" }))}
                >
                  {SETORES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" disabled={!form.setor}>
                <InputLabel>Departamento *</InputLabel>
                <Select
                  value={form.departamento}
                  label="Departamento *"
                  onChange={(e) => setForm((p) => ({ ...p, departamento: e.target.value }))}
                >
                  {(DEPARTAMENTOS_POR_SETOR[form.setor] || []).map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Ramal"
                size="small"
                value={form.ramal}
                onChange={(e) => setForm((p) => ({ ...p, ramal: e.target.value }))}
                fullWidth
              />
              <FormControl fullWidth size="small">
                <InputLabel>Perfil *</InputLabel>
                <Select
                  value={form.role_id}
                  label="Perfil *"
                  onChange={(e) => setForm((p) => ({ ...p, role_id: e.target.value }))}
                >
                  {roles.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {ROLE_LABELS[r.nome] || r.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={18} /> : null}>
            {saving ? "Salvando..." : editingUser ? "Salvar" : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
