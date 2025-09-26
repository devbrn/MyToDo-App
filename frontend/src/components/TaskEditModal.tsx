import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Task, Project, Tag, UpdateTaskRequest } from '@/types';
import { NLPPreviewProcessor } from '@/utils/nlpPreview';
import { CloseIcon, CalendarIcon, TagIcon, FolderIcon, CheckIcon } from './icons';
import { AutocompleteDropdown } from './AutocompleteDropdown';
import { useAutocomplete } from '@/hooks/useAutocomplete';

interface TaskEditModalProps {
  task: Task;
  isOpen: boolean;
  onSave: (id: string, data: UpdateTaskRequest) => Promise<void>;
  onClose: () => void;
  projects?: Project[];
  tags?: Tag[];
  onCreateProject?: (name: string) => Promise<Project | null>;
  onCreateTag?: (name: string) => Promise<Tag | null>;
}

/**
 * Modal de edição de tarefas com interface similar ao Todoist
 */
export function TaskEditModal({
  task,
  isOpen,
  onSave,
  onClose,
  projects = [],
  tags = [],
  onCreateProject,
  onCreateTag
}: TaskEditModalProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hook de autocomplete
  const {
    isVisible,
    type: autocompleteType,
    searchTerm,
    selectedIndex,
    position: autocompletePosition,
    items: autocompleteItems,
    handleInputChange: handleAutocompleteInputChange,
    handleKeyDown: handleAutocompleteKeyDown,
    selectItem,
    hideDropdown,
    inputRef: autocompleteInputRef
  } = useAutocomplete({
    projects,
    tags,
    onCreateProject,
    onCreateTag
  });

  // Sincronizar refs
  useEffect(() => {
    if (inputRef.current && autocompleteInputRef.current !== inputRef.current) {
      (autocompleteInputRef as any).current = inputRef.current;
    }
  }, [autocompleteInputRef]);

  // Inicializar conteúdo quando o modal abre
  useEffect(() => {
    if (isOpen && task) {
      // Reconstruir o conteúdo original com tags e projeto
      let reconstructedContent = task.content;
      
      // Adicionar tags se existirem
      if (task.tags && task.tags.length > 0) {
        const tagNames = task.tags.map(tag => 
          typeof tag === 'string' ? tag : tag.name
        );
        reconstructedContent += ' ' + tagNames.map(name => `#${name}`).join(' ');
      }
      
      // Adicionar projeto se existir
      if (task.project) {
        reconstructedContent += ` @${task.project.name}`;
      }
      
      setContent(reconstructedContent);
      setShowPreview(false);
      
      // Focar no input após um pequeno delay
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, task]);

  /**
   * Processa o preview do NLP em tempo real
   */
  const nlpPreview = useMemo(() => NLPPreviewProcessor.processContent(content), [content]);
  const previewText = useMemo(() => NLPPreviewProcessor.generatePreviewText(nlpPreview), [nlpPreview]);

  /**
   * Manipula o envio do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(task.id, { content: content.trim() });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manipula mudanças no input da tarefa
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    setContent(value);
    setShowPreview(value.trim().length > 0 && nlpPreview.hasChanges);
    
    // Processar autocomplete
    handleAutocompleteInputChange(value, cursorPosition);
  };

  /**
   * Manipula teclas especiais
   */
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Primeiro, tentar processar no autocomplete
    const handled = await handleAutocompleteKeyDown(e, content, setContent);
    
    if (!handled) {
      // Se não foi processado pelo autocomplete, processar normalmente
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        // Ctrl+Enter ou Cmd+Enter para salvar
        handleSubmit(e as any);
      }
    }
  };

  /**
   * Manipula clique fora do dropdown
   */
  const handleClickOutside = useCallback(() => {
    hideDropdown();
  }, [hideDropdown]);

  // Adicionar listener para cliques fora
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isVisible, handleClickOutside]);

  /**
   * Manipula clique no backdrop para fechar
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * Wrapper para selectItem que atualiza o conteúdo do input
   */
  const handleSelectItem = async (item: AutocompleteItem, inputValue: string) => {
    const newValue = await selectItem(item, inputValue);
    setContent(newValue);
    
    // Focar no input após a seleção
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Posicionar cursor após o item inserido
        const cursorPos = newValue.length;
        inputRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="task-edit-modal-backdrop" onClick={handleBackdropClick}>
      <div className="task-edit-modal">
        <div className="modal-header">
          <h3>Editar Tarefa</h3>
          <button 
            type="button" 
            onClick={onClose}
            className="close-button"
            disabled={isLoading}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Edite sua tarefa..."
              className="task-input"
              disabled={isLoading}
              maxLength={500}
            />
          </div>

          {/* Preview do processamento NLP */}
          {showPreview && previewText && (
            <div className="nlp-preview">
              <div className="preview-content">
                <span className="preview-label">Preview:</span>
                <span className="preview-text">{previewText}</span>
              </div>
              <div className="preview-clean-content">
                <strong>Texto final:</strong> "{nlpPreview.cleanContent}"
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!content.trim() || isLoading}
              className="save-button"
            >
              {isLoading ? 'Salvando...' : (
                <>
                  <CheckIcon size={16} />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>

        {/* Dropdown de autocomplete */}
        <AutocompleteDropdown
          items={autocompleteItems}
          isVisible={isVisible}
          position={autocompletePosition}
          searchTerm={searchTerm}
          selectedIndex={selectedIndex}
          onSelect={handleSelectItem}
          onCreateNew={autocompleteType === 'project' ? onCreateProject : onCreateTag}
          type={autocompleteType}
          inputValue={content}
        />

        <div className="help-text">
          <span>💡 Use "hoje", "amanhã" para datas, #tag para categorias e @projeto para projetos</span>
          <span>⌨️ Ctrl+Enter para salvar, Esc para cancelar</span>
        </div>
      </div>

      <style>{`
        .task-edit-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .task-edit-modal {
          background: var(--bg-primary);
          border-radius: 0.75rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow: visible; /* Mudado de hidden para visible para permitir dropdown */
          position: relative;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1.5rem 0;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .close-button {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: all 0.2s ease;
        }

        .close-button:hover:not(:disabled) {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-form {
          padding: 0 1.5rem 1.5rem;
        }

        .input-container {
          margin-bottom: 1rem;
        }

        .task-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid var(--border-color);
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: var(--bg-primary);
          color: var(--text-primary);
          box-sizing: border-box;
        }

        .task-input:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px var(--accent-color-alpha);
        }

        .task-input:disabled {
          background: var(--bg-tertiary);
          cursor: not-allowed;
        }

        .nlp-preview {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          padding: 0.75rem;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .preview-content {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .preview-label {
          font-weight: 600;
          color: var(--accent-color);
        }

        .preview-text {
          color: var(--text-primary);
        }

        .preview-clean-content {
          color: var(--text-secondary);
          font-style: italic;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .cancel-button {
          padding: 0.75rem 1.5rem;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-button:hover:not(:disabled) {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .cancel-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-button {
          padding: 0.75rem 1.5rem;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .save-button:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }

        .save-button:disabled {
          background: var(--text-muted);
          cursor: not-allowed;
          transform: none;
        }

        .help-text {
          padding: 0 1.5rem 1.5rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        @media (max-width: 640px) {
          .task-edit-modal {
            margin: 1rem;
            max-width: none;
          }

          .modal-actions {
            flex-direction: column;
          }

          .cancel-button,
          .save-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}