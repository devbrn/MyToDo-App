import { PrismaClient } from '@prisma/client';

/**
 * Instância global do Prisma Client
 */
let prisma: PrismaClient;

/**
 * Inicializa e retorna a instância do Prisma Client
 * @returns Instância configurada do Prisma Client
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
      errorFormat: 'pretty'
    });

    // Conectar ao banco de dados
    prisma.$connect()
      .then(() => {
        console.log('✅ Conectado ao banco de dados PostgreSQL');
      })
      .catch((error) => {
        console.error('❌ Erro ao conectar ao banco de dados:', error);
        process.exit(1);
      });

    // Graceful shutdown
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
      console.log('🔌 Desconectado do banco de dados');
    });
  }

  return prisma;
}

/**
 * Desconecta do banco de dados
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    console.log('🔌 Desconectado do banco de dados');
  }
}