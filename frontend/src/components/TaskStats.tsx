import React from 'react';
import { Task } from '@/types';

interface TaskStatsProps {
  tasks: Task[];
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  onDeleteCompleted?: () => Promise<void>;
  onArchiveCompleted?: () => Promise<void>;
}

/**
 * Componente de estatísticas das tarefas com botões de filtro
 */
export function TaskStats({ 
  tasks, 
  selectedFilter, 
  onFilterChange, 
  onDeleteCompleted, 
  onArchiveCompleted 
}: TaskStatsProps) {
  // Calcular estatísticas
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => !task.completed).length;
  const completedTasks = tasks.filter(task => task.completed).length;

  /**
   * Manipula a mudança de filtro
   */
  const handleFilterClick = (filter: string) => {
    // Se o filtro já está selecionado, volta para 'inbox' (todos)
    if (selectedFilter === filter) {
      onFilterChange('inbox');
    } else {
      onFilterChange(filter);
    }
  };

  /**
   * Manipula a exclusão de todas as tarefas concluídas
   */
  const handleDeleteCompleted = async () => {
    if (!onDeleteCompleted) return;
    
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir todas as ${completedTasks} tarefas concluídas? Esta ação não pode ser desfeita.`
    );
    
    if (confirmed) {
      try {
        await onDeleteCompleted();
      } catch (error) {
        console.error('Erro ao excluir tarefas concluídas:', error);
      }
    }
  };

  /**
   * Manipula o arquivamento de todas as tarefas concluídas
   */
  const handleArchiveCompleted = async () => {
    if (!onArchiveCompleted) return;
    
    const confirmed = window.confirm(
      `Tem certeza que deseja arquivar todas as ${completedTasks} tarefas concluídas?`
    );
    
    if (confirmed) {
      try {
        await onArchiveCompleted();
      } catch (error) {
        console.error('Erro ao arquivar tarefas concluídas:', error);
      }
    }
  };

  return (
    <div className="task-stats">
      {/* Estatísticas */}
      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{totalTasks}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pendentes:</span>
          <span className="stat-value pending">{pendingTasks}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Concluídas:</span>
          <span className="stat-value completed">{completedTasks}</span>
        </div>
      </div>

      {/* Botões de Filtro */}
      <div className="filter-buttons">
        <button
          className={`filter-btn ${selectedFilter === 'inbox' ? 'active' : ''}`}
          onClick={() => handleFilterClick('inbox')}
          title="Mostrar todas as tarefas"
        >
          Todas
        </button>
        <button
          className={`filter-btn pending ${(selectedFilter === 'pending' || selectedFilter === 'today') ? 'active' : ''}`}
          onClick={() => handleFilterClick('pending')}
          title="Mostrar apenas tarefas pendentes"
        >
          Pendentes
        </button>
        <button
          className={`filter-btn completed ${selectedFilter === 'completed' ? 'active' : ''}`}
          onClick={() => handleFilterClick('completed')}
          title="Mostrar apenas tarefas concluídas"
        >
          Concluídas
        </button>
        

      </div>

      <style>{`
        .task-stats {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          box-shadow: var(--shadow-sm);
        }

        .stats-summary {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          min-width: 24px;
          text-align: center;
          padding: 2px 8px;
          border-radius: 12px;
          background: var(--bg-tertiary);
        }

        .stat-value.pending {
          background: rgba(245, 158, 11, 0.1);
          color: var(--warning-color);
        }

        .stat-value.completed {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success-color);
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          border-color: var(--accent-color);
          background: var(--bg-tertiary);
        }

        .filter-btn.active {
          background: var(--accent-color);
          border-color: var(--accent-color);
          color: white;
        }

        .filter-btn.pending.active {
          background: var(--warning-color);
          border-color: var(--warning-color);
        }

        .filter-btn.completed.active {
          background: var(--success-color);
          border-color: var(--success-color);
        }

        /* Responsividade */
        @media (max-width: 768px) {
          .task-stats {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .stats-summary {
            justify-content: space-around;
          }

          .filter-buttons {
            justify-content: center;
            flex-direction: column;
            gap: 12px;
          }

          .filter-btn {
            flex: 1;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}