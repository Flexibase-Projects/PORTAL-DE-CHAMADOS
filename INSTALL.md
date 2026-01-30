# Instruções de Instalação e Execução

## Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

## Instalação

1. **Instalar dependências do workspace raiz:**
```bash
npm install
```

2. **Instalar dependências do frontend:**
```bash
cd frontend
npm install
cd ..
```

3. **Instalar dependências do backend:**
```bash
cd backend
npm install
cd ..
```

Ou use o script automatizado:
```bash
npm run install:all
```

## Configuração

### Backend

1. Copie o arquivo `.env.example` para `.env` na pasta `backend/`:
```bash
cd backend
cp .env.example .env
```

2. Edite o arquivo `.env` e configure as variáveis (opcional para uso inicial):
```
PORT=3001
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here
NODE_ENV=development
```

**Nota:** Por enquanto, o sistema funciona sem Supabase usando armazenamento em memória.

## Execução

### Executar em uma única porta (Recomendado)

```bash
npm run dev
```

Isso fará:
1. Build do frontend
2. Iniciará o backend servindo o frontend
3. Tudo disponível em: **http://localhost:3001**

### Executar com Hot-Reload (Desenvolvimento)

Para desenvolvimento com hot-reload do frontend:

```bash
npm run dev:watch
```

Isso iniciará:
- Frontend na porta 5173 (com hot-reload)
- Backend na porta 3001
- Acesse o frontend em: http://localhost:5173

### Executar Separadamente

**Backend:**
```bash
npm run dev:backend
# ou
cd backend && npm run dev
```

**Frontend:**
```bash
npm run dev:frontend
# ou
cd frontend && npm run dev
```

## Acessar a Aplicação

**Modo Produção (única porta):**
- Aplicação completa: http://localhost:3001
- API: http://localhost:3001/api

**Modo Desenvolvimento (hot-reload):**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## Estrutura de URLs

- `/` - Página Inicial
- `/criar-chamado` - Criar novo chamado
- `/meus-chamados` - Ver meus chamados
- `/painel-administrativo` - Painel administrativo
- `/base-conhecimento` - Base de conhecimento

## Notas Importantes

- Os dados são armazenados em memória (serão perdidos ao reiniciar o servidor)
- Para produção, configure o Supabase conforme documentação
- O sistema está preparado para integração futura com autenticação e upload de arquivos
