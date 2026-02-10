import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  BookOpen,
  Search,
  Monitor,
  Users,
  DollarSign,
  Settings,
  Folder,
  Briefcase,
  Building2,
  Factory,
} from "lucide-react";
import { kbService } from "@/services/kbService";
import type { KBCategory, KBArticle } from "@/types/knowledge-base";

const ICON_MAP: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  monitor: Monitor,
  users: Users,
  "dollar-sign": DollarSign,
  settings: Settings,
  folder: Folder,
  briefcase: Briefcase,
  building: Building2,
  factory: Factory,
};

function CategoryIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] || Folder;
  return <Icon style={{ width: 24, height: 24 }} />;
}

export function KnowledgeBasePage() {
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [selectedCat, setSelectedCat] = useState<KBCategory | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [articleDialog, setArticleDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);
  const [articleForm, setArticleForm] = useState({
    titulo: "",
    conteudo: "",
    categoria_id: "",
    publicado: true,
  });

  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<KBCategory | null>(null);
  const [catForm, setCatForm] = useState({ nome: "", descricao: "", icone: "folder" });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCat) loadArticles(selectedCat.id);
    else loadArticles();
  }, [selectedCat]);

  const loadCategories = async () => {
    try {
      const res = await kbService.getCategories();
      if (res.success) setCategories(res.categories);
    } catch {
      setError("Erro ao carregar categorias.");
    }
  };

  const loadArticles = async (catId?: string) => {
    setLoading(true);
    try {
      const res = await kbService.getArticles(catId);
      if (res.success) setArticles(res.articles);
    } catch {
      setError("Erro ao carregar artigos.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!catForm.nome.trim()) return;
    setSaving(true);
    try {
      if (editingCat) {
        await kbService.updateCategory(editingCat.id, catForm);
        setSuccess("Categoria atualizada!");
      } else {
        await kbService.createCategory(catForm);
        setSuccess("Categoria criada!");
      }
      setCatDialog(false);
      await loadCategories();
    } catch {
      setError("Erro ao salvar categoria.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Excluir esta categoria e todos seus artigos?")) return;
    try {
      await kbService.deleteCategory(id);
      setSuccess("Categoria excluída!");
      if (selectedCat?.id === id) setSelectedCat(null);
      await loadCategories();
    } catch {
      setError("Erro ao excluir categoria.");
    }
  };

  const handleOpenCreateArticle = () => {
    setEditingArticle(null);
    setArticleForm({
      titulo: "",
      conteudo: "",
      categoria_id: selectedCat?.id || "",
      publicado: true,
    });
    setArticleDialog(true);
  };

  const handleOpenEditArticle = (article: KBArticle) => {
    setEditingArticle(article);
    setArticleForm({
      titulo: article.titulo,
      conteudo: article.conteudo,
      categoria_id: article.categoria_id,
      publicado: article.publicado,
    });
    setArticleDialog(true);
  };

  const handleSaveArticle = async () => {
    if (!articleForm.titulo.trim() || !articleForm.conteudo.trim() || !articleForm.categoria_id) return;
    setSaving(true);
    try {
      if (editingArticle) {
        await kbService.updateArticle(editingArticle.id, articleForm);
        setSuccess("Artigo atualizado!");
      } else {
        await kbService.createArticle(articleForm);
        setSuccess("Artigo criado!");
      }
      setArticleDialog(false);
      await loadArticles(selectedCat?.id);
    } catch {
      setError("Erro ao salvar artigo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Excluir este artigo?")) return;
    try {
      await kbService.deleteArticle(id);
      setSuccess("Artigo excluído!");
      if (selectedArticle?.id === id) setSelectedArticle(null);
      await loadArticles(selectedCat?.id);
    } catch {
      setError("Erro ao excluir artigo.");
    }
  };

  const filtered = articles.filter(
    (a) =>
      a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.conteudo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedArticle) {
    return (
      <Box sx={{ maxWidth: 672, mx: "auto", width: "100%" }}>
        <Button startIcon={<ArrowLeft style={{ width: 16, height: 16 }} />} onClick={() => setSelectedArticle(null)} sx={{ mb: 2 }}>
          Voltar
        </Button>
        <Typography variant="h5" gutterBottom>
          {selectedArticle.titulo}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Chip label={selectedArticle.publicado ? "Publicado" : "Rascunho"} size="small" color={selectedArticle.publicado ? "default" : "default"} variant={selectedArticle.publicado ? "filled" : "outlined"} />
          {selectedArticle.categoria_nome && (
            <Chip label={selectedArticle.categoria_nome} size="small" variant="outlined" />
          )}
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {selectedArticle.conteudo}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>}

      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: "flex-start", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 0.25 }}>
            Base de Conhecimento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Artigos, tutoriais e documentacao por area.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Plus style={{ width: 18, height: 18 }} />}
            onClick={() => {
              setEditingCat(null);
              setCatForm({ nome: "", descricao: "", icone: "folder" });
              setCatDialog(true);
            }}
          >
            Categoria
          </Button>
          <Button variant="contained" startIcon={<Plus style={{ width: 18, height: 18 }} />} onClick={handleOpenCreateArticle}>
            Artigo
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(5, 1fr)" } }}>
        <Card
          variant="outlined"
          sx={{
            cursor: "pointer",
            borderWidth: !selectedCat ? 2 : 1,
            borderColor: !selectedCat ? "primary.main" : "divider",
          }}
          onClick={() => setSelectedCat(null)}
        >
          <CardContent sx={{ py: 2, textAlign: "center" }}>
            <BookOpen style={{ width: 24, height: 24, color: "var(--mui-palette-primary-main)", margin: "0 auto 8px", display: "block" }} />
            <Typography variant="body2" fontWeight={500}>Todos</Typography>
          </CardContent>
        </Card>
        {categories.map((cat) => (
          <Card
            key={cat.id}
            variant="outlined"
            sx={{
              cursor: "pointer",
              borderWidth: selectedCat?.id === cat.id ? 2 : 1,
              borderColor: selectedCat?.id === cat.id ? "primary.main" : "divider",
              position: "relative",
            }}
            onClick={() => setSelectedCat(cat)}
          >
            <CardContent sx={{ py: 2, textAlign: "center" }}>
              <Box sx={{ position: "absolute", top: 4, right: 4, display: "flex", gap: 0 }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCat(cat);
                    setCatForm({ nome: cat.nome, descricao: cat.descricao || "", icone: cat.icone });
                    setCatDialog(true);
                  }}
                >
                  <Pencil style={{ width: 14, height: 14 }} />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(cat.id);
                  }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </IconButton>
              </Box>
              <Box sx={{ color: "primary.main", mb: 0.5 }}>
                <CategoryIcon name={cat.icone} />
              </Box>
              <Typography variant="body2" fontWeight={500}>{cat.nome}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <TextField
        placeholder="Buscar artigos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        size="small"
        sx={{ maxWidth: 320 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search style={{ width: 18, height: 18 }} />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" } }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={160} />
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <BookOpen style={{ width: 48, height: 48, opacity: 0.5, margin: "0 auto 16px", display: "block" }} />
            <Typography color="text.secondary">
              {searchTerm ? "Nenhum artigo encontrado para esta busca." : "Nenhum artigo nesta categoria. Crie o primeiro!"}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" } }}>
          {filtered.map((article) => (
            <Card
              key={article.id}
              variant="outlined"
              sx={{ cursor: "pointer" }}
              onClick={() => setSelectedArticle(article)}
            >
              <CardHeader
                title={article.titulo}
                titleTypographyProps={{ variant: "subtitle2", sx: { lineClamp: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } }}
                action={
                  <Box onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" onClick={() => handleOpenEditArticle(article)}>
                      <Pencil style={{ width: 14, height: 14 }} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteArticle(article.id)}>
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </IconButton>
                  </Box>
                }
              />
              <CardContent sx={{ pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", mb: 1 }}>
                  {article.conteudo}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Chip label={article.publicado ? "Publicado" : "Rascunho"} size="small" variant={article.publicado ? "filled" : "outlined"} />
                  {article.categoria_nome && <Chip label={article.categoria_nome} size="small" variant="outlined" />}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Card sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
        <CardContent sx={{ py: 3 }}>
          <Typography fontWeight={600} gutterBottom>Precisa de mais ajuda?</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
            Se não encontrou o que procurava, crie um novo chamado.
          </Typography>
          <Button variant="contained" href="/criar-chamado" sx={{ bgcolor: "background.paper", color: "primary.main" }}>
            Criar Novo Chamado
          </Button>
        </CardContent>
      </Card>

      <Dialog open={catDialog} onClose={() => setCatDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCat ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Nome"
              value={catForm.nome}
              onChange={(e) => setCatForm((p) => ({ ...p, nome: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label="Descrição"
              multiline
              rows={3}
              value={catForm.descricao}
              onChange={(e) => setCatForm((p) => ({ ...p, descricao: e.target.value }))}
              fullWidth
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Ícone</InputLabel>
              <Select
                value={catForm.icone}
                label="Ícone"
                onChange={(e) => setCatForm((p) => ({ ...p, icone: e.target.value }))}
              >
                {Object.keys(ICON_MAP).map((k) => (
                  <MenuItem key={k} value={k}>{k}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveCategory} disabled={saving} startIcon={saving ? <CircularProgress size={18} /> : null}>
            {editingCat ? "Salvar" : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={articleDialog} onClose={() => setArticleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingArticle ? "Editar Artigo" : "Novo Artigo"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Título *"
                value={articleForm.titulo}
                onChange={(e) => setArticleForm((p) => ({ ...p, titulo: e.target.value }))}
                fullWidth
                size="small"
              />
              <FormControl fullWidth size="small">
                <InputLabel>Categoria *</InputLabel>
                <Select
                  value={articleForm.categoria_id}
                  label="Categoria *"
                  onChange={(e) => setArticleForm((p) => ({ ...p, categoria_id: e.target.value }))}
                >
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Conteúdo *"
              multiline
              rows={12}
              value={articleForm.conteudo}
              onChange={(e) => setArticleForm((p) => ({ ...p, conteudo: e.target.value }))}
              placeholder="Escreva o conteúdo do artigo..."
              fullWidth
              size="small"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={articleForm.publicado}
                  onChange={(_, c) => setArticleForm((p) => ({ ...p, publicado: c }))}
                />
              }
              label="Publicado"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArticleDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveArticle} disabled={saving} startIcon={saving ? <CircularProgress size={18} /> : null}>
            {editingArticle ? "Salvar" : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
