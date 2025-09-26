import { Router, Request, Response } from 'express';
import { ProjectService } from '@/services/projectService';
import { TaskService } from '@/services/taskService';
import { ProjectRepository } from '@/repositories/projectRepository';
import { TaskRepository } from '@/repositories/taskRepository';
import { getPrismaClient } from '@/config/database';

const router = Router();
const prisma = getPrismaClient();

// Inicializar repositórios e serviços
const projectRepository = new ProjectRepository();
const taskRepository = new TaskRepository(prisma);
const projectService = new ProjectService(projectRepository);
const taskService = new TaskService(taskRepository);

/**
 * GET /api/projects - Lista todos os projetos
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await projectService.getAllProjects();
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

/**
 * GET /api/projects/:id - Busca um projeto por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID do projeto é obrigatório' });
    }
    
    const project = await projectService.getProjectById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    return res.json(project);
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/projects - Cria um novo projeto
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false,
        error: 'Nome do projeto é obrigatório' 
      });
    }
    
    // Verificar se já existe um projeto com esse nome
    const existingProject = await projectService.getProjectByName(name.trim());
    if (existingProject) {
      return res.status(409).json({ 
        success: false,
        error: 'Projeto com este nome já existe',
        existingProject: existingProject
      });
    }
    
    const project = await projectService.createProject(name);
    return res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('já existe')) {
        return res.status(409).json({ 
          success: false,
          error: error.message 
        });
      }
      if (error.message.includes('obrigatório')) {
        return res.status(400).json({ 
          success: false,
          error: error.message 
        });
      }
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

/**
 * PUT /api/projects/:id - Atualiza um projeto
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID do projeto é obrigatório' });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Nome do projeto é obrigatório' });
    }
    
    // Buscar o projeto atual para obter o nome antigo
    const currentProject = await projectService.getProjectById(id);
    if (!currentProject) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const updatedProject = await projectService.updateProject(id, name);
    
    // Se o nome mudou, atualizar as tarefas
    if (currentProject.name !== name) {
      await taskService.updateTasksProjectName(currentProject.name, name);
    }
    
    return res.json(updatedProject);
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('já existe')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('obrigatório')) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/projects/:id - Remove um projeto
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID do projeto é obrigatório' });
    }
    
    const result = await projectService.deleteProject(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover projeto:', error);
    
    if (error instanceof Error && error.message.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;