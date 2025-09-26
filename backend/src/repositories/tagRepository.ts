import { PrismaClient } from '@prisma/client';
import type { Tag } from '@prisma/client';

/**
 * Repositório para operações relacionadas a tags
 */
export class TagRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Busca todas as tags (incluindo as sem tarefas)
   * @returns Lista de tags
   */
  async findAll(): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      orderBy: {
        name: 'asc'
      }
    });
  }

  /**
   * Busca uma tag por ID
   * @param id - ID da tag
   * @returns Tag encontrada ou null
   */
  async findById(id: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({
      where: { id }
    });
  }

  /**
   * Busca uma tag por nome
   * @param name - Nome da tag
   * @returns Tag encontrada ou null
   */
  async findByName(name: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({
      where: { name }
    });
  }

  /**
   * Cria uma nova tag
   * @param name - Nome da tag
   * @param color - Cor da tag (opcional)
   * @returns Tag criada
   */
  async create(name: string, color?: string): Promise<Tag> {
    return this.prisma.tag.create({
      data: {
        name,
        color: color || null
      }
    });
  }

  /**
   * Atualiza uma tag
   * @param id - ID da tag
   * @param data - Dados para atualização
   * @returns Tag atualizada ou null se não encontrada
   */
  async update(id: string, data: { name?: string; color?: string }): Promise<Tag | null> {
    try {
      return await this.prisma.tag.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.color !== undefined && { color: data.color })
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar tag:', error);
      return null;
    }
  }

  /**
   * Remove uma tag
   * @param id - ID da tag
   * @returns true se removida, false se não encontrada
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.tag.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Erro ao remover tag:', error);
      return false;
    }
  }

  /**
   * Busca ou cria uma tag pelo nome
   * @param name - Nome da tag
   * @param color - Cor da tag (opcional)
   * @returns Tag encontrada ou criada
   */
  async findOrCreate(name: string, color?: string): Promise<Tag> {
    return this.prisma.tag.upsert({
      where: { name },
      update: {},
      create: { 
        name,
        color: color || null
      }
    });
  }

  /**
   * Conta quantas tarefas estão associadas a uma tag
   * @param id - ID da tag
   * @returns Número de tarefas associadas
   */
  async countTasks(id: string): Promise<number> {
    return this.prisma.task.count({
      where: {
        tags: {
          some: {
            id
          }
        }
      }
    });
  }
}