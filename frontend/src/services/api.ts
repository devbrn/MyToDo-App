import { findWorkingApiUrl } from '../utils/portUtils';

// Configuração dinâmica da API
let API_BASE_URL: string;
let apiInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Inicializar URL da API de forma assíncrona
const initializeApiUrl = async (): Promise<void> => {
  if (apiInitialized) return;
  
  try {
    console.log('🔄 Inicializando configuração da API...');
    API_BASE_URL = await findWorkingApiUrl();
    console.log('✅ API configurada para:', API_BASE_URL);
    apiInitialized = true;
  } catch (error) {
    console.error('❌ Erro ao inicializar URL da API:', error);
    API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    console.log('⚠️ Usando URL de fallback:', API_BASE_URL);
    apiInitialized = true;
  }
};

// Função para garantir que a API está inicializada
const ensureApiInitialized = async (): Promise<void> => {
  if (apiInitialized) return;
  
  if (!initializationPromise) {
    initializationPromise = initializeApiUrl();
  }
  
  await initializationPromise;
};

export interface Task {
  id: string;
  content: string;
  completed: boolean;
  dueDate?: string;
  project?: string;
  projectColor?: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  content: string;
  dueDate?: string;
  project?: string;
  projectColor?: string;
  tags?: string[];
}

export interface UpdateTaskRequest {
  content?: string;
  completed?: boolean;
  dueDate?: string;
  project?: string;
  projectColor?: string;
  tags?: string[];
}

export interface CreateProjectRequest {
  name: string;
}

export interface UpdateProjectRequest {
  name: string;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface UpdateTagRequest {
  name: string;
  color?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL || 'http://localhost:3001/api';
  }

  /**
   * Atualiza a URL base da API dinamicamente
   */
  public updateBaseURL(newBaseURL: string): void {
    this.baseURL = newBaseURL;
    console.log(`🔄 URL da API atualizada para: ${this.baseURL}`);
  }

  /**
   * Obtém a URL base atual da API
   */
  public getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Método genérico para fazer requisições HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Garantir que a API está inicializada antes de fazer requisições
    await ensureApiInitialized();
    
    // Garantir que temos uma URL válida
    if (!this.baseURL || this.baseURL === 'http://localhost:3001/api') {
      this.baseURL = API_BASE_URL;
    }
    
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`[DEBUG] request - ${options.method || 'GET'} ${endpoint}`, { data: options.body, apiUrl: this.baseURL });
    
    try {
      console.log(`[DEBUG] request - Fazendo fetch para: ${url}`, options);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      console.log(`[DEBUG] request - Response status: ${response.status}`, response);

      // Para respostas 204 (No Content), retornar objeto vazio
      if (response.status === 204) {
        return {} as T;
      }

      const responseData = await response.json();
      
      console.log(`[DEBUG] request - Response data:`, responseData);

      if (!response.ok) {
        console.error(`[DEBUG] request - Erro HTTP:`, { status: response.status, data: responseData });
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      // Se a resposta tem estrutura {success: true, data: ...}, extrair os dados
      if (responseData.success && responseData.data !== undefined) {
        return responseData.data;
      }

      return responseData;
    } catch (error) {
      console.error(`[DEBUG] request - Erro na requisição:`, error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Erro de rede detectado - possível problema de CORS ou conectividade:', error);
      }
      throw error;
    }
  }

  // ========== TASKS ==========
  async getTasks(): Promise<Task[]> {
    return this.request<Task[]>('/tasks');
  }

  async getTask(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`);
  }

  async createTask(data: CreateTaskRequest): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleTask(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteTask(id: string): Promise<void> {
    await this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Remove todas as tarefas concluídas
   */
  async deleteCompletedTasks(): Promise<{ deletedCount: number }> {
    return this.request('/tasks/completed', {
      method: 'DELETE',
    });
  }

  /**
   * Arquiva todas as tarefas concluídas
   */
  async archiveCompletedTasks(): Promise<{ archivedCount: number }> {
    return this.request('/tasks/completed/archive', {
      method: 'PATCH',
    });
  }

  // ========== PROJECTS ==========
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    await this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== TAGS ==========
  async getTags(): Promise<Tag[]> {
    return this.request<Tag[]>('/tags');
  }

  async getTag(id: string): Promise<Tag> {
    return this.request<Tag>(`/tags/${id}`);
  }

  /**
   * Cria uma nova tag
   */
  async createTag(data: CreateTagRequest): Promise<Tag> {
    console.log('[DEBUG] createTag - Dados enviados:', data);
    console.log('[DEBUG] createTag - URL da API:', this.baseURL);
    console.log('[DEBUG] createTag - URL completa:', `${this.baseURL}/tags`);
    
    try {
      const result = await this.request<Tag>('/tags', {
        method: 'POST',
        body: data, // Removendo JSON.stringify - o método request já faz isso
      });
      console.log('[DEBUG] createTag - Sucesso:', result);
      return result;
    } catch (error) {
      console.error('[DEBUG] createTag - Erro capturado:', error);
      console.error('[DEBUG] createTag - Tipo do erro:', typeof error);
      console.error('[DEBUG] createTag - Stack trace:', error instanceof Error ? error.stack : 'N/A');
      throw error;
    }
  }

  async updateTag(id: string, data: UpdateTagRequest): Promise<Tag> {
    return this.request<Tag>(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTag(id: string): Promise<void> {
    await this.request<void>(`/tags/${id}`, {
      method: 'DELETE',
    });
  }
}

// Criar instância da API
export const api = new ApiService();
export const apiClient = api; // Alias para compatibilidade

// A inicialização será feita automaticamente quando necessário via ensureApiInitialized()