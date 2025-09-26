import { useState, useEffect } from 'react';
import { AddTaskForm } from '@/components/AddTaskForm';
import { TaskStats } from '@/components/TaskStats';
import { TaskList } from '@/components/TaskList';
import { Sidebar } from '@/components/Sidebar';
import { ProjectModal } from '@/components/ProjectModal';
import { TagModal } from '@/components/TagModal';
import { TaskEditModal } from '@/components/TaskEditModal';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useTags } from '@/hooks/useTags';
import { Task, Project, Tag } from '@/types';

/**
 * Componente principal da aplicação MyToDo - Interface Minimalista
 */
function App() {
  // Primeiro declaramos os hooks de projetos e tags
  const { projects, createProject, updateProject, deleteProject, loadProjects } = useProjects();
  const { tags, createTag, updateTag, deleteTag } = useTags();

  // Depois declaramos o hook de tasks, que pode usar loadProjects
  const {
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
  } = useTasks(() => {
    // Callback para atualizar projetos quando um novo projeto é criado via parsing
    loadProjects();
  });

  const [showError, setShowError] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('today');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filtrar tarefas baseado no filtro selecionado
  const filteredTasks = Array.isArray(tasks) ? tasks.filter(task => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (selectedFilter) {
      case 'inbox':
        return true; // Mostrar todas as tarefas
      case 'pending':
        return !task.completed; // Apenas tarefas pendentes
      case 'completed':
        return task.completed; // Apenas tarefas concluídas
      case 'today':
        // Mostrar tarefas pendentes de hoje OU tarefas pendentes sem data específica
        return !task.completed && (
          !task.dueDate || // Tarefas sem data específica
          new Date(task.dueDate).toDateString() === today.toDateString() // Tarefas de hoje
        );
      case 'tomorrow':
        return task.dueDate && 
               new Date(task.dueDate).toDateString() === tomorrow.toDateString();
      case 'upcoming':
        return task.dueDate && new Date(task.dueDate) > tomorrow;
      default:
        if (selectedFilter.startsWith('project:')) {
          const projectName = selectedFilter.replace('project:', '');
          return task.project?.name === projectName;
        }
        if (selectedFilter.startsWith('tag:')) {
          const tagName = selectedFilter.replace('tag:', '');
          return task.tags?.some(tag => 
            typeof tag === 'string' ? tag === tagName : tag.name === tagName
          );
        }
        return true;
    }
  }) : [];

  // Mostrar/ocultar mensagens de erro
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error]);

  /**
   * Manipula atalhos de teclado globais
   */
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + R para atualizar
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshTasks();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [refreshTasks]);

  /**
   * Manipula a criação de um novo projeto
   */
  const handleCreateProject = () => {
    setEditingProject(null);
    setShowProjectModal(true);
  };

  /**
   * Manipula a edição de um projeto existente
   */
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };

  /**
   * Manipula a exclusão de um projeto
   */
  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
    }
  };

  /**
   * Manipula o salvamento do projeto (criar ou editar)
   */
  const handleSaveProject = async (projectData: { name: string; color?: string }) => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, projectData);
      } else {
        const result = await createProject(projectData);
        // Se o resultado for null, significa que houve um erro ou o usuário cancelou
        if (!result) {
          return; // Não fechar o modal para permitir correção
        }
      }
      setShowProjectModal(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      // Não fechar o modal em caso de erro para permitir correção
    }
  };

  /**
   * Fecha o modal de projeto
   */
  const handleCloseProjectModal = () => {
    setShowProjectModal(false);
    setEditingProject(null);
  };

  /**
   * Abre o modal para criar uma nova tag
   */
  const handleCreateTag = () => {
    setEditingTag(null);
    setShowTagModal(true);
  };

  /**
   * Abre o modal para editar uma tag existente
   */
  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setShowTagModal(true);
  };

  /**
   * Exclui uma tag
   */
  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTag(tagId);
    } catch (error) {
      console.error('Erro ao excluir tag:', error);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };

  /**
   * Salva uma tag (criar ou editar)
   */
  const handleSaveTag = async (data: { name: string; color?: string | null }) => {
    try {
      if (editingTag) {
        // Editar tag existente
        await updateTag(editingTag.id, data);
      } else {
        // Criar nova tag
        await createTag(data);
      }
      setShowTagModal(false);
      setEditingTag(null);
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      throw error; // Deixar o modal tratar o erro
    }
  };

  /**
   * Fecha o modal de tag
   */
  const handleCloseTagModal = () => {
    setShowTagModal(false);
    setEditingTag(null);
  };

  /**
   * Abre o modal de edição de tarefa
   */
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  /**
   * Fecha o modal de edição de tarefa
   */
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTask(null);
  };

  return (
    <div className="app">
      {/* Mensagem de Erro Simples */}
      {showError && error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="app-layout">
        {/* Menu Lateral */}
        <Sidebar
          projects={projects}
          tags={tags}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          onCreateProject={handleCreateProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onCreateTag={handleCreateTag}
          onEditTag={handleEditTag}
          onDeleteTag={handleDeleteTag}
        />

        {/* Conteúdo Principal - Interface Minimalista */}
        <main className="main-content">
          <AddTaskForm 
            onAdd={addTask} 
            isLoading={isLoading}
            projects={projects}
            tags={tags}
            onCreateProject={createProject}
            onCreateTag={createTag}
            selectedFilter={selectedFilter}
          />
          
          {/* Título do Projeto Selecionado */}
          {selectedFilter.startsWith('project:') && (
            <div className="project-header">
              <div className="project-title">
                <span className="project-icon">📁</span>
                <h2 className="project-name">
                  {selectedFilter.replace('project:', '')}
                </h2>
              </div>
            </div>
          )}
          
          <TaskStats
            tasks={Array.isArray(tasks) ? tasks : []}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            onDeleteCompleted={deleteCompletedTasks}
            onArchiveCompleted={archiveCompletedTasks}
          />
          <TaskList
            tasks={filteredTasks}
            onToggleTask={toggleTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onEditTask={handleEditTask}
            projects={projects}
            tags={tags}
            onCreateProject={createProject}
            onCreateTag={createTag}
            onDeleteCompleted={deleteCompletedTasks}
            onArchiveCompleted={archiveCompletedTasks}
          />
        </main>
      </div>

      {/* Modal de Projeto */}
      {showProjectModal && (
        <ProjectModal
          isOpen={showProjectModal}
          project={editingProject}
          onSave={handleSaveProject}
          onClose={handleCloseProjectModal}
        />
      )}

      {/* Modal de Tag */}
      {showTagModal && (
        <TagModal
          isOpen={showTagModal}
          tag={editingTag}
          onSave={handleSaveTag}
          onClose={handleCloseTagModal}
          onDelete={editingTag ? handleDeleteTag : undefined}
        />
      )}

      {/* Modal de Edição de Tarefa */}
      {showEditModal && editingTask && (
        <TaskEditModal
          isOpen={showEditModal}
          task={editingTask}
          onSave={updateTask}
          onClose={handleCloseEditModal}
          projects={projects}
          tags={tags}
          onCreateProject={createProject}
          onCreateTag={createTag}
        />
      )}

      <style>{`
        .app {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .app-layout {
          display: flex;
          min-height: 100vh;
        }

        .error-message {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger-color);
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          font-size: 14px;
          z-index: 1000;
          box-shadow: var(--shadow-md);
        }

        .main-content {
          flex: 1;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
          margin-left: 280px; /* Compensar largura do sidebar fixo */
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Responsividade */
        @media (max-width: 768px) {
          .app-layout {
            flex-direction: column;
          }

          .main-content {
            padding: 16px;
            margin-left: 0; /* Remover margem em mobile */
          }
        }
      `}</style>
    </div>
  );
}

export default App;