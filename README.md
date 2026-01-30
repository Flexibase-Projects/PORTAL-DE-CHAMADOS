# Portal de Chamados

Sistema completo de gerenciamento de chamados com frontend React (MUI) e backend Node.js.

## Estrutura do Projeto

```
portal-chamados/
├── frontend/          # React + MUI + Vite
├── backend/           # Node.js + Express
└── package.json       # Workspace root
```

## Funcionalidades

- ✅ Página inicial com seleção de área
- ✅ Envio de chamados com formulário dinâmico
- ✅ Visualização de chamados (ENVIADOS e RECEBIDOS)
- ✅ Painel Administrativo para resposta e conclusão
- ✅ Base de Conhecimento e Tutoriais

## Tecnologias

- **Frontend**: React, Material-UI (MUI), React Router, Vite
- **Backend**: Node.js, Express
- **Banco de Dados**: Supabase (preparado para integração futura)

## Instalação

```bash
# Instalar todas as dependências
npm run install:all

# Ou instalar separadamente
cd frontend && npm install
cd ../backend && npm install
```

## Execução

```bash
# Executar tudo em uma única porta (recomendado)
npm run dev
# Isso fará build do frontend e iniciará o backend servindo tudo na porta 3001
# Acesse: http://localhost:3001

# Para desenvolvimento com hot-reload (duas portas)
npm run dev:watch
# Frontend: http://localhost:5173 (com proxy para API)
# Backend: http://localhost:3001
```

## Solução de Problemas

### Erro: Porta já em uso (EADDRINUSE)

Se você receber o erro `EADDRINUSE: address already in use :::3001`, significa que a porta 3001 já está sendo usada por outro processo.

**Solução rápida:**
```bash
# Matar processo na porta 3001 (Windows)
npm run kill-port

# Ou manualmente no Windows:
netstat -ano | findstr :3001
taskkill /PID <PID_ENCONTRADO> /F
```

**Alternativa:** Altere a porta no arquivo `backend/.env`:
```
PORT=3002
```

## Estrutura de Dados

### Chamado (Ticket)
- ID único
- Nome do solicitante
- Email
- Setor
- Área
- Tipo de Suporte
- Ramal
- Assunto
- Mensagem
- Anexo (preparado para futuro)
- Status (Pendente, Em Andamento, Concluído)
- Data de criação
- Respostas

## Próximos Passos

- [ ] Integração com Supabase
- [ ] Sistema de autenticação
- [ ] Upload de arquivos
- [ ] Sistema de notificações
- [ ] Controle de permissões por role
