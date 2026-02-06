import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Importar config do Supabase (carrega .env.local)
import './config/supabase.js';

// Importar rotas
import ticketRoutes from './routes/tickets.js';
import templateRoutes from './routes/templates.js';
import userRoutes from './routes/users.js';
import roleRoutes from './routes/roles.js';
import kbRoutes from './routes/knowledge-base.js';
import dashboardRoutes from './routes/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Portal de Chamados API está funcionando' });
});

// Servir frontend estático (produção)
const frontendPath = join(__dirname, '../../frontend/dist');
if (existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(frontendPath, 'index.html'), (err) => {
        if (err) next(err);
      });
    } else {
      next();
    }
  });
}

// Error handler
app.use((err, req, res, _next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ success: false, error: 'Erro interno do servidor' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} em uso. Altere PORT no .env.local ou encerre o processo.`);
    process.exit(1);
  }
  console.error('❌ Erro ao iniciar:', err);
  process.exit(1);
});
