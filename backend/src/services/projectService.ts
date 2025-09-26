import { ProjectRepository } from '../repositories/projectRepository';

export class ProjectService {
  private projectRepository: ProjectRepository;

  constructor(projectRepository: ProjectRepository) {
    this.projectRepository = projectRepository;
  }
  /**
   * Lista todos os projetos
   */
  async getAllProjects() {
    return await this.projectRepository.findAll();
  }

  /**
   * Busca um projeto por ID
   */
  async getProjectById(id: string) {
    return await this.projectRepository.findById(id);
  }

  /**
   * Busca um projeto por nome
   */
  async getProjectByName(name: string) {
    return await this.projectRepository.findByName(name);
  }

  /**
   * Cria um novo projeto
   */
  async createProject(name: string) {
    // Validar nome do projeto
    if (!name || name.trim().length === 0) {
      throw new Error('Nome do projeto é obrigatório');
    }

    const trimmedName = name.trim();

    // Verificar se já existe
    const exists = await this.projectRepository.exists(trimmedName);
    if (exists) {
      throw new Error('Projeto com este nome já existe');
    }

    return await this.projectRepository.create(trimmedName);
  }

  /**
   * Atualiza um projeto
   */
  async updateProject(id: string, name: string) {
    // Validar nome do projeto
    if (!name || name.trim().length === 0) {
      throw new Error('Nome do projeto é obrigatório');
    }

    const trimmedName = name.trim();

    // Verificar se o projeto existe
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    // Verificar se já existe outro projeto com o mesmo nome
    const existingProject = await this.projectRepository.findByName(trimmedName);
    if (existingProject && existingProject.id !== id) {
      throw new Error('Já existe um projeto com este nome');
    }

    // Atualizar o projeto
    const updatedProject = await this.projectRepository.update(id, trimmedName);

    // Atualizar as tarefas que usam o nome antigo
    if (project.name !== trimmedName) {
      // Aqui precisaríamos atualizar as tarefas, mas isso requer acesso ao TaskRepository
      // Por enquanto, vamos deixar essa responsabilidade para o controller
    }

    return updatedProject;
  }

  /**
   * Remove um projeto
   */
  async deleteProject(id: string) {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    return await this.projectRepository.remove(id);
  }

  /**
   * Verifica se um projeto existe
   */
  async projectExists(name: string): Promise<boolean> {
    return await this.projectRepository.exists(name);
  }

  /**
   * Conta quantas tarefas estão associadas a um projeto
   */
  async countProjectTasks(projectName: string): Promise<number> {
    return await this.projectRepository.countTasks(projectName);
  }
}