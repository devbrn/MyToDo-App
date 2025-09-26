import { startServer } from './server';

// Iniciar o servidor
startServer().catch((error) => {
  console.error('❌ Erro ao iniciar servidor:', error);
  process.exit(1);
});