import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, UserX, UserCheck, Loader2 } from "lucide-react";
import { userService } from "@/services/userService";
import { SETORES, DEPARTAMENTOS_POR_SETOR } from "@/constants/departamentos";
import { ROLE_LABELS, ROLE_COLORS } from "@/constants/roles";
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
        setSuccess(
          `Usuário ${res.user.ativo ? "ativado" : "desativado"} com sucesso!`
        );
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

  const getRoleColor = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? ROLE_COLORS[role.nome] || "" : "";
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {users.length} usuário(s) cadastrado(s)
        </p>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Departamento</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.departamento}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getRoleColor(user.role_id)}`}
                    >
                      {getRoleName(user.role_id)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.ativo ? "default" : "secondary"}>
                      {user.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenEdit(user)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleToggleActive(user)}
                      >
                        {user.ativo ? (
                          <UserX className="h-3 w-3 text-destructive" />
                        ) : (
                          <UserCheck className="h-3 w-3 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nome: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Setor *</Label>
                <Select
                  value={form.setor}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, setor: v, departamento: "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {SETORES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Departamento *</Label>
                <Select
                  value={form.departamento}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, departamento: v }))
                  }
                  disabled={!form.setor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(DEPARTAMENTOS_POR_SETOR[form.setor] || []).map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ramal</Label>
                <Input
                  value={form.ramal}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, ramal: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Perfil *</Label>
                <Select
                  value={form.role_id}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, role_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {ROLE_LABELS[r.nome] || r.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingUser ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
