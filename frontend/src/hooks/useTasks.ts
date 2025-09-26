import { useState, useEffect, useCallback } from 'react';
import { Task, UpdateTaskRequest, UseTasksReturn } from '@/types';
import { apiClient } from '@/services/api';

/**
 * Hook customizado para gerenciar o estado das tarefas
 * @returns Objeto com tarefas, estado de loading, funções de manipulação
 */
export function useTasks(onProjectCreated?: () => void): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega todas as tarefas do servidor
   */
  const refreshTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedTasks = await apiClient.getTasks();
      setTasks(fetchedTasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tarefas';
      setError(errorMessage);
      console.error('Erro ao carregar tarefas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Adiciona uma nova tarefa
   */
  const addTask = useCallback(async (content: string, projectId?: string | null) => {
    console.log('🔍 [DEBUG FRONTEND] Iniciando adição de tarefa:', {
      content,
      projectId,
      timestamp: new Date().toISOString()
    });

    try {
      setError(null);
      
      // Adicionar tarefa via API
      const newTask = await apiClient.createTask({ content, projectId });
      console.log('🔍 [DEBUG FRONTEND] Tarefa criada via API:', {
        id: newTask.id,
        content: newTask.content,
        project: newTask.project
      });

      // Atualizar lista local de tarefas (otimistic update)
      setTasks(prev => [newTask, ...prev]);

      // Se a tarefa tem um projeto associado, notificar para atualizar lista de projetos
      if (newTask.project) {
        console.log('🔍 [DEBUG FRONTEND] Notificando criação de projeto:', newTask.project.name);
        onProjectCreated?.(newTask.project);
      }

      return newTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar tarefa';
      setError(errorMessage);
      console.error('Erro ao adicionar tarefa:', err);
      throw err;
    }
  }, [onProjectCreated]);

  /**
   * Atualiza uma tarefa existente
   * @param id - ID da tarefa
   * @param data - Dados para atualização
   */
  const updateTask = useCallback(async (id: string, data: UpdateTaskRequest) => {
    try {
      setError(null);
      const updatedTask = await apiClient.updateTask(id, data);
      
      // Atualizar a tarefa na lista local
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === id ? updatedTask : task
        )
      );
      
      // Se a tarefa foi atualizada com um novo projeto e temos callback, chamar para atualizar projetos
      if (updatedTask.project && onProjectCreated) {
        onProjectCreated();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      setError(errorMessage);
      console.error('Erro ao atualizar tarefa:', err);
      throw err;
    }
  }, [onProjectCreated]);

  /**
   * Alterna o status de conclusão de uma tarefa
   * @param id - ID da tarefa
   */
  const toggleTask = useCallback(async (id: string) => {
    try {
      setError(null);
      
      // Optimistic update - atualizar UI imediatamente
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );

      // Fazer a requisição para o servidor
      const updatedTask = await apiClient.toggleTask(id);
      
      // Atualizar com os dados reais do servidor
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === id ? updatedTask : task
        )
      );
    } catch (err) {
      // Reverter o optimistic update em caso de erro
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alternar status da tarefa';
      setError(errorMessage);
      console.error('Erro ao alternar status da tarefa:', err);
      throw err;
    }
  }, []);

  // Deletar tarefa
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    // Optimistic update - remover da UI imediatamente
    const taskToDelete = tasks.find(task => task.id === id);
    
    try {
      setError(null);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));

      // Fazer a requisição para o servidor
      await apiClient.deleteTask(id);
    } catch (err) {
      // Reverter o optimistic update em caso de erro
      if (taskToDelete) {
        setTasks(prevTasks => [...prevTasks, taskToDelete]);
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar tarefa';
      setError(errorMessage);
      console.error('Erro ao deletar tarefa:', err);
      throw err;
    }
  }, [tasks]);

  /**
   * Remove todas as tarefas concluídas
   */
  const deleteCompletedTasks = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const result = await apiClient.deleteCompletedTasks();
      
      // Remover tarefas concluídas da lista local
      setTasks(prevTasks => prevTasks.filter(task => !task.completed));
      
      console.log(`${result.deletedCount} tarefas concluídas foram removidas`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar tarefas concluídas';
      setError(errorMessage);
      console.error('Erro ao deletar tarefas concluídas:', err);
      throw err;
    }
  }, []);

  /**
   * Arquiva todas as tarefas concluídas
   */
  const archiveCompletedTasks = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const result = await apiClient.archiveCompletedTasks();
      
      // Remover tarefas arquivadas da lista local (assumindo que não queremos mostrar arquivadas)
      setTasks(prevTasks => prevTasks.filter(task => !task.completed));
      
      console.log(`${result.archivedCount} tarefas concluídas foram arquivadas`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao arquivar tarefas concluídas';
      setError(errorMessage);
      console.error('Erro ao arquivar tarefas concluídas:', err);
      throw err;
    }
  }, []);

  // Carregar tarefas na inicialização (apenas uma vez)
  useEffect(() => {
    refreshTasks();
  }, []); // Dependência vazia para executar apenas uma vez

  // Limpar erro após 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
    // Não retorna nada quando error é null/undefined
    return undefined;
  }, [error]);

  return {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    deleteCompletedTasks,
    archiveCompletedTasks,
    refreshTasks
  };
}