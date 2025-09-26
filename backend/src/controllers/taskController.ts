import { Request, Response } from 'express';
import { TaskService } from '@/services/taskService';
import { 
  createTaskSchema, 
  updateTaskSchema, 
  taskIdSchema,
  taskQuerySchema,
  formatZodError 
} from '@/utils/validation';
import { ApiResponse, UpdateTaskRequest } from '@/types';

/**
 * Controlador para operações relacionadas a tarefas
 */
export class TaskController {
  private taskService: TaskService;

  constructor(taskService: TaskService) {
    this.taskService = taskService;
  }

  /**
   * Lista todas as tarefas
   * GET /api/tasks
   */
  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      // Validar query parameters (para futuras funcionalidades)
      const queryValidation = taskQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Parâmetros de consulta inválidos',
          details: formatZodError(queryValidation.error)
        };
        res.status(400).json(response);
        return;
      }

      const tasks = await this.taskService.getAllTasks();
      
      const response: ApiResponse<typeof tasks> = {
        success: true,
        data: tasks
      };
      
      res.json(response);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Busca uma tarefa por ID
   * GET /api/tasks/:id
   */
  async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      // Validar parâmetros da rota
      const paramValidation = taskIdSchema.safeParse(req.params);
      if (!paramValidation.success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'ID da tarefa inválido',
          details: formatZodError(paramValidation.error)
        };
        res.status(400).json(response);
        return;
      }

      const { id } = paramValidation.data;
      const task = await this.taskService.getTaskById(id);

      if (!task) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Tarefa não encontrada'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof task> = {
        success: true,
        data: task
      };
      
      res.json(response);
    } catch (error) {
      console.error('Erro ao buscar tarefa:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Cria uma nova tarefa
   * POST /api/tasks
   */
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      // Validar dados da requisição
      const bodyValidation = createTaskSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Dados da tarefa inválidos',
          details: formatZodError(bodyValidation.error)
        };
        res.status(400).json(response);
        return;
      }

      const task = await this.taskService.createTask(bodyValidation.data);
      
      const response: ApiResponse<typeof task> = {
        success: true,
        data: task
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      
      // Tratar erros específicos de validação de negócio
      if (error instanceof Error && error.message.includes('NLP')) {
        const response: ApiResponse<null> = {
          success: false,
          error: error.message
        };
        res.status(400).json(response);
        return;
      }

      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Atualiza uma tarefa existente
   * PUT /api/tasks/:id
   */
  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      // Log detalhado para debug
      console.log('🔍 [DEBUG BACKEND] Recebendo requisição de atualização:', {
        method: req.method,
        url: req.url,
        params: req.params,
        body: req.body,
        bodyType: typeof req.body,
        bodyKeys: req.body ? Object.keys(req.body) : 'null',
        rawBody: JSON.stringify(req.body),
        contentType: req.headers['content-type']
      });

      // Validar parâmetros da rota
      const paramValidation = taskIdSchema.safeParse(req.params);
      if (!paramValidation.success) {
        console.log('❌ [DEBUG] Erro na validação de parâmetros:', paramValidation.error);
        const response: ApiResponse<null> = {
          success: false,
          error: 'ID da tarefa inválido',
          details: formatZodError(paramValidation.error)
        };
        res.status(400).json(response);
        return;
      }

      // Validar dados da requisição
      const bodyValidation = updateTaskSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        console.log('❌ [DEBUG] Erro na validação do body:', {
          error: bodyValidation.error,
          receivedBody: req.body
        });
        const response: ApiResponse<null> = {
          success: false,
          error: 'Dados da tarefa inválidos',
          details: formatZodError(bodyValidation.error)
        };
        res.status(400).json(response);
        return;
      }

      const { id } = paramValidation.data;
      const updateData = bodyValidation.data as UpdateTaskRequest;
      
      console.log('✅ [DEBUG] Dados validados com sucesso:', {
        id,
        updateData
      });

      const task = await this.taskService.updateTask(id, updateData);

      if (!task) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Tarefa não encontrada'
        };
        res.status(404).json(response);
        return;
      }

      console.log('✅ [DEBUG] Tarefa atualizada com sucesso:', task.id);

      const response: ApiResponse<typeof task> = {
        success: true,
        data: task
      };
      
      res.json(response);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      
      // Tratar erros específicos de validação de negócio
      if (error instanceof Error && error.message.includes('NLP')) {
        const response: ApiResponse<null> = {
          success: false,
          error: error.message
        };
        res.status(400).json(response);
        return;
      }

      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Remove uma tarefa
   * DELETE /api/tasks/:id
   */
  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      // Validar parâmetros da rota
      const paramValidation = taskIdSchema.safeParse(req.params);
      if (!paramValidation.success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'ID da tarefa inválido',
          details: formatZodError(paramValidation.error)
        };
        res.status(400).json(response);
        return;
      }

      const { id } = paramValidation.data;
      const deleted = await this.taskService.deleteTask(id);

      if (!deleted) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Tarefa não encontrada'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<null> = {
        success: true,
        data: null
      };
      
      res.json(response);
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Remove todas as tarefas concluídas
   * DELETE /api/tasks/completed
   */
  async deleteCompletedTasks(req: Request, res: Response): Promise<void> {
    console.log('[DEBUG BACKEND] TaskController.deleteCompletedTasks - Recebida requisição DELETE /api/tasks/completed');
    
    try {
      const deletedCount = await this.taskService.deleteCompletedTasks();
      console.log(`[DEBUG BACKEND] TaskController.deleteCompletedTasks - Sucesso: ${deletedCount} tarefas deletadas`);

      const response: ApiResponse<{ deletedCount: number }> = {
        success: true,
        data: { deletedCount }
      };
      
      res.json(response);
    } catch (error) {
      console.error('[DEBUG BACKEND] TaskController.deleteCompletedTasks - Erro capturado:', error);
      console.error('[DEBUG BACKEND] TaskController.deleteCompletedTasks - Stack trace:', error instanceof Error ? error.stack : 'N/A');
      
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Arquiva todas as tarefas concluídas
   * PATCH /api/tasks/completed/archive
   */
  async archiveCompletedTasks(req: Request, res: Response): Promise<void> {
    try {
      const archivedCount = await this.taskService.archiveCompletedTasks();

      const response: ApiResponse<{ archivedCount: number }> = {
        success: true,
        data: { archivedCount }
      };
      
      res.json(response);
    } catch (error) {
      console.error('Erro ao arquivar tarefas concluídas:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Alterna o status de conclusão de uma tarefa
   * PATCH /api/tasks/:id/toggle
   */
  async toggleTaskCompletion(req: Request, res: Response): Promise<void> {
    try {
      // Validar parâmetros da rota
      const paramValidation = taskIdSchema.safeParse(req.params);
      if (!paramValidation.success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'ID da tarefa inválido',
          details: formatZodError(paramValidation.error)
        };
        res.status(400).json(response);
        return;
      }

      const { id } = paramValidation.data;
      const task = await this.taskService.toggleTaskCompletion(id);

      if (!task) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Tarefa não encontrada'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof task> = {
        success: true,
        data: task
      };
      
      res.json(response);
    } catch (error) {
      console.error('Erro ao alternar status da tarefa:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }
}