import { Router } from 'express';
import { TaskController } from '@/controllers/taskController';

/**
 * Configuração das rotas para tarefas
 * @param taskController - Instância do controlador de tarefas
 * @returns Router configurado
 */
export function createTaskRoutes(taskController: TaskController): Router {
  const router = Router();

  // GET /api/tasks - Lista todas as tarefas
  router.get('/', (req, res) => taskController.getAllTasks(req, res));

  // GET /api/tasks/:id - Busca uma tarefa por ID
  router.get('/:id', (req, res) => taskController.getTaskById(req, res));

  // POST /api/tasks - Cria uma nova tarefa
  router.post('/', (req, res) => taskController.createTask(req, res));

  // PUT /api/tasks/:id - Atualiza uma tarefa
  router.put('/:id', (req, res) => taskController.updateTask(req, res));

  // DELETE /api/tasks/completed - Remove todas as tarefas concluídas
  router.delete('/completed', (req, res) => taskController.deleteCompletedTasks(req, res));

  // PATCH /api/tasks/completed/archive - Arquiva todas as tarefas concluídas
  router.patch('/completed/archive', (req, res) => taskController.archiveCompletedTasks(req, res));

  // DELETE /api/tasks/:id - Remove uma tarefa
  router.delete('/:id', (req, res) => taskController.deleteTask(req, res));

  // PATCH /api/tasks/:id/toggle - Alterna status de conclusão
  router.patch('/:id/toggle', (req, res) => taskController.toggleTaskCompletion(req, res));

  return router;
}