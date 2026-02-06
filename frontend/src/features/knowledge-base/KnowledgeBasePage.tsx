import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  BookOpen,
  Loader2,
  Search,
  Monitor,
  Users,
  DollarSign,
  Settings,
  Folder,
} from "lucide-react";
import { kbService } from "@/services/kbService";
import type { KBCategory, KBArticle } from "@/types/knowledge-base";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  monitor: Monitor,
  users: Users,
  "dollar-sign": DollarSign,
  settings: Settings,
  folder: Folder,
};

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Folder;
  return <Icon className={className} />;
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

  // Article dialog
  const [articleDialog, setArticleDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);
  const [articleForm, setArticleForm] = useState({
    titulo: "",
    conteudo: "",
    categoria_id: "",
    publicado: true,
  });

  // Category dialog
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<KBCategory | null>(null);
  const [catForm, setCatForm] = useState({ nome: "", descricao: "", icone: "folder" });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCat) {
      loadArticles(selectedCat.id);
    } else {
      loadArticles();
    }
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

  // Category CRUD
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

  // Article CRUD
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
    if (!articleForm.titulo.trim() || !articleForm.conteudo.trim() || !articleForm.categoria_id)
      return;
    setSaving(true);
    try {
      if (editingArticle) {
        const res = await kbService.updateArticle(editingArticle.id, articleForm);
        if (res.success) setSuccess("Artigo atualizado!");
      } else {
        const res = await kbService.createArticle(articleForm);
        if (res.success) setSuccess("Artigo criado!");
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

  // Article view
  if (selectedArticle) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => setSelectedArticle(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <article>
          <h1 className="text-2xl font-bold mb-2">{selectedArticle.titulo}</h1>
          <div className="flex gap-2 mb-4">
            <Badge variant={selectedArticle.publicado ? "default" : "secondary"}>
              {selectedArticle.publicado ? "Publicado" : "Rascunho"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {selectedArticle.categoria_nome}
            </span>
          </div>
          <Separator className="mb-4" />
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
            {selectedArticle.conteudo}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Base de Conhecimento
          </h1>
          <p className="text-muted-foreground">
            Artigos, tutoriais e documentação por área.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingCat(null);
              setCatForm({ nome: "", descricao: "", icone: "folder" });
              setCatDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Categoria
          </Button>
          <Button onClick={handleOpenCreateArticle}>
            <Plus className="h-4 w-4 mr-2" />
            Artigo
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            !selectedCat ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setSelectedCat(null)}
        >
          <CardContent className="p-4 flex flex-col items-center text-center">
            <BookOpen className="h-6 w-6 mb-2 text-primary" />
            <p className="text-sm font-medium">Todos</p>
          </CardContent>
        </Card>
        {categories.map((cat) => (
          <Card
            key={cat.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedCat?.id === cat.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedCat(cat)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center relative">
              <div className="absolute top-1 right-1 flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCat(cat);
                    setCatForm({
                      nome: cat.nome,
                      descricao: cat.descricao || "",
                      icone: cat.icone,
                    });
                    setCatDialog(true);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(cat.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <CategoryIcon name={cat.icone} className="h-6 w-6 mb-2 text-primary" />
              <p className="text-sm font-medium">{cat.nome}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar artigos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Articles */}
      {loading ? (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm
                ? "Nenhum artigo encontrado para esta busca."
                : "Nenhum artigo nesta categoria. Crie o primeiro!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <Card
              key={article.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => setSelectedArticle(article)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm line-clamp-2">
                    {article.titulo}
                  </CardTitle>
                  <div className="flex gap-0.5 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditArticle(article);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteArticle(article.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                  {article.conteudo}
                </p>
                <div className="flex gap-2">
                  <Badge variant={article.publicado ? "default" : "secondary"} className="text-xs">
                    {article.publicado ? "Publicado" : "Rascunho"}
                  </Badge>
                  {article.categoria_nome && (
                    <Badge variant="outline" className="text-xs">
                      {article.categoria_nome}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="py-6">
          <h3 className="font-semibold mb-1">Precisa de mais ajuda?</h3>
          <p className="text-sm opacity-80 mb-3">
            Se não encontrou o que procurava, crie um novo chamado.
          </p>
          <Button variant="secondary" asChild>
            <a href="/criar-chamado">Criar Novo Chamado</a>
          </Button>
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCat ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={catForm.nome}
                onChange={(e) =>
                  setCatForm((p) => ({ ...p, nome: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={catForm.descricao}
                onChange={(e) =>
                  setCatForm((p) => ({ ...p, descricao: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Select
                value={catForm.icone}
                onValueChange={(v) =>
                  setCatForm((p) => ({ ...p, icone: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ICON_MAP).map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCat ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Article Dialog */}
      <Dialog open={articleDialog} onOpenChange={setArticleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? "Editar Artigo" : "Novo Artigo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={articleForm.titulo}
                  onChange={(e) =>
                    setArticleForm((p) => ({ ...p, titulo: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select
                  value={articleForm.categoria_id}
                  onValueChange={(v) =>
                    setArticleForm((p) => ({ ...p, categoria_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conteúdo *</Label>
              <Textarea
                value={articleForm.conteudo}
                onChange={(e) =>
                  setArticleForm((p) => ({ ...p, conteudo: e.target.value }))
                }
                rows={12}
                placeholder="Escreva o conteúdo do artigo..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArticleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveArticle} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingArticle ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
