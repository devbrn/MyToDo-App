import { useState, useEffect, useCallback } from 'react';
import TaskItem from './TaskItem';
import { Task, Project, Tag } from '@/types';

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: string) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onEditTask?: (task: Task) => void; // Callback para abrir modal de edição
  projects?: Project[]; // Lista de projetos para o modal de edição
  tags?: Tag[]; // Lista de tags para o modal de edição
  onCreateProject?: (name: string) => Promise<Project | null>;
  onCreateTag?: (name: string) => Promise<Tag | null>;
  onDeleteCompleted?: () => Promise<void>; // Callback para excluir tarefas concluídas
  onArchiveCompleted?: () => Promise<void>; // Callback para arquivar tarefas concluídas
}

/**
 * Lista de tarefas minimalista com navegação por teclado
 */
export function TaskList({ 
  tasks, 
  onToggleTask, 
  onUpdateTask, 
  onDeleteTask, 
  onEditTask,
  projects,
  tags,
  onCreateProject,
  onCreateTag,
  onDeleteCompleted,
  onArchiveCompleted
}: TaskListProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Ordenar tarefas: pendentes primeiro, depois por data de vencimento, depois por data de criação
  const sortedTasks = [...tasks].sort((a, b) => {
    // Tarefas pendentes primeiro
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Por data de vencimento (se existir)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    // Por data de criação (mais recente primeiro)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Separar tarefas pendentes e concluídas
  const pendingTasks = sortedTasks.filter(task => !task.completed);
  const completedTasks = sortedTasks.filter(task => task.completed);

  // Selecionar primeira tarefa quando a lista mudar
  useEffect(() => {
    if (sortedTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(sortedTasks[0].id);
    } else if (sortedTasks.length === 0) {
      setSelectedTaskId(null);
    } else if (selectedTaskId && !sortedTasks.find(t => t.id === selectedTaskId)) {
      setSelectedTaskId(sortedTasks[0]?.id || null);
    }
  }, [sortedTasks, selectedTaskId]);

  /**
   * Navegação por teclado
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!sortedTasks.length) return;

    // Não interceptar teclas se o foco estiver em um input ou textarea
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    )) {
      return;
    }

    const currentIndex = sortedTasks.findIndex(task => task.id === selectedTaskId);
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          setSelectedTaskId(sortedTasks[currentIndex - 1].id);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < sortedTasks.length - 1) {
          setSelectedTaskId(sortedTasks[currentIndex + 1].id);
        }
        break;
      case ' ':
        e.preventDefault();
        if (selectedTaskId) {
          onToggleTask(selectedTaskId);
        }
        break;
    }
  }, [sortedTasks, selectedTaskId, onToggleTask]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (tasks.length === 0) {
    return (
      <div className="task-list">
        <div className="empty-state">
          <p>Nenhuma tarefa ainda.</p>
          <p>Digite acima para criar sua primeira tarefa!</p>
        </div>

        <style>{`
          .task-list {
            margin-top: 20px;
          }

          .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #666;
          }

          .empty-state p {
            margin: 8px 0;
          }

          @media (prefers-color-scheme: dark) {
            .empty-state {
              color: #999;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="task-list">
      {/* Tarefas Pendentes */}
      {pendingTasks.length > 0 && (
        <div className="tasks-section">
          <div className="tasks">
            {pendingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isSelected={task.id === selectedTaskId}
                onToggle={() => onToggleTask(task.id)}
                onUpdate={(updates) => onUpdateTask(task.id, updates)}
                onDelete={() => onDeleteTask(task.id)}
                onSelect={() => setSelectedTaskId(task.id)}
                onEdit={onEditTask}
                projects={projects}
                tags={tags}
                onCreateProject={onCreateProject}
                onCreateTag={onCreateTag}
              />
            ))}
          </div>
        </div>
      )}

      {/* Seção de Tarefas Concluídas */}
      {completedTasks.length > 0 && (
        <div className="completed-section">
          <div className="completed-header">
            <h3 className="completed-title">Tarefas Concluídas ({completedTasks.length})</h3>
            <div className="completed-actions">
              {onArchiveCompleted && (
                <button
                  className="action-link archive-link"
                  onClick={onArchiveCompleted}
                  title="Arquivar todas as tarefas concluídas"
                >
                  📦 Arquivar Todas
                </button>
              )}
              {onDeleteCompleted && (
                <button
                  className="action-link delete-link"
                  onClick={onDeleteCompleted}
                  title="Excluir todas as tarefas concluídas"
                >
                  🗑️ Excluir Todas
                </button>
              )}
            </div>
          </div>
          <div className="tasks">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isSelected={task.id === selectedTaskId}
                onToggle={() => onToggleTask(task.id)}
                onUpdate={(updates) => onUpdateTask(task.id, updates)}
                onDelete={() => onDeleteTask(task.id)}
                onSelect={() => setSelectedTaskId(task.id)}
                onEdit={onEditTask}
                projects={projects}
                tags={tags}
                onCreateProject={onCreateProject}
                onCreateTag={onCreateTag}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        .task-list {
          margin-top: 20px;
        }

        .tasks-section {
          margin-bottom: 32px;
        }

        .tasks {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .completed-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 2px solid var(--border-color);
        }

        .completed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 0 4px;
        }

        .completed-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-secondary);
          margin: 0;
        }

        .completed-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .action-link {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }

        .action-link:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .archive-link:hover {
          color: var(--info-color);
          background: var(--info-color-alpha, rgba(59, 130, 246, 0.1));
        }

        .delete-link:hover {
          color: var(--danger-color);
          background: var(--danger-color-alpha, rgba(239, 68, 68, 0.1));
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        .empty-state p {
          margin: 8px 0;
        }

        /* Responsividade */
        @media (max-width: 768px) {
          .completed-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .completed-actions {
            justify-content: center;
          }

          .action-link {
            flex: 1;
            justify-content: center;
          }
        }

        @media (prefers-color-scheme: dark) {
          .empty-state {
            color: #999;
          }
        }
      `}</style>
    </div>
  );
}