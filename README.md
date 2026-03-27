# Portal de Chamados

Sistema de gerenciamento de chamados (tickets) com dashboard, gestão de usuários e templates dinâmicos por departamento.

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
- **Supabase Auth**: login por e-mail/senha; usuários do Auth são usados para acesso ao painel e às permissões por departamento.
- Tabelas no schema `public` com prefixo `PDC_`:
  - `PDC_roles` - Perfis de acesso (Admin, Gestor de Área, Técnico, Usuário)
  - `PDC_users` - Usuários do sistema (portal)
  - `PDC_user_permissions` - Permissões por departamento para usuários do Auth (`auth_user_id`, `departamento`, `permissao`: `view` ou `view_edit`)
  - `PDC_tickets` - Chamados
  - `PDC_ticket_responses` - Respostas dos chamados
  - `PDC_templates` - Templates dinâmicos por departamento

## Funcionalidades

- **Dashboard** com estatísticas, gráficos (por dia/mês, setor, departamento), intervalo de datas customizado e chamados recentes
- **Criação de chamados** com formulários dinâmicos por departamento
- **Meus Chamados** - consulta autenticada por usuário logado
- **Painel Administrativo** (abas: Chamados, Templates, Usuários) com gestão de chamados, templates por departamento, usuários e **permissões por departamento** (listagem de usuários do Auth e atribuição de permissão Ver / Ver e editar por área, ex.: SGI, TI)
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
│   │   │   ├── users/              # UsersPage (gestão de usuários e permissões por departamento)
│   │   ├── hooks/                  # useTheme, use-mobile
│   │   ├── lib/                    # utils (cn, formatDate)
│   │   ├── services/               # api (axios), ticketService, templateService, userService, permissionService
│   │   ├── storage/                # localStorageStorage (somente fallback explícito de desenvolvimento)
│   │   ├── theme/                  # AppTheme (MUI ThemeProvider + CssBaseline)
│   │   ├── types/                  # TypeScript (ticket, user, template)
│   │   ├── constants/              # departamentos, roles
│   │   └── utils/                  # validation (validateTicketForm, etc.)
│   └── vite.config.ts              # proxy /api -> backend
├── backend/
│   ├── scripts/                    # Scripts utilitários (create-sgi-user.js, kill-port.js)
│   └── src/
│       ├── config/                 # supabase.js, supabaseAdmin.js (Auth admin)
│       ├── controllers/            # dashboard, tickets, users, templates, permissions
│       ├── middleware/             # validation
│       ├── routes/                 # Express routes (incl. /api/admin/permissions)
│       ├── services/               # Lógica de negócio (Supabase + permissionService)
│       └── server.js
├── supabase/
│   ├── schema.sql
│   └── migrations/
└── package.json                    # workspaces (frontend, backend)
```

## Design e Arquitetura

- **Feature-based**: cada funcionalidade em seu diretório (dashboard, tickets, admin, users), com páginas e componentes específicos.
- **Tema MUI**: paleta primária/secundária e modo claro/escuro; sidebar com cor de destaque #7289da (hover e item ativo).

## Pré-requisitos

- Node.js 18+
- Conta no Supabase com migrations aplicadas em `supabase/migrations` (fonte oficial de schema)
- Arquivo `.env` ou `.env.local` na **raiz do projeto** com:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon

# Backend: obrigatório para listar usuários do Auth e salvar permissões (painel admin)
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Se SUPABASE_SERVICE_ROLE_KEY for sb_secret_... (Supabase local), defina o JWT secret (supabase status)
# SUPABASE_JWT_SECRET=seu-jwt-secret
# SUPABASE_PROJECT_REF=ref-do-projeto

# Opcional: frontend usa localStorage somente em desenvolvimento controlado
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

# Scripts do backend (executar na raiz do projeto)
node backend/scripts/create-sgi-user.js   # Criar usuário no Auth + permissão SGI (ver script para customizar)
npm run kill-port                         # Encerrar processos nas portas do frontend/backend (Windows)
```

## Portas

- **Frontend:** http://localhost:3001 (acesso principal)
- **Backend:** http://localhost:3002 (API)
- O Vite faz proxy de `/api` para o backend; as requisições do frontend usam `/api/...` e são encaminhadas automaticamente.
- **Produção (Coolify/Docker):** a aplicação expõe a porta **8095** (configurável pela variável `PORT`).

## Deploy no Coolify

O projeto está preparado para deploy via **Docker** (Coolify ou qualquer orquestrador).

**Importante:** no Coolify, é necessário escolher o **Build Pack "Dockerfile"** (não use Nixpacks). Veja instruções passo a passo em [COOLIFY.md](./COOLIFY.md).

1. **Build:** no Coolify, selecione o build pack **Dockerfile** (não Nixpacks); o `Dockerfile` na raiz fará o build da imagem.
2. **Porta:** configurar a porta do serviço como **8095** (ou definir a variável de ambiente `PORT=8095`).
3. **Variáveis de ambiente:** configurar no Coolify as mesmas variáveis do `.env`/`.env.local`:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (necessária para listagem de usuários do Auth e permissões no painel admin)
   - Opcional: `VITE_USE_LOCAL_STORAGE`, `PORT`
4. O backend serve o frontend estático (build do Vite) na mesma porta; não é necessário expor duas portas.

## Autenticação e permissões

- **Login**: Supabase Auth (e-mail e senha). Usuários do Auth acessam o painel e a área "Meus Chamados".
- **Envio de chamados**: não exige permissão; qualquer usuário pode abrir chamado para qualquer departamento.
- **Recebimento de chamados**: quem tem o departamento definido em `PDC_users.departamento` igual ao **área de destino** (`area_destino`) do chamado vê e pode editar/responder esses chamados. Não é obrigatório ter registro em `PDC_user_permissions` para o próprio departamento — basta o usuário ter o departamento correto em **Usuários** (coluna Departamento).
- **Chamados do meu departamento e Dashboard**: exibem apenas chamados cujo `area_destino` é o departamento do usuário (`PDC_users.departamento`). Garanta que cada usuário receptor tenha o departamento preenchido no painel Usuários.
- **Permissões por departamento** (tabela `PDC_user_permissions`): opcional. Serve para conceder **Ver** ou **Ver e editar** chamados de *outros* departamentos além do do usuário, ou para políticas futuras.
- **Criar usuário no Auth e dar acesso ao SGI**: use o script `backend/scripts/create-sgi-user.js` (edite email/senha/departamento no próprio arquivo se quiser). Requer `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`:
  ```bash
  node backend/scripts/create-sgi-user.js
  ```

## Roles (PDC_roles)

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
| GET | `/api/tickets/meus-chamados-by-auth` | Chamados do usuário autenticado |
| GET | `/api/tickets/recebidos` | Chamados não concluídos |
| GET | `/api/tickets/recebidos/concluidos` | Chamados concluídos |
| PATCH | `/api/tickets/:id/status` | Atualizar status |
| POST | `/api/tickets/:id/resposta` | Responder chamado |
| GET | `/api/users` | Listar usuários |
| POST | `/api/users` | Criar usuário |
| PUT | `/api/users/:id` | Atualizar usuário |
| PATCH | `/api/users/:id/toggle-active` | Ativar/desativar usuário |
| GET | `/api/admin/permissions/auth-users` | Listar usuários do Auth (admin) |
| GET | `/api/admin/permissions/:authUserId` | Obter permissões por departamento |
| PUT | `/api/admin/permissions/:authUserId` | Definir permissões (body: `{ departamentos: { [dept]: "view" \| "view_edit" } }`) |
| PATCH | `/api/admin/permissions/:authUserId/departamento` | Definir departamento base do usuário |
| GET | `/api/roles` | Listar perfis |
| GET | `/api/notifications` | Listar notificações do usuário autenticado |
| PATCH | `/api/notifications/:id/read` | Marcar notificação como lida |
| POST | `/api/notifications/mark-all-read` | Marcar todas como lidas |
| GET | `/api/realtime/events` | SSE com autenticação Bearer no header |
| GET | `/api/templates/:dept` | Template do departamento |
| PUT | `/api/templates` | Salvar template |

## Qualidade de release

- Execute `npm run ci` antes de merge/deploy.
- Checklist operacional de release: [docs/release-checklist.md](./docs/release-checklist.md).
- O CI também valida budget de bundle com `npm run bundle:check`.
