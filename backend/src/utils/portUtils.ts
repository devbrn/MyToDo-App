import net from 'net';

/**
 * Verifica se uma porta está disponível
 * @param port - Número da porta a ser verificada
 * @returns Promise<boolean> - true se a porta estiver disponível
 */
export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Encontra a próxima porta disponível a partir de uma porta inicial
 * @param startPort - Porta inicial para começar a busca
 * @param maxAttempts - Número máximo de tentativas (padrão: 10)
 * @returns Promise<number> - Número da porta disponível encontrada
 */
export async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    
    if (available) {
      return port;
    }
  }
  
  throw new Error(`Nenhuma porta disponível encontrada a partir da porta ${startPort} (tentativas: ${maxAttempts})`);
}

/**
 * Configuração padrão de portas para o projeto
 */
export const DEFAULT_PORTS = {
  BACKEND: 3001,
  FRONTEND: 3004,
  MAX_ATTEMPTS: 10
} as const;

/**
 * Encontra uma porta disponível para o backend
 * @returns Promise<number> - Porta disponível para o backend
 */
export async function getBackendPort(): Promise<number> {
  const preferredPort = parseInt(process.env.PORT || DEFAULT_PORTS.BACKEND.toString());
  
  try {
    return await findAvailablePort(preferredPort, DEFAULT_PORTS.MAX_ATTEMPTS);
  } catch (error) {
    console.warn(`⚠️ Não foi possível encontrar porta a partir de ${preferredPort}`);
    throw error;
  }
}

/**
 * Salva a porta do backend em um arquivo para comunicação com o frontend
 * @param port - Porta do backend
 */
export function saveBackendPort(port: number): void {
  const fs = require('fs');
  const path = require('path');
  
  const portInfo = {
    backend: port,
    timestamp: new Date().toISOString(),
    baseUrl: `http://localhost:${port}`
  };
  
  const portFilePath = path.join(process.cwd(), '..', 'port-config.json');
  
  try {
    fs.writeFileSync(portFilePath, JSON.stringify(portInfo, null, 2));
    console.log(`📝 Configuração de porta salva em: ${portFilePath}`);
  } catch (error) {
    console.warn('⚠️ Não foi possível salvar configuração de porta:', error);
  }
}