import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, appendFileSync } from 'fs';
import ticketRoutes from './routes/tickets.js';
import templateRoutes from './routes/templates.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes (devem vir antes do static)
app.use('/api/tickets', ticketRoutes);
app.use('/api/templates', templateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Portal de Chamados API está funcionando' });
});

// Servir arquivos estáticos do frontend (se existir)
const frontendPath = join(__dirname, '../../frontend/dist');
if (existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  
  // Para todas as rotas que não são API, servir o index.html do frontend (SPA)
  app.get('*', (req, res, next) => {
    // Se não for uma rota de API, servir o index.html
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(frontendPath, 'index.html'), (err) => {
        if (err) {
          next(err);
        }
      });
    } else {
      next();
    }
  });
} else {
  console.log('⚠️  Frontend não encontrado. Execute "npm run build:frontend" primeiro.');
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.status(503).json({ 
        error: 'Frontend não encontrado. Execute "npm run build:frontend" primeiro.' 
      });
    }
  });
}

// Error handling middleware (escreve em .ndjson para não ser ignorado por *.log)
const errorLogPath = join(__dirname, '..', '..', '.cursor', 'error-500.ndjson');
app.use((err, req, res, next) => {
  console.error(err.stack);
  try {
    mkdirSync(join(__dirname, '..', '..', '.cursor'), { recursive: true });
    appendFileSync(errorLogPath, JSON.stringify({ location: 'server.js:errorHandler', message: err.message, stack: err.stack, path: req.path, timestamp: Date.now() }) + '\n');
  } catch (_) {}
  res.status(500).json({ error: 'Algo deu errado!' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  if (existsSync(frontendPath)) {
    console.log(`📱 Frontend e Backend disponíveis em http://localhost:${PORT}`);
  } else {
    console.log(`📡 Backend API disponível em http://localhost:${PORT}/api`);
    console.log(`⚠️  Frontend não encontrado. Execute "npm run build:frontend" primeiro.`);
  }
});

// Tratamento de erro quando a porta está em uso
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Erro: A porta ${PORT} já está em uso!`);
    console.error(`\n💡 Soluções:`);
    console.error(`   1. Encerre o processo que está usando a porta ${PORT}`);
    console.error(`   2. No Windows, execute: netstat -ano | findstr :${PORT}`);
    console.error(`   3. Depois execute: taskkill /PID <PID> /F`);
    console.error(`   4. Ou altere a porta no arquivo .env (PORT=3002)\n`);
    process.exit(1);
  } else {
    console.error('❌ Erro ao iniciar o servidor:', err);
    process.exit(1);
  }
});
