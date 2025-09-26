import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProjectRepository {
  /**
   * Busca todos os projetos, incluindo aqueles sem tarefas associadas
   */
  async findAll() {
    return await prisma.project.findMany({
      orderBy: { name: 'asc' }
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
   * Busca um projeto pelo nome (case-insensitive)
   */
  async findByName(name: string) {
    console.log('🔍 [DEBUG BACKEND] ProjectRepository.findByName - Buscando projeto:', name);
    
    try {
      // Buscar projeto com comparação case-insensitive exata
      // SQLite não suporta mode insensitive nativo, então fazemos busca manual
      const allProjects = await prisma.project.findMany();
      
      // Primeiro, tentar match exato (case-sensitive)
      const exactMatch = allProjects.find(project => project.name === name);
      if (exactMatch) {
        console.log('🔍 [DEBUG BACKEND] ProjectRepository.findByName - Encontrado match exato:', exactMatch.id);
        return exactMatch;
      }
      
      // Se não encontrou match exato, tentar match case-insensitive
      const caseInsensitiveMatch = allProjects.find(project => 
        project.name.toLowerCase() === name.toLowerCase()
      );
      
      if (caseInsensitiveMatch) {
        console.log('🔍 [DEBUG BACKEND] ProjectRepository.findByName - Encontrado match case-insensitive:', caseInsensitiveMatch.id);
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
   * Cria um novo projeto
   */
  async create(name: string) {
    console.log('🔍 [DEBUG PROJECT REPO] Criando projeto:', name);
    
    const project = await prisma.project.create({
      data: { name }
    });
    
    console.log('🔍 [DEBUG PROJECT REPO] Projeto criado com sucesso:', { id: project.id, name: project.name });
    return project;
  }

  /**
   * Atualiza um projeto
   */
  async update(id: string, name: string) {
    return await prisma.project.update({
      where: { id },
      data: { name }
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