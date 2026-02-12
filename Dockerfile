# ============================================
# Stage 1: Build (instala todas as deps, inclusive dev para o Vite)
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifests de dependências
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Instalar TODAS as dependências (devDependencies necessárias para o build do Vite)
RUN npm ci

# Copiar código fonte
COPY frontend ./frontend
COPY backend ./backend

# Build do frontend (Vite precisa estar instalado)
RUN npm run build:frontend

# ============================================
# Stage 2: Produção (só backend + frontend estático)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Porta padrão para o Coolify; pode ser sobrescrita pela variável PORT no Coolify
ENV PORT=8095

# Backend: instalar apenas dependências de produção (sem lock file próprio)
COPY backend/package.json ./backend/
RUN cd backend && npm install --omit=dev

# Código do backend
COPY backend ./backend

# Frontend buildado (gerado no stage builder)
COPY --from=builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend

EXPOSE 8095

CMD ["node", "src/server.js"]
