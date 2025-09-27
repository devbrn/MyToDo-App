import { getPrismaClient } from '../config/database';
import { normalizeProjectName } from '../utils/validation';

const prisma = getPrismaClient();

/**
 * Repositório para operações com projetos
 */
export class ProjectRepository {
  /**
   * Lista todos os projetos
   */
  async findAll() {
    return await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Busca um projeto por ID
   */
  async findById(id: string) {
    return await prisma.project.findUnique({
      where: { id }
    });
  }

  /**
   * Busca um projeto pelo nome normalizado (evita duplicações)
   */
  async findByName(name: string) {
    console.log('🔍 [DEBUG BACKEND] ProjectRepository.findByName - Buscando projeto:', name);
    
    try {
      const normalizedName = normalizeProjectName(name);
      console.log('🔍 [DEBUG BACKEND] ProjectRepository.findByName - Nome normalizado:', normalizedName);
      
      // Primeiro, buscar pelo nome normalizado
      const projectByNormalized = await prisma.project.findFirst({
        where: { normalizedName }
      });
      
      if (projectByNormalized) {
        console.log('🔍 [DEBUG BACKEND] ProjectRepository.findByName - Encontrado por nome normalizado:', projectByNormalized.id);
        return projectByNormalized;
      }
      
      // Se não encontrou pelo normalizado, buscar pelo nome original (para compatibilidade com dados antigos)
      const allProjects = await prisma.project.findMany();
      
      // Primeiro, tentar match exato (case-sensitive)
      const exactMatch = allProjects.find(project => project.name === name);
      if (exactMatch) {
        console.log('🔍 [DEBUG BACKEND] ProjectRepository.findByName - Encontrado match exato:', exactMatch.id);
        // Atualizar com nome normalizado se não tiver
        if (!exactMatch.normalizedName) {
          await this.updateNormalizedName(exactMatch.id, normalizedName);
        }
        return exactMatch;
      }
      
      // Se não encontrou match exato, tentar match case-insensitive
      const caseInsensitiveMatch = allProjects.find(project => 
        project.name.toLowerCase() === name.toLowerCase()
      );
      
      if (caseInsensitiveMatch) {
        console.log('🔍 [DEBUG BACKEND] ProjectRepository.findByName - Encontrado match case-insensitive:', caseInsensitiveMatch.id);
        // Atualizar com nome normalizado se não tiver
        if (!caseInsensitiveMatch.normalizedName) {
          await this.updateNormalizedName(caseInsensitiveMatch.id, normalizedName);
        }
      } else {
        console.log('🔍 [DEBUG BACKEND] ProjectRepository.findByName - Nenhum projeto encontrado');
      }
      
      return caseInsensitiveMatch || null;
    } catch (error) {
      console.error('🔍 [DEBUG BACKEND] ProjectRepository.findByName - Erro na busca:', error);
      throw error;
    }
  }

  /**
   * Cria um novo projeto com nome normalizado
   */
  async create(name: string) {
    console.log('🔍 [DEBUG PROJECT REPO] Criando projeto:', name);
    
    const normalizedName = normalizeProjectName(name);
    console.log('🔍 [DEBUG PROJECT REPO] Nome normalizado:', normalizedName);
    
    const project = await prisma.project.create({
      data: { 
        name,
        normalizedName
      }
    });
    
    console.log('🔍 [DEBUG PROJECT REPO] Projeto criado com sucesso:', { id: project.id, name: project.name, normalizedName: project.normalizedName });
    return project;
  }

  /**
   * Atualiza um projeto
   */
  async update(id: string, name: string) {
    const normalizedName = normalizeProjectName(name);
    
    return await prisma.project.update({
      where: { id },
      data: { 
        name,
        normalizedName
      }
    });
  }

  /**
   * Atualiza apenas o nome normalizado de um projeto
   */
  private async updateNormalizedName(id: string, normalizedName: string) {
    return await prisma.project.update({
      where: { id },
      data: { normalizedName }
    });
  }

  /**
   * Remove um projeto e atualiza as tarefas associadas
   */
  async remove(id: string) {
    const project = await this.findById(id);
    if (!project) return null;

    // Primeiro, remove a referência do projeto das tarefas
    await prisma.task.updateMany({
      where: { projectId: id },
      data: { 
        projectId: null,
        projectColor: null
      }
    });

    // Depois remove o projeto
    return await prisma.project.delete({
      where: { id }
    });
  }

  /**
   * Verifica se um projeto existe
   */
  async exists(name: string): Promise<boolean> {
    const project = await this.findByName(name);
    return !!project;
  }

  /**
   * Conta quantas tarefas estão associadas a um projeto
   */
  async countTasks(projectName: string): Promise<number> {
    // Primeiro, encontrar o projeto pelo nome
    const project = await prisma.project.findUnique({
      where: { name: projectName }
    });
    
    if (!project) {
      return 0; // Se o projeto não existe, retorna 0 tarefas
    }

    // Contar tarefas usando projectId
    return await prisma.task.count({
      where: { projectId: project.id }
    });
  }
}