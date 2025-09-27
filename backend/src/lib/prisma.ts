import { getPrismaClient } from '../config/database';

/**
 * Instância do Prisma Client para uso em toda a aplicação
 */
export const prisma = getPrismaClient();