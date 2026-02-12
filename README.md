# Portal de Chamados

Sistema de gerenciamento de chamados (tickets) com dashboard, gestão de usuários, base de conhecimento e templates dinâmicos por departamento.

## Stack Tecnológica

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Material UI (MUI) v7** + **Emotion** (componentes e tema)
- **Tailwind CSS v4** (utilitários e integração com Vite)
- **React Router v6** (navegação SPA)
- **Recharts** (gráficos do dashboard)
- **Lucide React** (ícones)
- **React Hook Form** + **Zod** (formulários e validação)
- **@dnd-kit** (drag-and-drop para editor de templates)
- **Axios** (chamadas à API)

### Backend
- **Node.js** + **Express**
- **Supabase** (PostgreSQL e cliente JS)

### Banco de Dados
Todas as tabelas usam o prefixo `PDC_`:
- `PDC_roles` - Perfis de acesso (Admin, Gestor de Área, Técnico, Usuário)
- `PDC_users` - Usuários do sistema
- `PDC_tickets` - Chamados
- `PDC_ticket_responses` - Respostas dos chamados
- `PDC_templates` - Templates dinâmicos por departamento
- `PDC_kb_categories` - Categorias da base de conhecimento
- `PDC_kb_articles` - Artigos da base de conhecimento

## Funcionalidades

- **Dashboard** com estatísticas, gráficos (por dia/mês, setor, departamento), intervalo de datas customizado e chamados recentes
- **Criação de chamados** com formulários dinâmicos por departamento
- **Meus Chamados** - consulta por e-mail
- **Painel Administrativo** (abas: Chamados, Templates, Usuários) com gestão de chamados, templates por departamento e usuários
- **Base de Conhecimento** com CRUD de categorias e artigos
- **Sidebar retrátil** (colapsa para ícones), fundo branco com destaque em #7289da (hover e item ativo)
- **Tema claro/escuro** com toggle na sidebar
- **Layout responsivo** (drawer temporário no mobile, sidebar fixa no desktop)

## Estrutura do Projeto

```
PORTAL-DE-CHAMADOS/
├── frontend/
│   ├── src/
│   │   ├── app/                    # App.tsx (rotas e providers)
│   │   ├── components/
│   │   │   └── layout/              # AppShell, AppSidebar, UserNav, ThemeToggle
│   │   ├── contexts/               # ThemeContext
│   │   ├── features/
│   │   │   ├── dashboard/          # DashboardPage, StatsCards, Charts, RecentTickets
│   │   │   ├── tickets/            # CreateTicketPage, MyTicketsPage, TicketCard, TemplateFieldRenderer
│   │   │   ├── admin/              # AdminPage, TicketManagement, TemplateEditor
│   │   │   ├── users/              # UsersPage (aba do painel admin)
│   │   │   └── knowledge-base/     # KnowledgeBasePage
│   │   ├── hooks/                  # useTheme, use-mobile
│   │   ├── lib/                    # utils (cn, formatDate)
│   │   ├── services/               # api (axios), ticketService, templateService, userService, kbService
│   │   ├── storage/                # localStorageStorage (fallback quando VITE_USE_LOCAL_STORAGE)
│   │   ├── theme/                  # AppTheme (MUI ThemeProvider + CssBaseline)
│   │   ├── types/                  # TypeScript (ticket, user, template, knowledge-base)
│   │   ├── constants/              # departamentos, roles
│   │   └── utils/                  # validation (validateTicketForm, etc.)
│   └── vite.config.ts              # proxy /api -> backend
├── backend/
│   └── src/
│       ├── config/                 # Supabase client
│       ├── controllers/            # dashboard, tickets, users, templates, kb
│       ├── middleware/             # validation
│       ├── routes/                 # Express routes
│       ├── services/               # Lógica de negócio (Supabase)
│       └── server.js
├── supabase/
│   ├── schema.sql
│   └── migrations/
└── package.json                    # workspaces (frontend, backend)
```

## Design e Arquitetura

- **Feature-based**: cada funcionalidade em seu diretório (dashboard, tickets, admin, users, knowledge-base), com páginas e componentes específicos.
- **Tema MUI**: paleta primária/secundária e modo claro/escuro; sidebar com cor de destaque #7289da (hover e item ativo).

## Pré-requisitos

- Node.js 18+
- Conta no Supabase com as tabelas PDC_ criadas (ver `supabase/schema.sql`)
- Arquivo `.env` ou `.env.local` na **raiz do projeto** com:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon

# Opcional: frontend usa localStorage em vez da API (para desenvolvimento sem backend)
VITE_USE_LOCAL_STORAGE=true
```

## Instalação

```bash
# Instalar dependências (raiz + frontend + backend)
npm run install:all

# Desenvolvimento (frontend + backend em paralelo)
npm run dev

# Apenas frontend
npm run dev:frontend

# Apenas backend
npm run dev:backend

# Build para produção
npm run build:frontend
npm start
```

## Portas

- **Frontend:** http://localhost:3001 (acesso principal)
- **Backend:** http://localhost:3002 (API)
- O Vite faz proxy de `/api` para o backend; as requisições do frontend usam `/api/...` e são encaminhadas automaticamente.
- **Produção (Coolify/Docker):** a aplicação expõe a porta **8095** (configurável pela variável `PORT`).

## Deploy no Coolify

O projeto está preparado para deploy via **Docker** (Coolify ou qualquer orquestrador).

1. **Build:** o Coolify deve usar o `Dockerfile` na raiz (build de imagem Docker).
2. **Porta:** configurar a porta do serviço como **8095** (ou definir a variável de ambiente `PORT=8095`).
3. **Variáveis de ambiente:** configurar no Coolify as mesmas variáveis do `.env`/`.env.local`:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - Opcional: `VITE_USE_LOCAL_STORAGE`, `PORT`
4. O backend serve o frontend estático (build do Vite) na mesma porta; não é necessário expor duas portas.

## Roles e Permissões

| Role             | Nível | Descrição           |
|------------------|-------|---------------------|
| Admin            | 4     | Acesso total        |
| Gestor de Área   | 3     | Gerencia departamento |
| Técnico/Suporte  | 2     | Atende chamados     |
| Usuário          | 1     | Abre chamados       |

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard/stats` | Estatísticas do dashboard (query: dateFrom, dateTo) |
| POST | `/api/tickets` | Criar chamado |
| GET | `/api/tickets` | Listar chamados |
| GET | `/api/tickets/:id` | Detalhes do chamado |
| GET | `/api/tickets/meus-chamados` | Chamados por e-mail (query: email) |
| GET | `/api/tickets/recebidos` | Chamados não concluídos |
| PATCH | `/api/tickets/:id/status` | Atualizar status |
| POST | `/api/tickets/:id/resposta` | Responder chamado |
| GET | `/api/users` | Listar usuários |
| POST | `/api/users` | Criar usuário |
| PUT | `/api/users/:id` | Atualizar usuário |
| PATCH | `/api/users/:id/toggle-active` | Ativar/desativar usuário |
| GET | `/api/roles` | Listar perfis |
| GET | `/api/templates/:dept` | Template do departamento |
| PUT | `/api/templates` | Salvar template |
| GET | `/api/kb/categories` | Categorias da KB |
| POST | `/api/kb/categories` | Criar categoria |
| PUT | `/api/kb/categories/:id` | Atualizar categoria |
| DELETE | `/api/kb/categories/:id` | Excluir categoria |
| GET | `/api/kb/articles` | Listar artigos |
| POST | `/api/kb/articles` | Criar artigo |
| PUT | `/api/kb/articles/:id` | Atualizar artigo |
| DELETE | `/api/kb/articles/:id` | Excluir artigo |
