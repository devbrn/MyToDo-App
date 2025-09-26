const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

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
    this.baseURL = API_BASE_URL;
  }

  /**
   * Método genérico para fazer requisições HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Para respostas 204 (No Content), retornar objeto vazio
      if (response.status === 204) {
        return {} as T;
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      // Se a resposta tem estrutura {success: true, data: ...}, extrair os dados
      if (responseData.success && responseData.data !== undefined) {
        return responseData.data;
      }

      return responseData;
    } catch (error) {
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

  async createTag(data: CreateTagRequest): Promise<Tag> {
    return this.request<Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

export const api = new ApiService();
export const apiClient = api; // Alias para compatibilidade