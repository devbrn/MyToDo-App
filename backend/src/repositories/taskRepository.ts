import { PrismaClient } from '@prisma/client';
import type { Task, Tag } from '@prisma/client';
import { CreateTaskRequest, UpdateTaskRequest } from '@/types';

/**
 * Repositório para operações de banco de dados relacionadas a tarefas
 */
export class TaskRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Busca todas as tarefas ordenadas por status e data de criação
   * @returns Lista de tarefas com suas tags e projeto
   */
  async findAll(): Promise<(Task & { tags: Tag[]; project: any })[]> {
    return this.prisma.task.findMany({
      include: {
        tags: true,
        project: true
      },
      orderBy: [
        { completed: 'asc' }, // Tarefas não concluídas primeiro
        { dueDate: 'asc' },   // Ordenar por data de vencimento
        { createdAt: 'desc' }  // Mais recentes primeiro
      ]
    });
  }

  /**
   * Busca uma tarefa por ID
   * @param id - ID da tarefa
   * @returns Tarefa encontrada ou null
   */
  async findById(id: string): Promise<(Task & { tags: Tag[]; project: any }) | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        tags: true,
        project: true
      }
    });
  }

  /**
   * Cria uma nova tarefa
   * @param data - Dados da tarefa
   * @param tagNames - Nomes das tags a serem associadas
   * @returns Tarefa criada com suas tags
   */
  async create(
    data: CreateTaskRequest & { dueDate?: Date | null; projectId?: string | null; projectColor?: string | null },
    tagNames: string[] = []
  ): Promise<Task & { tags: Tag[] }> {
    // Criar ou encontrar tags existentes
    const tags = await this.findOrCreateTags(tagNames);

    return this.prisma.task.create({
      data: {
        content: data.content,
        dueDate: data.dueDate || null,
        projectId: data.projectId || null,
        projectColor: data.projectColor || null,
        tags: {
          connect: tags.map(tag => ({ id: tag.id }))
        }
      },
      include: {
        tags: true,
        project: true
      }
    });
  }

  /**
   * Atualiza uma tarefa existente
   * @param id - ID da tarefa
   * @param data - Dados para atualização
   * @param tagNames - Nomes das tags (substitui as existentes)
   * @returns Tarefa atualizada ou null se não encontrada
   */
  async update(
    id: string,
    data: UpdateTaskRequest,
    tagNames?: string[]
  ): Promise<(Task & { tags: Tag[]; project: any }) | null> {
    // Verificar se a tarefa existe
    const existingTask = await this.findById(id);
    if (!existingTask) {
      return null;
    }

    // Preparar dados de atualização
    const updateData: any = {};
    if (data.content !== undefined) updateData.content = data.content;
    if (data.completed !== undefined) updateData.completed = data.completed;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.projectColor !== undefined) updateData.projectColor = data.projectColor;

    // Se tags foram fornecidas, atualizar as associações
    if (tagNames !== undefined) {
      const tags = await this.findOrCreateTags(tagNames);
      
      // Desconectar todas as tags atuais e conectar as novas
      updateData.tags = {
        set: [], // Remove todas as conexões existentes
        connect: tags.map(tag => ({ id: tag.id }))
      };
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        tags: true,
        project: true
      }
    });
  }

  /**
   * Remove uma tarefa
   * @param id - ID da tarefa
   * @returns true se removida, false se não encontrada
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.task.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      // Se a tarefa não existe, retorna false
      return false;
    }
  }

  /**
   * Remove múltiplas tarefas concluídas
   * @returns Número de tarefas removidas
   */
  async deleteCompletedTasks(): Promise<number> {
    console.log('[DEBUG BACKEND] TaskRepository.deleteCompletedTasks - Iniciando deleção de tarefas concluídas');
    
    try {
      // Primeiro, vamos verificar quantas tarefas serão deletadas
      const tasksToDelete = await this.prisma.task.findMany({
        where: { 
          completed: true,
          archived: false
        },
        select: {
          id: true,
          content: true,
          completed: true,
          archived: true
        }
      });
      
      console.log(`[DEBUG BACKEND] TaskRepository.deleteCompletedTasks - Encontradas ${tasksToDelete.length} tarefas para deletar:`, tasksToDelete);
      
      const result = await this.prisma.task.deleteMany({
        where: { 
          completed: true,
          archived: false // Só deletar tarefas não arquivadas
        }
      });
      
      console.log(`[DEBUG BACKEND] TaskRepository.deleteCompletedTasks - Deletadas ${result.count} tarefas com sucesso`);
      return result.count;
    } catch (error) {
      console.error('[DEBUG BACKEND] TaskRepository.deleteCompletedTasks - Erro ao deletar tarefas:', error);
      throw error;
    }
  }

  /**
   * Arquiva múltiplas tarefas concluídas
   * @returns Número de tarefas arquivadas
   */
  async archiveCompletedTasks(): Promise<number> {
    const result = await this.prisma.task.updateMany({
      where: { 
        completed: true,
        archived: false
      },
      data: {
        archived: true
      }
    });
    return result.count;
  }

  /**
   * Busca ou cria tags pelo nome
   * @param tagNames - Nomes das tags
   * @returns Array de tags
   */
  private async findOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    if (tagNames.length === 0) {
      return [];
    }

    const tags: Tag[] = [];

    for (const name of tagNames) {
      const tag = await this.prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name }
      });
      tags.push(tag);
    }

    return tags;
  }

  /**
   * Busca tarefas por filtros (para futuras funcionalidades)
   * @param filters - Filtros de busca
   * @returns Lista de tarefas filtradas
   */
  async findByFilters(filters: {
    completed?: boolean;
    tagName?: string;
    limit?: number;
    offset?: number;
  }): Promise<(Task & { tags: Tag[] })[]> {
    const where: any = {};

    if (filters.completed !== undefined) {
      where.completed = filters.completed;
    }

    if (filters.tagName) {
      where.tags = {
        some: {
          name: filters.tagName
        }
      };
    }

    return this.prisma.task.findMany({
      where,
      include: {
        tags: true
      },
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      ...(filters.limit && { take: filters.limit }),
      ...(filters.offset && { skip: filters.offset })
    });
  }

  /**
   * Atualiza o nome do projeto em todas as tarefas que o referenciam
   */
  async updateProjectName(oldName: string, newName: string): Promise<void> {
    // Primeiro, encontrar o projeto pelo nome antigo
    const oldProject = await this.prisma.project.findUnique({
      where: { name: oldName }
    });
    
    if (!oldProject) {
      throw new Error(`Projeto '${oldName}' não encontrado`);
    }

    // Atualizar o nome do projeto na tabela Project
    await this.prisma.project.update({
      where: { id: oldProject.id },
      data: { name: newName }
    });
    
    // As tarefas já estão vinculadas pelo projectId, então não precisamos atualizar nada na tabela Task
  }
}