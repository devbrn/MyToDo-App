/**
 * Tipos TypeScript para o frontend da aplicação MyToDo
 */

// Tipos de dados principais
export interface Task {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  tags?: (string | Tag)[];
  projectId?: string | null; // ID do projeto associado
  project?: Project | null; // Objeto do projeto associado
  projectColor?: string; // Cor do projeto
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color?: string; // Cor da tag
}

// Tipos para requisições da API
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

// Tipos para respostas da API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

// Tipos para componentes
export interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => Promise<void>;
  onUpdate: (data: UpdateTaskRequest) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit?: (task: Task) => void; // Callback para abrir modal de edição
  projects?: Project[]; // Lista de projetos para o modal de edição
  tags?: Tag[]; // Lista de tags para o modal de edição
  onCreateProject?: (name: string) => Promise<Project | null>;
  onCreateTag?: (name: string) => Promise<Tag | null>;
}

export interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => Promise<void>;
  onUpdate: (id: string, data: UpdateTaskRequest) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

export interface AddTaskFormProps {
  onAdd: (content: string, projectId?: string | null) => void;
  isLoading: boolean;
  projects?: Project[];
  tags?: Tag[];
  onCreateProject?: (name: string) => Promise<Project | null>;
  onCreateTag?: (name: string) => Promise<Tag | null>;
  selectedFilter?: string; // Filtro ativo para contexto automático
}

// Tipos para hooks
export interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  addTask: (content: string) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskRequest) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteCompletedTasks: () => Promise<void>;
  archiveCompletedTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
}

// Tipos para contexto de teclado
export interface KeyboardContextType {
  focusedTaskId: string | null;
  editingTaskId: string | null;
  setFocusedTask: (id: string | null) => void;
  setEditingTask: (id: string | null) => void;
  handleKeyDown: (event: KeyboardEvent) => void;
}

// Tipos para utilitários
export interface NLPPreview {
  cleanContent: string;
  dueDate: Date | null;
  tags: string[];
  project?: string; // Novo campo para projetos
  hasChanges: boolean;
}