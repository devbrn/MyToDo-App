import { useState, useEffect, useCallback } from 'react';
import { api, Project, CreateProjectRequest, UpdateProjectRequest } from '@/services/api';
import { normalizeProjectName } from '@/utils/normalizeProjectName';

/**
 * Hook para gerenciar projetos
 * Fornece funcionalidades para listar, criar, atualizar e remover projetos
 */
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega todos os projetos
   */
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await api.getProjects();
      setProjects(projectsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar projetos';
      setError(errorMessage);
      console.error('Erro ao carregar projetos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria um novo projeto
   */
  const createProject = useCallback(async (data: CreateProjectRequest): Promise<Project | null> => {
    console.log('🔍 [DEBUG FRONTEND PROJECTS] Tentando criar projeto:', data.name);
    
    // Verificar se o projeto já existe localmente antes de fazer a requisição
    const existingLocalProject = projects.find(p => p?.name?.toLowerCase() === data.name.toLowerCase());
    if (existingLocalProject) {
      console.log('🔍 [DEBUG FRONTEND PROJECTS] Projeto já existe na lista local:', existingLocalProject.id);
      return existingLocalProject;
    }
    
    try {
      setError(null);
      const newProject = await api.createProject(data);
      console.log('🔍 [DEBUG FRONTEND PROJECTS] Projeto criado com sucesso:', {
        id: newProject.id,
        name: newProject.name
      });
      
      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (err) {
      let errorMessage = 'Erro ao criar projeto';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        console.log('🔍 [DEBUG FRONTEND PROJECTS] Erro ao criar projeto:', errorMessage);
        
        // Se o erro indica que o projeto já existe, perguntar se quer usar o existente
        if (err.message.includes('já existe')) {
          console.log('🔍 [DEBUG FRONTEND PROJECTS] Projeto já existe, perguntando ao usuário');
          
          const shouldUseExisting = window.confirm(
            `Um projeto com o nome "${data.name}" já existe. Deseja usar o projeto existente?`
          );
          
          if (shouldUseExisting) {
            console.log('🔍 [DEBUG FRONTEND PROJECTS] Usuário escolheu usar projeto existente');
            
            // Buscar o projeto existente pelo nome (case-insensitive)
            const existingProject = projects.find(p => p?.name?.toLowerCase() === data.name.toLowerCase());
            if (existingProject) {
              console.log('🔍 [DEBUG FRONTEND PROJECTS] Projeto existente encontrado na lista local:', existingProject.id);
              return existingProject;
            }
            
            // Se não encontrou na lista local, recarregar projetos
            console.log('🔍 [DEBUG FRONTEND PROJECTS] Projeto não encontrado na lista local, recarregando');
            await loadProjects();
            
            // Buscar novamente após recarregar (aguardar atualização do estado)
            const updatedProjects = await api.getProjects();
            const updatedProject = updatedProjects.find(p => p?.name?.toLowerCase() === data.name.toLowerCase());
            if (updatedProject) {
              console.log('🔍 [DEBUG FRONTEND PROJECTS] Projeto encontrado após recarregar:', updatedProject.id);
              return updatedProject;
            }
          }
        }
      }
      
      setError(errorMessage);
      console.error('Erro ao criar projeto:', err);
      return null;
    }
  }, [projects, loadProjects]);

  /**
   * Atualiza um projeto existente
   */
  const updateProject = useCallback(async (id: string, data: UpdateProjectRequest): Promise<Project | null> => {
    try {
      setError(null);
      const updatedProject = await api.updateProject(id, data);
      setProjects(prev => prev.map(project => 
        project.id === id ? updatedProject : project
      ));
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar projeto';
      setError(errorMessage);
      console.error('Erro ao atualizar projeto:', err);
      return null;
    }
  }, []);

  /**
   * Remove um projeto
   */
  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await api.deleteProject(id);
      setProjects(prev => prev.filter(project => project.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover projeto';
      setError(errorMessage);
      console.error('Erro ao remover projeto:', err);
      return false;
    }
  }, []);

  /**
   * Busca um projeto por nome (usando normalização para comparação)
   */
  const findProjectByName = useCallback((name: string): Project | undefined => {
    const normalizedSearchName = normalizeProjectName(name);
    
    // Primeiro, tentar buscar por nome exato
    const exactMatch = projects.find(project => project.name === name);
    if (exactMatch) return exactMatch;
    
    // Se não encontrou, buscar por nome normalizado
    return projects.find(project => {
      const projectNormalized = normalizeProjectName(project.name);
      return projectNormalized === normalizedSearchName;
    });
  }, [projects]);

  /**
   * Verifica se um projeto existe (usando normalização para comparação)
   */
  const projectExists = useCallback((name: string): boolean => {
    const normalizedSearchName = normalizeProjectName(name);
    
    // Primeiro, verificar por nome exato
    const exactMatch = projects.some(project => project.name === name);
    if (exactMatch) return true;
    
    // Se não encontrou, verificar por nome normalizado
    return projects.some(project => {
      const projectNormalized = normalizeProjectName(project.name);
      return projectNormalized === normalizedSearchName;
    });
  }, [projects]);

  // Carrega projetos na inicialização (apenas uma vez)
  useEffect(() => {
    loadProjects();
  }, []); // Dependência vazia para executar apenas uma vez

  return {
    projects,
    loading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    findProjectByName,
    projectExists,
  };
};