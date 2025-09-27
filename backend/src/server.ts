import dotenv from 'dotenv';
import { createApp } from './app';
import { getBackendPort, saveBackendPort } from './utils/portUtils';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Inicia o servidor HTTP
 */
export async function startServer(): Promise<void> {
  try {
    const app = createApp();
    
    // Encontrar porta disponível automaticamente
    const port = await getBackendPort();
    
    // Salvar configuração de porta para comunicação com frontend
    saveBackendPort(port);

    const server = app.listen(port, () => {
      console.log(`🚀 Servidor rodando na porta ${port}`);
      console.log(`📍 Health check: http://localhost:${port}/health`);
      console.log(`📍 API Base URL: http://localhost:${port}/api`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🛑 Recebido sinal ${signal}. Iniciando shutdown graceful...`);
      
      server.close(() => {
        console.log('✅ Servidor HTTP fechado');
        process.exit(0);
      });

      // Forçar saída após 10 segundos
      setTimeout(() => {
        console.error('❌ Forçando saída após timeout');
        process.exit(1);
      }, 10000);
    };

    // Capturar sinais de shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Capturar erros não tratados
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}