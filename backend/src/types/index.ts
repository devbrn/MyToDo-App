/**
 * Tipos principais da aplicação MyToDo
 */

// Tipo base para uma tarefa
export interface Task {
  id: string;
  content: string;
  completed: boolean;
  dueDate: Date | null;
  projectId: string | null;
  projectColor: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
  project?: Project | null;
}

// Tipo base para um projeto
export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Task[];
}

// Tipo base para uma tag
export interface Tag {
  id: string;
  name: string;
  color: string | null;
  tasks: Task[];
}

// DTOs para requisições da API
export interface CreateTaskRequest {
  content: string;
  projectId?: string | null;
}

export interface UpdateTaskRequest {
  content?: string;
  completed?: boolean;
  dueDate?: Date | null;
  projectId?: string | null;
  projectColor?: string | null;
}

// DTOs para respostas da API
export interface TaskResponse {
  id: string;
  content: string;
  completed: boolean;
  dueDate: string | null;
  projectId: string | null;
  projectColor: string | null;
  createdAt: string;
  updatedAt: string;
  tags: TagResponse[];
  project?: ProjectResponse | null;
}

export interface TagResponse {
  id: string;
  name: string;
  color: string | null;
}

export interface ProjectResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Resultado do processamento NLP
export interface NLPResult {
  cleanContent: string;
  dueDate: Date | null;
  tags: string[];
  project: string | null; // Nome do projeto (será convertido para projectId)
}

// Tipos para validação com Zod
export interface ValidationError {
  field: string;
  message: string;
}

// Resposta padrão da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errors?: ValidationError[];
  details?: any; // Para detalhes adicionais de erro (ex: validação Zod)
}