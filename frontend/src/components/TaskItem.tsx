import React, { useState, useRef, useEffect } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskItemProps } from '@/types';
import { CheckIcon, EditIcon, DeleteIcon, LoadingIcon, CalendarIcon, FolderIcon, TagIcon } from '@/components/icons';
import { getColorTheme } from '@/utils/colors';
import { ColorPicker } from './ColorPicker';
import { TagModal } from './TagModal';
import { useTags } from '@/hooks/useTags';
import { NLPPreviewProcessor } from '@/utils/nlpPreview';
import { Tag } from '@/types';

/**
 * Componente individual de tarefa
 */
export default function TaskItem({ 
  task, 
  onToggle, 
  onUpdate, 
  onDelete, 
  isSelected, 
  onSelect,
  onEdit,
  projects,
  tags,
  onCreateProject,
  onCreateTag
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title || task.content);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState<'project' | 'tag' | null>(null);
  const [selectedTagIndex, setSelectedTagIndex] = useState<number | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);

  // Hook para gerenciar tags
  const { updateTag, deleteTag } = useTags();
  const editInputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  // Focar no input quando entra em modo de edição
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  // Scroll para o item quando selecionado
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [isSelected]);

  /**
   * Formata a data de vencimento
   */
  const formatDueDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isToday(dateObj)) {
      // Para tarefas de hoje, mostrar horário apenas se não for meio-dia (horário padrão)
      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes();
      
      // Se o horário é meio-dia (12:00), mostrar apenas "Hoje"
      if (hours === 12 && minutes === 0) {
        return 'Hoje';
      }
      
      // Caso contrário, mostrar "Hoje" + horário
      return `Hoje ${format(dateObj, 'HH:mm')}`;
    }
    
    if (isTomorrow(dateObj)) {
      return 'Amanhã';
    }
    
    if (isPast(dateObj) && !isToday(dateObj)) {
      return format(dateObj, 'dd/MM', { locale: ptBR });
    }
    
    return format(dateObj, 'dd/MM', { locale: ptBR });
  };

  /**
   * Obtém o status da data de vencimento
   */
  const getDueDateStatus = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isToday(dateObj)) {
      return 'today';
    }
    
    if (isTomorrow(dateObj)) {
      return 'tomorrow';
    }
    
    if (isPast(dateObj) && !isToday(dateObj)) {
      return 'overdue';
    }
    
    return 'future';
  };

  /**
   * Manipula o toggle de conclusão
   */
  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onToggle(task.id);
    } catch (error) {
      console.error('Erro ao alterar status da tarefa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Inicia o modo de edição
   */
  const handleEdit = () => {
    if (task.completed) return;
    setIsEditing(true);
    setEditValue(task.title || task.content);
  };

  /**
   * Salva a edição
   */
  const handleSaveEdit = async () => {
    if (!editValue.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      // Processar o conteúdo com NLP para extrair datas, tags e projetos
      const nlpResult = NLPPreviewProcessor.processContent(editValue.trim());
      
      await onUpdate({ 
        content: nlpResult.cleanContent,
        // Usar dados do NLP se disponíveis, senão preservar os existentes
        projectId: nlpResult.project ? undefined : task.projectId, // Se NLP extraiu projeto, deixar undefined para criar novo
        dueDate: nlpResult.dueDate || task.dueDate,
        projectColor: task.projectColor
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancela a edição
   */
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(task.title || task.content);
  };

  /**
   * Manipula teclas durante a edição
   */
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  /**
   * Manipula o blur do input de edição
   * Só cancela se não foi um ENTER que causou o blur
   */
  const handleEditBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Pequeno delay para permitir que o ENTER seja processado primeiro
    setTimeout(() => {
      if (isEditing) {
        handleCancelEdit();
      }
    }, 100);
  };

  /**
   * Manipula teclas no item
   */
  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Não interceptar teclas se estiver em modo de edição
    if (isEditing) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(task.id);
    }
  };

  /**
   * Manipula o clique no item da tarefa
   * Agora abre o modal de edição se onEdit estiver disponível
   */
  const handleItemClick = () => {
    // Se estiver editando inline, não fazer nada
    if (isEditing) return;
    
    // Se a tarefa estiver completa, não permitir edição
    if (task.completed) return;
    
    // Se onEdit estiver disponível, abrir modal de edição
    if (onEdit) {
      onEdit(task);
      return;
    }
    
    // Caso contrário, apenas selecionar a tarefa
    onSelect(task.id);
  };

  /**
   * Abre o seletor de cores para projeto
   */
  const handleProjectColorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setColorPickerTarget('project');
    setShowColorPicker(true);
  };

  /**
   * Abre o modal de edição de tag
   */
  const handleTagClick = (e: React.MouseEvent, tag: any, tagIndex: number) => {
    e.stopPropagation();
    
    // Calcular posição do modal baseada na posição da tarefa
    const taskElement = itemRef.current;
    if (taskElement) {
      const rect = taskElement.getBoundingClientRect();
      const modalPosition = {
        top: rect.top + window.scrollY,
        left: Math.min(rect.left + rect.width + 20, window.innerWidth - 420) // 420 = largura do modal + margem
      };
      setModalPosition(modalPosition);
    }
    
    setSelectedTag(tag);
    setSelectedTagIndex(tagIndex);
    setShowTagModal(true);
  };

  /**
   * Abre o seletor de cores para tag (mantido para compatibilidade)
   */
  const handleTagColorClick = (e: React.MouseEvent, tagIndex: number) => {
    e.stopPropagation();
    
    // Calcular posição do modal baseada na posição específica da tag clicada
    const tagElement = e.currentTarget as HTMLElement;
    if (tagElement) {
      const rect = tagElement.getBoundingClientRect();
      const modalWidth = 420; // largura do modal
      const modalPosition = {
        top: rect.bottom + window.scrollY + 8, // 8px de espaçamento
        left: Math.max(0, Math.min(
          rect.left + window.scrollX - (modalWidth / 3), // posicionar mais à esquerda
          window.innerWidth - modalWidth - 20 // garantir que não saia da tela (20px de margem)
        ))
      };
      setModalPosition(modalPosition);
    }
    
    // Agora abre o modal de edição em vez do color picker
    const tag = task.tags?.[tagIndex];
    if (tag) {
      setSelectedTag(tag);
      setSelectedTagIndex(tagIndex);
      setShowTagModal(true);
    }
  };

  /**
   * Manipula seleção de cor
   */
  const handleColorSelect = async (colorId: string) => {
    try {
      setIsLoading(true);
      
      if (colorPickerTarget === 'project') {
        // Atualizar cor do projeto
        await onUpdate({ 
          projectColor: colorId || null 
        });
      } else if (colorPickerTarget === 'tag' && selectedTagIndex !== null) {
        // Para tags, precisaríamos de uma API específica para atualizar cores de tags
        // Por enquanto, vamos apenas fechar o picker
        console.log('Atualização de cor de tag ainda não implementada');
      }
    } catch (error) {
      console.error('Erro ao atualizar cor:', error);
    } finally {
      setIsLoading(false);
      setShowColorPicker(false);
      setColorPickerTarget(null);
      setSelectedTagIndex(null);
    }
  };

  /**
   * Fecha o seletor de cores
   */
  const handleColorPickerClose = () => {
    setShowColorPicker(false);
    setColorPickerTarget(null);
    setSelectedTagIndex(null);
  };

  /**
   * Salva as alterações da tag
   */
  const handleTagSave = async (data: { name: string; color?: string | null }) => {
    if (!selectedTag) return;
    
    try {
      await updateTag(selectedTag.id, data);
      // Recarregar a tarefa para refletir as mudanças
      if (onUpdate) {
        await onUpdate({});
      }
    } catch (error) {
      console.error('Erro ao atualizar tag:', error);
      throw error;
    }
  };

  /**
   * Exclui a tag
   */
  const handleTagDelete = async (tagId: string) => {
    try {
      await deleteTag(tagId);
      // Recarregar a tarefa para refletir as mudanças
      if (onUpdate) {
        await onUpdate({});
      }
    } catch (error) {
      console.error('Erro ao excluir tag:', error);
      throw error;
    }
  };

  /**
   * Fecha o modal de tag
   */
  const handleTagModalClose = () => {
    setShowTagModal(false);
    setSelectedTag(null);
    setSelectedTagIndex(null);
    setModalPosition(null);
  };

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      if (showActionsMenu) {
        setShowActionsMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showActionsMenu]);

  const dueDateInfo = task.dueDate ? formatDueDate(new Date(task.dueDate)) : null;

  return (
    <div
      ref={itemRef}
      className={`task-item ${task.completed ? 'completed' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={handleItemClick}
      onKeyDown={handleItemKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Tarefa: ${task.title || task.content}`}
    >
      <div className="task-content">
        {/* Linha 1: Checkbox + Título */}
        <div className="task-line-1">
          <button
            className={`toggle-btn ${task.completed ? 'completed' : ''}`}
            onClick={handleToggle}
            aria-label={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingIcon className="loading-icon" />
            ) : task.completed ? (
              <CheckIcon className="check-icon" />
            ) : null}
          </button>

          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={handleEditBlur}
              className="edit-input"
              aria-label="Editar título da tarefa"
            />
          ) : (
            <span className="task-title">{task.title || task.content}</span>
          )}
        </div>

        {/* Linha 2: Projeto + Tags + Data/Horário */}
        <div className="task-line-2">
          <div className="task-metadata">
            {/* Projeto */}
            {task.project && (
              <div className="project-container">
                <span 
                  className="project-text"
                  style={{ 
                    color: task.projectColor ? getColorTheme(task.projectColor)?.textColor || '#3b82f6' : '#3b82f6'
                  }}
                  onClick={handleProjectColorClick}
                  title="Clique para alterar a cor"
                >
                  {task.project.name}
                </span>
              </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="tags-container">
                <TagIcon className="tag-icon" size={14} />
                {task.tags.map((tag, index) => {
                  const tagObj = typeof tag === 'string' ? { name: tag } : tag;
                  const tagColor = tagObj.color ? getColorTheme(tagObj.color) : null;
                  
                  return (
                    <span 
                      key={index} 
                      className="tag-text"
                      style={{ 
                        color: tagColor ? tagColor.textColor : '#6b7280' 
                      }}
                      onClick={(e) => handleTagColorClick(e, index)}
                      title="Clique para alterar a cor"
                    >
                      {tagObj.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="task-datetime">
            {task.dueDate && (
              <span className={`due-date-badge ${getDueDateStatus(task.dueDate)}`}>
                <CalendarIcon className="calendar-icon" />
                {formatDueDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Menu de 3 pontos para ações */}
      <div className="task-actions">
        <button
          className="actions-menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowActionsMenu(!showActionsMenu);
          }}
          aria-label="Mais opções"
        >
          ⋯
        </button>

        {showActionsMenu && (
          <div className="actions-menu">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
                setShowActionsMenu(false);
              }}
              className="action-btn edit-btn"
              disabled={task.completed}
            >
              <EditIcon className="action-icon" />
              Editar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
                setShowActionsMenu(false);
              }}
              className="action-btn delete-btn"
            >
              <DeleteIcon className="action-icon" />
              Excluir
            </button>
          </div>
        )}
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <ColorPicker
          selectedColor={
            colorPickerTarget === 'project' 
              ? task.projectColor 
              : colorPickerTarget === 'tag' && selectedTagIndex !== null && task.tags?.[selectedTagIndex]
                ? (typeof task.tags[selectedTagIndex] === 'string' ? null : (task.tags[selectedTagIndex] as any).color)
                : null
          }
          onColorSelect={handleColorSelect}
          onClose={handleColorPickerClose}
        />
      )}

      <style>{`
        .task-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .task-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .task-item.selected {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .task-item.completed {
          opacity: 0.7;
        }

        .task-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* Linha 1: Checkbox + Título */
        .task-line-1 {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toggle-btn {
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .toggle-btn:hover {
          border-color: #3b82f6;
        }

        .toggle-btn.completed {
          background: #10b981;
          border-color: #10b981;
        }

        .toggle-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-icon,
        .check-icon {
          width: 12px;
          height: 12px;
        }

        .loading-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .task-title {
          font-size: 16px;
          font-weight: 500;
          color: #1f2937;
          flex: 1;
        }

        .task-item.completed .task-title {
          text-decoration: line-through;
          color: #6b7280;
        }

        .edit-input {
          flex: 1;
          padding: 8px 12px;
          border: 2px solid #3b82f6;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          background: white;
          outline: none;
        }

        /* Linha 2: Projeto + Tags + Data */
        .task-line-2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-left: 32px; /* Alinha com o título */
        }

        .task-metadata {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .project-container {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .project-icon {
          color: #6b7280;
          opacity: 0.8;
        }

        .project-text {
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .project-text:hover {
          opacity: 0.7;
        }

        .task-tags {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tags-container {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tag-icon {
          color: #6b7280;
          opacity: 0.8;
        }

        .tag-text {
          color: #374151;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .tag-text:hover {
          opacity: 0.7;
        }

        .task-datetime {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .due-date-badge {
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .calendar-icon {
          width: 12px;
          height: 12px;
        }

        .due-date-badge.today {
          color: #dc2626;
        }

        .due-date-badge.tomorrow {
          color: #d97706;
        }

        .due-date-badge.overdue {
          color: #7f1d1d;
        }

        .due-date-badge.future {
          color: #2563eb;
        }

        /* Menu de Ações */
        .task-actions {
          position: relative;
        }

        .actions-menu-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .actions-menu-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .actions-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 10;
          min-width: 120px;
          overflow: hidden;
        }

        .action-btn {
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: white;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          transition: background 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-btn:hover {
          background: #f3f4f6;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-icon {
          width: 14px;
          height: 14px;
        }

        .delete-btn:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .task-item {
            background: #1f2937;
            border-color: #374151;
          }

          .task-item:hover {
            border-color: #60a5fa;
            box-shadow: 0 2px 8px rgba(96, 165, 250, 0.1);
          }

          .task-item.selected {
            border-color: #60a5fa;
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
          }

          .toggle-btn {
            border-color: #4b5563;
            background: #1f2937;
          }

          .toggle-btn:hover {
            border-color: #60a5fa;
          }

          .task-title {
            color: #f9fafb;
          }

          .task-item.completed .task-title {
            color: #9ca3af;
          }

          .edit-input {
            background: #1f2937;
            border-color: #60a5fa;
            color: #f9fafb;
          }

          .tag-badge {
            background: #374151;
            color: #d1d5db;
          }

          .actions-menu-btn:hover {
            background: #374151;
            color: #d1d5db;
          }

          .actions-menu {
            background: #1f2937;
            border-color: #374151;
          }

          .action-btn {
            background: #1f2937;
            color: #d1d5db;
          }

          .action-btn:hover {
            background: #374151;
          }

          .delete-btn:hover {
            background: #7f1d1d;
            color: #fca5a5;
          }
        }

        /* Color Picker Styles */
        .color-picker-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1000;
        }

        .color-picker-container {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 
            0 20px 25px -5px rgba(0, 0, 0, 0.1), 
            0 10px 10px -5px rgba(0, 0, 0, 0.04),
            0 0 0 1px rgba(0, 0, 0, 0.05);
          width: 280px;
          max-height: 400px;
          overflow: hidden;
        }

        .color-picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .color-picker-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .color-picker-close {
          background: none;
          border: none;
          font-size: 20px;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .color-picker-close:hover {
          background: #f3f4f6;
          color: #6b7280;
        }

        .color-picker-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .color-option {
          background: none;
          border: 2px solid transparent;
          border-radius: 12px;
          padding: 12px 8px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          position: relative;
        }

        .color-option:hover {
          border-color: #e5e7eb;
          background: #f9fafb;
        }

        .color-option.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .color-preview {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .color-preview.default {
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
        }

        .color-check {
          color: white;
          font-size: 16px;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .color-preview.default .color-check {
          color: #3b82f6;
          text-shadow: none;
        }

        .color-name {
          font-size: 12px;
          color: #6b7280;
          text-align: center;
          font-weight: 500;
          line-height: 1.2;
        }

        /* Dark mode para Color Picker */
        @media (prefers-color-scheme: dark) {
          .color-picker-container {
            background: #1f2937;
            box-shadow: 
              0 20px 25px -5px rgba(0, 0, 0, 0.3), 
              0 10px 10px -5px rgba(0, 0, 0, 0.2),
              0 0 0 1px rgba(255, 255, 255, 0.1);
          }

          .color-picker-header h3 {
            color: #f9fafb;
          }

          .color-picker-close {
            color: #9ca3af;
          }

          .color-picker-close:hover {
            background: #374151;
            color: #d1d5db;
          }

          .color-option:hover {
            border-color: #4b5563;
            background: #374151;
          }

          .color-option.selected {
            border-color: #60a5fa;
            background: #1e3a8a;
          }

          .color-preview.default {
            background: #374151;
            border-color: #6b7280;
          }

          .color-name {
            color: #9ca3af;
          }
        }

        /* Responsividade */
        @media (max-width: 640px) {
          .task-item {
            padding: 12px;
          }

          .task-line-2 {
            margin-left: 28px;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }

          .task-datetime {
            align-self: flex-end;
          }
        }
      `}</style>

      {/* Tag Modal */}
      <TagModal
        tag={selectedTag}
        isOpen={showTagModal}
        onClose={handleTagModalClose}
        onSave={handleTagSave}
        onDelete={handleTagDelete}
        position={modalPosition}
      />
    </div>
  );
}