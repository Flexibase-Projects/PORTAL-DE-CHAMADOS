-- Seed categorias da base de conhecimento: Comercial, Administrativo, Industrial
-- Alinhadas às divisões da lista suspensa da criação de chamados.

INSERT INTO public."PDC_kb_categories" (nome, descricao, icone, ordem)
SELECT 'Comercial', 'Artigos da área comercial', 'briefcase', 1
WHERE NOT EXISTS (SELECT 1 FROM public."PDC_kb_categories" WHERE nome = 'Comercial');

INSERT INTO public."PDC_kb_categories" (nome, descricao, icone, ordem)
SELECT 'Administrativo', 'Artigos da área administrativa', 'building', 2
WHERE NOT EXISTS (SELECT 1 FROM public."PDC_kb_categories" WHERE nome = 'Administrativo');

INSERT INTO public."PDC_kb_categories" (nome, descricao, icone, ordem)
SELECT 'Industrial', 'Artigos da área industrial', 'factory', 3
WHERE NOT EXISTS (SELECT 1 FROM public."PDC_kb_categories" WHERE nome = 'Industrial');
