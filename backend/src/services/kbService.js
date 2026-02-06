import supabase from '../config/supabase.js';

export const kbService = {
  // Categories
  async getCategories() {
    const { data, error } = await supabase
      .from('PDC_kb_categories')
      .select('*')
      .order('ordem');

    if (error) throw new Error(error.message);

    // Count articles per category
    const { data: articles } = await supabase
      .from('PDC_kb_articles')
      .select('categoria_id');

    const counts = {};
    (articles || []).forEach(a => {
      counts[a.categoria_id] = (counts[a.categoria_id] || 0) + 1;
    });

    return (data || []).map(c => ({
      ...c,
      article_count: counts[c.id] || 0,
    }));
  },

  async createCategory(catData) {
    const { data, error } = await supabase
      .from('PDC_kb_categories')
      .insert({
        nome: catData.nome,
        descricao: catData.descricao || null,
        icone: catData.icone || 'folder',
        ordem: catData.ordem || 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateCategory(id, catData) {
    const { data, error } = await supabase
      .from('PDC_kb_categories')
      .update({
        nome: catData.nome,
        descricao: catData.descricao || null,
        icone: catData.icone || 'folder',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteCategory(id) {
    const { error } = await supabase
      .from('PDC_kb_categories')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  },

  // Articles
  async getArticles(categoriaId) {
    let query = supabase
      .from('PDC_kb_articles')
      .select(`*, categoria:PDC_kb_categories!categoria_id(nome)`)
      .order('created_at', { ascending: false });

    if (categoriaId) {
      query = query.eq('categoria_id', categoriaId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map(a => ({
      ...a,
      categoria_nome: a.categoria?.nome,
    }));
  },

  async getArticleById(id) {
    const { data, error } = await supabase
      .from('PDC_kb_articles')
      .select(`*, categoria:PDC_kb_categories!categoria_id(nome)`)
      .eq('id', id)
      .single();

    if (error) return null;
    return {
      ...data,
      categoria_nome: data.categoria?.nome,
    };
  },

  async createArticle(articleData) {
    const { data, error } = await supabase
      .from('PDC_kb_articles')
      .insert({
        categoria_id: articleData.categoria_id,
        titulo: articleData.titulo,
        conteudo: articleData.conteudo,
        autor_id: articleData.autor_id || null,
        publicado: articleData.publicado !== false,
      })
      .select(`*, categoria:PDC_kb_categories!categoria_id(nome)`)
      .single();

    if (error) throw new Error(error.message);
    return { ...data, categoria_nome: data.categoria?.nome };
  },

  async updateArticle(id, articleData) {
    const { data, error } = await supabase
      .from('PDC_kb_articles')
      .update({
        categoria_id: articleData.categoria_id,
        titulo: articleData.titulo,
        conteudo: articleData.conteudo,
        publicado: articleData.publicado !== false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`*, categoria:PDC_kb_categories!categoria_id(nome)`)
      .single();

    if (error) throw new Error(error.message);
    return { ...data, categoria_nome: data.categoria?.nome };
  },

  async deleteArticle(id) {
    const { error } = await supabase
      .from('PDC_kb_articles')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  },
};
