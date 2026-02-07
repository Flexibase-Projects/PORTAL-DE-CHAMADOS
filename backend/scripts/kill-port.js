// Script para matar processos nas portas 3001 (frontend) e 3002 (backend em dev)
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const FRONTEND_PORT = process.env.PORT || 3001;
const BACKEND_PORT = process.env.BACKEND_PORT || 3002;
const PORTS = [FRONTEND_PORT, BACKEND_PORT];

async function killPort(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    if (!stdout.trim()) return [];

    const lines = stdout.trim().split('\n');
    const pids = new Set();
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) pids.add(pid);
    });
    return Array.from(pids);
  } catch {
    return [];
  }
}

async function main() {
  const allPids = new Set();
  for (const port of PORTS) {
    console.log(`🔍 Procurando processo na porta ${port}...`);
    const pids = await killPort(port);
    pids.forEach(pid => allPids.add(pid));
  }

  if (allPids.size === 0) {
    console.log(`✅ Nenhum processo encontrado nas portas ${PORTS.join(', ')}`);
    return;
  }

  console.log(`📋 Processos encontrados: ${Array.from(allPids).join(', ')}`);
  for (const pid of allPids) {
    try {
      console.log(`🔄 Encerrando processo ${pid}...`);
      await execAsync(`taskkill /PID ${pid} /F`);
      console.log(`✅ Processo ${pid} encerrado com sucesso`);
    } catch (error) {
      console.log(`⚠️  Não foi possível encerrar o processo ${pid}: ${error.message}`);
    }
  }
  console.log(`\n✅ Concluído! Agora você pode executar "npm run dev" novamente.`);
}

main();
