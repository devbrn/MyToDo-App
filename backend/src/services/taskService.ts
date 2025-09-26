import type { Task, Tag, Project } from '@prisma/client';
import { TaskRepository } from '@/repositories/taskRepository';
import { ProjectRepository } from '@/repositories/projectRepository';
import { NLPProcessor } from '@/utils/nlp';
import { CreateTaskRequest, UpdateTaskRequest, TaskResponse } from '@/types';

/**
 * Serviço de tarefas contendo a lógica de negócio
 */
export class TaskService {
  private taskRepository: TaskRepository;
  private projectRepository: ProjectRepository;

  constructor(taskRepository: TaskRepository, projectRepository: ProjectRepository) {
    this.taskRepository = taskRepository;
    this.projectRepository = projectRepository;
  }

  /**
   * Lista todas as tarefas
   * @returns Lista de tarefas formatadas
   */
  async getAllTasks(): Promise<TaskResponse[]> {
    const tasks = await this.taskRepository.findAll();
    return tasks.map(this.formatTaskResponse);
  }

  /**
   * Busca uma tarefa por ID
   * @param id - ID da tarefa
   * @returns Tarefa formatada ou null se não encontrada
   */
  async getTaskById(id: string): Promise<TaskResponse | null> {
    const task = await this.taskRepository.findById(id);
    return task ? this.formatTaskResponse(task) : null;
  }

  /**
   * Cria uma nova tarefa
   * @param data - Dados da tarefa a ser criada
   * @returns Tarefa criada formatada
   */
  async createTask(data: CreateTaskRequest): Promise<TaskResponse> {
    console.log('🔍 [DEBUG TASK SERVICE] Iniciando criação de tarefa:', {
      content: data.content,
      projectId: data.projectId,
      timestamp: new Date().toISOString()
    });

    let projectId: string | null = null;
    let cleanContent = data.content;
    let tags: string[] = [];
    let dueDate: Date | null = null;

    // PRIORIDADE 1: Se projectId foi fornecido diretamente, usar ele (contexto de projeto)
    // Neste caso, NÃO processamos com NLP para evitar duplicatas
    if (data.projectId) {
      console.log('🔍 [DEBUG BACKEND] TaskService - Usando projectId fornecido diretamente (sem NLP):', data.projectId);
      projectId = data.projectId;
      
      // Processar apenas tags e datas, mas não projetos
      const nlpResult = NLPProcessor.processContent(data.content);
      cleanContent = nlpResult.cleanContent;
      tags = nlpResult.tags;
      dueDate = nlpResult.dueDate;
    }
    // PRIORIDADE 2: Se não há projectId, processar com NLP completo
    else {
      console.log('🔍 [DEBUG BACKEND] TaskService - Processando com NLP completo');
      
      // Processar conteúdo com NLP
      const nlpResult = NLPProcessor.processContent(data.content);
      console.log('🔍 [DEBUG TASK SERVICE] Resultado do NLP:', {
        cleanContent: nlpResult.cleanContent,
        project: nlpResult.project,
        tags: nlpResult.tags,
        dueDate: nlpResult.dueDate
      });

      // Validar se o resultado é válido
      if (!NLPProcessor.isValidResult(nlpResult)) {
        throw new Error('Conteúdo da tarefa inválido após processamento NLP');
      }

      cleanContent = nlpResult.cleanContent;
      tags = nlpResult.tags;
      dueDate = nlpResult.dueDate;

      // Se o NLP extraiu um projeto, buscar ou criar o projeto
      if (nlpResult.project) {
        console.log('🔍 [DEBUG BACKEND] TaskService - Processando projeto do NLP:', nlpResult.project);
        
        let project = await this.projectRepository.findByName(nlpResult.project);
        console.log('🔍 [DEBUG BACKEND] TaskService - Resultado busca projeto:', project ? { id: project.id, name: project.name } : 'não encontrado');
        
        if (!project) {
          console.log('🔍 [DEBUG BACKEND] TaskService - Criando novo projeto:', nlpResult.project);

          // Verificar novamente se o projeto não foi criado por outra requisição simultânea
          project = await this.projectRepository.findByName(nlpResult.project);
          
          if (!project) {
            project = await this.projectRepository.create(nlpResult.project);
            console.log('🔍 [DEBUG BACKEND] TaskService - Projeto criado com sucesso:', { id: project.id, name: project.name });
          } else {
            console.log('🔍 [DEBUG BACKEND] TaskService - Projeto já existe (criado por requisição simultânea):', { id: project.id, name: project.name });
          }
        }
        
        projectId = project.id;
      }
    }

    // Criar tarefa no banco
    const task = await this.taskRepository.create(
      {
        content: cleanContent,
        dueDate: dueDate,
        projectId: projectId,
        projectColor: null // Cor será definida posteriormente via interface
      },
      tags
    );

    return this.formatTaskResponse(task);
  }

  /**
   * Atualiza uma tarefa existente
   * @param id - ID da tarefa
   * @param data - Dados para atualização
   * @returns Tarefa atualizada formatada ou null se não encontrada
   */
  async updateTask(id: string, data: UpdateTaskRequest): Promise<TaskResponse | null> {
    let processedData = { ...data };
    let tagNames: string[] | undefined;

    // Se o conteúdo foi alterado, processar com NLP
    if (data.content !== undefined) {
      const nlpResult = NLPProcessor.processContent(data.content);
      
      if (!NLPProcessor.isValidResult(nlpResult)) {
        throw new Error('Conteúdo da tarefa inválido após processamento NLP');
      }

      processedData.content = nlpResult.cleanContent;
      
      // Se NLP extraiu uma data e não foi fornecida explicitamente, usar a extraída
      if (nlpResult.dueDate && data.dueDate === undefined) {
        processedData.dueDate = nlpResult.dueDate;
      }

      // Se NLP extraiu um projeto e não foi fornecido explicitamente, buscar ou criar o projeto
      if (nlpResult.project && data.projectId === undefined) {
        let project = await this.projectRepository.findByName(nlpResult.project);
        
        if (!project) {
          // Criar novo projeto se não existir
          project = await this.projectRepository.create(nlpResult.project);
        }
        
        processedData.projectId = project.id;
      }

      // Usar tags extraídas do NLP
      tagNames = nlpResult.tags;
    }

    const task = await this.taskRepository.update(id, processedData, tagNames);
    return task ? this.formatTaskResponse(task) : null;
  }

  /**
   * Remove uma tarefa
   * @param id - ID da tarefa
   * @returns true se removida, false se não encontrada
   */
  async deleteTask(id: string): Promise<boolean> {
    return this.taskRepository.delete(id);
  }

  /**
   * Remove todas as tarefas concluídas
   * @returns Número de tarefas removidas
   */
  async deleteCompletedTasks(): Promise<number> {
    console.log('[DEBUG BACKEND] TaskService.deleteCompletedTasks - Iniciando processo de deleção');
    
    try {
      const deletedCount = await this.taskRepository.deleteCompletedTasks();
      console.log(`[DEBUG BACKEND] TaskService.deleteCompletedTasks - Processo concluído com sucesso. ${deletedCount} tarefas deletadas`);
      return deletedCount;
    } catch (error) {
      console.error('[DEBUG BACKEND] TaskService.deleteCompletedTasks - Erro no processo:', error);
      throw error;
    }
  }

  /**
   * Arquiva todas as tarefas concluídas
   * @returns Número de tarefas arquivadas
   */
  async archiveCompletedTasks(): Promise<number> {
    return this.taskRepository.archiveCompletedTasks();
  }

  /**
   * Alterna o status de conclusão de uma tarefa
   * @param id - ID da tarefa
   * @returns Tarefa atualizada ou null se não encontrada
   */
  async toggleTaskCompletion(id: string): Promise<TaskResponse | null> {
    const existingTask = await this.taskRepository.findById(id);
    if (!existingTask) {
      return null;
    }

    const task = await this.taskRepository.update(id, {
      completed: !existingTask.completed
    });

    return task ? this.formatTaskResponse(task) : null;
  }

  /**
   * Busca tarefas por filtros (para futuras funcionalidades)
   * @param filters - Filtros de busca
   * @returns Lista de tarefas filtradas
   */
  async getTasksByFilters(filters: {
    completed?: boolean;
    tagName?: string;
    limit?: number;
    offset?: number;
  }): Promise<TaskResponse[]> {
    const tasks = await this.taskRepository.findByFilters(filters);
    return tasks.map(this.formatTaskResponse);
  }

  /**
   * Formata uma tarefa do banco para resposta da API
   * @param task - Tarefa do banco com tags e projeto
   * @returns Tarefa formatada para resposta
   */
  private formatTaskResponse(task: Task & { tags: Tag[]; project?: Project | null }): TaskResponse {
    return {
      id: task.id,
      content: task.content,
      completed: task.completed,
      dueDate: task.dueDate?.toISOString() || null,
      projectId: task.projectId || null,
      projectColor: task.projectColor || null,
      project: task.project ? {
        id: task.project.id,
        name: task.project.name,
        createdAt: task.project.createdAt.toISOString(),
        updatedAt: task.project.updatedAt.toISOString()
      } : null,
      tags: task.tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color || null
      })),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    };
  }

  /**
   * Obtém estatísticas das tarefas (para futuras funcionalidades)
   * @returns Estatísticas das tarefas
   */
  async getTaskStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> {
    const allTasks = await this.taskRepository.findAll();
    const now = new Date();

    const stats = {
      total: allTasks.length,
      completed: allTasks.filter(task => task.completed).length,
      pending: allTasks.filter(task => !task.completed).length,
      overdue: allTasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        task.dueDate < now
      ).length
    };

    return stats;
  }

  /**
   * Atualiza o nome do projeto em todas as tarefas
   * @param oldName - Nome antigo do projeto
   * @param newName - Novo nome do projeto
   */
  async updateTasksProjectName(oldName: string, newName: string): Promise<void> {
    await this.taskRepository.updateProjectName(oldName, newName);
  }
}