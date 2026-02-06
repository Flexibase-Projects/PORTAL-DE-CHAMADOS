export interface KBCategory {
  id: string;
  nome: string;
  descricao?: string;
  icone: string;
  ordem: number;
  created_at: string;
  article_count?: number;
}

export interface KBArticle {
  id: string;
  categoria_id: string;
  categoria_nome?: string;
  titulo: string;
  conteudo: string;
  autor_id?: string;
  autor_nome?: string;
  publicado: boolean;
  created_at: string;
  updated_at: string;
}
