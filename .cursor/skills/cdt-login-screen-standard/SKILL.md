---
name: cdt-login-screen-standard
description: >-
  Implementa ou padroniza tela de login em React, TypeScript e MUI no estilo visual do Central de Tarefas: layout split, modo explicativo "O que é este sistema", painel de branding com chips, lembrar credenciais por 30 dias no localStorage e FAQ expansível. Use quando o usuário pedir criar, ajustar, refatorar ou padronizar tela de login ou autenticação nesse padrão.
---

# CDT Login Screen Standard

## Objetivo

Entregar tela de login alinhada ao padrão visual do Central de Tarefas: layout split (branding + formulário), alternância para explicação institucional, identidade consistente, “lembrar” por 30 dias e UX responsiva **sem scroll da página** (scroll só no bloco interno da tela explicativa).

## Stack e escopo

- **Stack:** React + TypeScript + MUI apenas.
- **Arquivo principal:** `frontend/src/pages/Login.tsx` (criar ou ajustar neste caminho, salvo pedido explícito em contrário).
- **Não fazer:** trocar framework, substituir MUI, alterar arquitetura de auth (hooks, providers, rotas) além do necessário para chamar `login` e `navigate` conforme abaixo.

## Tokens visuais

### Tipografia

- Base: `Inter`, fallback `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Título branding: peso `700`, leve `letterSpacing` negativo, hierarquia forte.
- Secundário: `text.secondary` no painel direito; no esquerdo, branco com alpha onde fizer sentido.

### Gradientes do painel esquerdo

- **Light:** `linear-gradient(145deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)`
- **Dark:** `linear-gradient(145deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)`

### Imagem e overlay

- Constante: `LOGIN_LEFT_BACKGROUND = '/images/login-left-background.webp'`
- Overlay radial sutil sobre o branding (sem poluir o texto).

### Chips (painel esquerdo)

- Borda: `1px solid rgba(255,255,255,0.2)`
- Fundo: `rgba(255,255,255,0.08)`
- Texto: `rgba(255,255,255,0.85)`
- Raio: pill (`999` ou equivalente MUI)

## Estrutura da página

### 1) Raiz

- `height: '100vh'`, `display: 'flex'`, `flexDirection: { xs: 'column', md: 'row' }`, `overflow: 'hidden'`
- **Regra:** nunca permitir scroll do `body`/página inteira.

### 2) Painel esquerdo (branding)

- Desktop: ~50% largura. Mobile: faixa superior compacta.
- Conteúdo: título **"Central de Tarefas"**, descrição institucional curta, chips em `flex-wrap`, centralizados, distribuição orgânica (não grid rígido).

**Chips sugeridos:** Projetos, Atividades, Kanban, Indicadores, Conquistas, Colaboração, Organograma, Custos.

### 3) Painel direito

- Desktop: ~50%. `overflow: 'hidden'`.
- Estados: alternar entre **formulário de login** e **tela "O que é este sistema"** (`loginForm` / `sobreScreen`).

#### Formulário (ordem)

1. Título: **"Bem-vindo(a)"**
2. Subtítulo: **"Acesse sua conta para continuar"**
3. E-mail
4. Senha
5. Botão **"Acessar sistema"**
6. Checkbox **centralizado**, abaixo do botão: **"Manter conectado por 30d"**
7. Ação secundária: **"O que é este sistema?"**

#### Tela explicativa

- Ocupa visualmente a coluna direita inteira.
- Botão **"Voltar ao login"**
- Card de apresentação, resumo executivo, duas colunas de explicação no desktop.
- FAQ na parte inferior com `Accordion` MUI (um item por funcionalidade listada abaixo).
- **Scroll:** apenas em um container interno do `sobreScreen` com `overflow: 'auto'`; o restante da página permanece sem scroll vertical global.

## Comportamento

### Login

- `handleSubmit`: `useAuth().login(email, password)`; em sucesso `navigate('/')`.
- Loading no botão; erros em `Alert` MUI.
- Manter toggle claro/escuro existente do projeto (não remover).

### Lembrar 30 dias (`localStorage`)

- Chave: `cdt-login-remember-30d`
- Valor (JSON ou estrutura equivalente): `email`, `password`, `expiresAt` (timestamp).
- No mount: se válido, preencher campos; se expirado, remover entrada.
- No submit: se checkbox marcado, persistir 30 dias; se desmarcado, remover entrada.

### Textos padrão da explicação (não alterar sem pedido explícito)

**Resumo:**  
"Plataforma para organizar o trabalho do time de desenvolvimento com clareza de prioridade, distribuição de responsabilidades e acompanhamento contínuo das entregas."

**FAQ — tópicos obrigatórios** (cada um: 1–2 frases, valor prático):

- Projetos  
- Atividades  
- Kanban e TO-DOs  
- Indicadores  
- Conquistas e Níveis  
- Colaboração  
- Organograma e Mapa  
- Custos  

## Acessibilidade e UX

- `autoComplete`: e-mail `username`, senha `current-password`.
- Desabilitar inputs e ações relevantes durante loading.
- FAQ e toggle de tema com área clicável clara; contraste legível em light/dark.

## Checklist antes de concluir

- [ ] 50/50 no desktop; mobile com branding em faixa superior.
- [ ] Sem scroll da página inteira.
- [ ] Scroll só no conteúdo interno do `sobreScreen`.
- [ ] Checkbox "Manter conectado por 30d" centralizado abaixo do botão.
- [ ] Auto-preenchimento quando credencial válida no `localStorage`.
- [ ] FAQ expansível na tela explicativa.
- [ ] Gradientes, imagem de fundo e chips no padrão definido.
- [ ] Tipografia Inter e hierarquia visual clara.

## Proibições explícitas

- Remover modo claro/escuro.
- Layout full-card centralizado “clássico” como substituto do split.
- Trocar MUI por outra lib de UI.
- Introduzir scroll vertical da página de login.
- Alterar textos principais sem pedido explícito do usuário.

## Referência de implementação

Ao implementar, ler o `Login.tsx` e hooks de auth do projeto antes de editar; reutilizar padrões de tema, `ThemeProvider` e rotas já existentes.
