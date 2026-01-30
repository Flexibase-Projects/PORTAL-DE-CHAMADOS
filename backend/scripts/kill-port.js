// Script para matar processo na porta 3001 (Windows)
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PORT = process.env.PORT || 3001;

async function killPort() {
  try {
    console.log(`🔍 Procurando processo na porta ${PORT}...`);
    
    // Windows: netstat -ano | findstr :PORT
    const { stdout } = await execAsync(`netstat -ano | findstr :${PORT}`);
    
    if (!stdout.trim()) {
      console.log(`✅ Nenhum processo encontrado na porta ${PORT}`);
      return;
    }

    // Extrair PIDs
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        pids.add(pid);
      }
    });

    if (pids.size === 0) {
      console.log(`✅ Nenhum processo encontrado na porta ${PORT}`);
      return;
    }

    console.log(`📋 Processos encontrados: ${Array.from(pids).join(', ')}`);
    
    // Matar processos
    for (const pid of pids) {
      try {
        console.log(`🔄 Encerrando processo ${pid}...`);
        await execAsync(`taskkill /PID ${pid} /F`);
        console.log(`✅ Processo ${pid} encerrado com sucesso`);
      } catch (error) {
        console.log(`⚠️  Não foi possível encerrar o processo ${pid}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Concluído! Agora você pode executar "npm run dev" novamente.`);
  } catch (error) {
    if (error.message.includes('findstr')) {
      console.log(`✅ Nenhum processo encontrado na porta ${PORT}`);
    } else {
      console.error('❌ Erro:', error.message);
    }
  }
}

killPort();
