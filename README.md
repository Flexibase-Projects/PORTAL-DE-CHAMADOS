# Portal de Chamados

Sistema de gerenciamento de chamados (tickets) com dashboard, gestão de usuários, base de conhecimento e templates dinâmicos por departamento.

## Stack Tecnológica

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS v4** + **shadcn/ui** (componentes)
- **React Router v6** (navegação SPA)
- **Recharts** (gráficos do dashboard)
- **Lucide React** (ícones)
- **@dnd-kit** (drag-and-drop para templates)

### Backend
- **Node.js** + **Express**
- **Supabase** (PostgreSQL como banco de dados)

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

- **Dashboard** com estatísticas, gráficos e chamados recentes
- **Criação de chamados** com formulários dinâmicos por departamento
- **Meus Chamados** - consulta por email
- **Painel Administrativo** com gestão de chamados, templates e usuários
- **Base de Conhecimento** com CRUD de categorias e artigos
- **Sidebar retrátil** que colapsa para ícones
- **Tema Light/Dark** com toggle
- **Design 100% responsivo** (mobile, tablet, desktop)

## Estrutura do Projeto

```
PORTAL-DE-CHAMADOS/
├── frontend/                     # React + TypeScript + Vite
│   ├── src/
│   │   ├── app/                  # App.tsx (rotas e providers)
│   │   ├── components/
│   │   │   ├── layout/           # AppShell, Sidebar, ThemeToggle
│   │   │   └── ui/              # Componentes shadcn/ui
│   │   ├── features/
│   │   │   ├── dashboard/        # Dashboard com stats e gráficos
│   │   │   ├── tickets/          # Criar chamado, meus chamados
│   │   │   ├── admin/            # Painel administrativo
│   │   │   ├── users/            # Gestão de usuários e permissões
│   │   │   └── knowledge-base/   # Base de conhecimento
│   │   ├── hooks/                # useTheme, use-mobile
│   │   ├── lib/                  # utils (cn, formatDate)
│   │   ├── services/             # API clients (axios)
│   │   ├── types/                # TypeScript types
│   │   ├── constants/            # Departamentos, roles
│   │   └── utils/                # Validação
│   └── ...
├── backend/                      # Express API
│   └── src/
│       ├── config/               # Supabase client
│       ├── controllers/          # Route handlers
│       ├── middleware/            # Validação
│       ├── routes/               # Express routes
│       └── services/             # Business logic (Supabase queries)
└── .env.local                    # Variáveis de ambiente (não versionado)
```

## Design Pattern

**Feature-Based Architecture** - cada funcionalidade é encapsulada em seu próprio diretório com página e componentes específicos, promovendo separação de responsabilidades e escalabilidade.

## Pré-requisitos

- Node.js 18+
- Conta no Supabase com as tabelas PDC_ criadas
- Arquivo `.env.local` na raiz com:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon

# Opcional: usar localStorage em vez da API (para Supabase offline)
VITE_USE_LOCAL_STORAGE=true
```

## Instalação

```bash
# Instalar dependências
npm run install:all

# Desenvolvimento (frontend + backend)
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

- **Desenvolvimento:** acesse http://localhost:3001 (única porta – frontend e API)
- O Vite faz proxy de `/api` para o backend internamente

## Roles e Permissões

| Role | Nível | Descrição |
|------|-------|-----------|
| Admin | 4 | Acesso total ao sistema |
| Gestor de Área | 3 | Gerencia departamento |
| Técnico/Suporte | 2 | Atende chamados |
| Usuário | 1 | Abre chamados |

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/dashboard/stats` | Estatísticas do dashboard |
| POST | `/api/tickets` | Criar chamado |
| GET | `/api/tickets` | Listar chamados |
| GET | `/api/tickets/:id` | Detalhes do chamado |
| GET | `/api/tickets/meus-chamados` | Chamados por email |
| GET | `/api/tickets/recebidos` | Chamados não concluídos |
| PATCH | `/api/tickets/:id/status` | Atualizar status |
| POST | `/api/tickets/:id/resposta` | Responder chamado |
| GET | `/api/users` | Listar usuários |
| POST | `/api/users` | Criar usuário |
| PUT | `/api/users/:id` | Atualizar usuário |
| PATCH | `/api/users/:id/toggle-active` | Ativar/desativar |
| GET | `/api/roles` | Listar perfis |
| GET | `/api/templates/:dept` | Template do departamento |
| PUT | `/api/templates` | Salvar template |
| GET | `/api/kb/categories` | Categorias da KB |
| POST | `/api/kb/categories` | Criar categoria |
| PUT | `/api/kb/categories/:id` | Atualizar categoria |
| DELETE | `/api/kb/categories/:id` | Excluir categoria |
| GET | `/api/kb/articles` | Artigos |
| POST | `/api/kb/articles` | Criar artigo |
| PUT | `/api/kb/articles/:id` | Atualizar artigo |
| DELETE | `/api/kb/articles/:id` | Excluir artigo |
| GET | `/api/health` | Health check |
