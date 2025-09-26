import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AddTaskFormProps } from '@/types';
import { NLPPreviewProcessor } from '@/utils/nlpPreview';
import { PlusIcon, HourglassIcon, LightbulbIcon } from './icons';
import { AutocompleteDropdown, AutocompleteItem } from './AutocompleteDropdown';
import { useAutocomplete } from '@/hooks/useAutocomplete';

/**
 * Componente de formulário para adicionar novas tarefas
 */
export function AddTaskForm({ 
  onAdd, 
  isLoading, 
  projects = [], 
  tags = [], 
  onCreateProject, 
  onCreateTag,
  selectedFilter = 'inbox'
}: AddTaskFormProps) {
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hook de autocomplete
  const {
    isVisible: isAutocompleteVisible,
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

  // Focar no input quando o componente é montado
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  /**
   * Aplica contexto automático baseado no filtro selecionado
   */
  const applyAutoContext = (content: string): string => {
    let contextualContent = content;
    
    // Aplicar contexto de data baseado no filtro
    if (selectedFilter === 'today' && !content.includes('hoje') && !content.includes('today')) {
      // Só adiciona "hoje" se não há data especificada no conteúdo
      const nlpPreview = NLPPreviewProcessor.processContent(content);
      if (!nlpPreview.dueDate) {
        contextualContent = `${content} hoje`;
      }
    } else if (selectedFilter === 'tomorrow' && !content.includes('amanhã') && !content.includes('tomorrow')) {
      // Só adiciona "amanhã" se não há data especificada no conteúdo
      const nlpPreview = NLPPreviewProcessor.processContent(content);
      if (!nlpPreview.dueDate) {
        contextualContent = `${content} amanhã`;
      }
    }
    
    // Aplicar contexto de projeto se estiver em um filtro de projeto
    if (selectedFilter.startsWith('project:')) {
      const projectName = selectedFilter.replace('project:', '');
      const project = projects.find(p => p.name === projectName);
      if (project && !content.includes(`@${projectName}`)) {
        contextualContent = `${contextualContent} @${projectName}`;
      }
    }
    
    // Aplicar contexto de tag se estiver em um filtro de tag
    if (selectedFilter.startsWith('tag:')) {
      const tagName = selectedFilter.replace('tag:', '');
      const tag = tags.find(t => t.name === tagName);
      if (tag && !content.includes(`#${tagName}`)) {
        contextualContent = `${contextualContent} #${tagName}`;
      }
    }
    
    return contextualContent.trim();
  };

  /**
   * Cria o contexto automático para o processamento NLP
   */
  const getAutoContext = () => {
    const autoContext: { selectedFilter?: string; projectName?: string; tagName?: string } = {};
    
    if (selectedFilter === 'today' || selectedFilter === 'tomorrow') {
      autoContext.selectedFilter = selectedFilter;
    }
    
    if (selectedFilter.startsWith('project:')) {
      autoContext.projectName = selectedFilter.replace('project:', '');
    }
    
    if (selectedFilter.startsWith('tag:')) {
      autoContext.tagName = selectedFilter.replace('tag:', '');
    }
    
    return autoContext;
  };

  /**
   * Processa o preview do NLP em tempo real
   */
  const nlpPreview = NLPPreviewProcessor.processContent(content, getAutoContext());
  const previewText = NLPPreviewProcessor.generatePreviewText(nlpPreview);

  /**
   * Manipula o envio do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isLoading) {
      return;
    }

    try {
      // Determinar o projectId se estamos em contexto de projeto
      let projectId: string | null = null;
      
      if (selectedFilter.startsWith('project:')) {
        const projectName = selectedFilter.replace('project:', '');
        const project = projects.find(p => p.name === projectName);
        if (project) {
          projectId = project.id;
          console.log('🔍 [DEBUG FRONTEND] AddTaskForm - Usando projectId do contexto:', {
            projectName,
            projectId,
            selectedFilter
          });
        }
      }

      // Se temos projectId, não aplicar contexto automático de projeto no conteúdo
      let contextualContent = content.trim();
      if (!projectId) {
        // Aplicar contexto automático apenas se não temos projectId
        contextualContent = applyAutoContext(content.trim());
      } else {
        // Se temos projectId, aplicar apenas contexto de data
        if (selectedFilter === 'today' && !content.includes('hoje') && !content.includes('today')) {
          const nlpPreview = NLPPreviewProcessor.processContent(content);
          if (!nlpPreview.dueDate) {
            contextualContent = `${content} hoje`;
          }
        } else if (selectedFilter === 'tomorrow' && !content.includes('amanhã') && !content.includes('tomorrow')) {
          const nlpPreview = NLPPreviewProcessor.processContent(content);
          if (!nlpPreview.dueDate) {
            contextualContent = `${content} amanhã`;
          }
        }
      }

      await onAdd(contextualContent, projectId);
      setContent('');
      setShowPreview(false);
      
      // Manter foco no input após adicionar
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      // O erro será tratado pelo componente pai
    }
  };

  /**
   * Manipula mudanças no input
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
        setContent('');
        setShowPreview(false);
        hideDropdown();
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
    if (isAutocompleteVisible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isAutocompleteVisible, handleClickOutside]);

  return (
    <div className="add-task-form">
      <form onSubmit={handleSubmit} className="form">
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua tarefa... (ex: Reunião amanhã #trabalho)"
            className="task-input"
            disabled={isLoading}
            maxLength={500}
          />
          
          <button
            type="submit"
            disabled={!content.trim() || isLoading}
            className="add-button"
          >
            {isLoading ? <HourglassIcon size={16} /> : <PlusIcon size={16} />}
          </button>
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
      </form>

      {/* Dropdown de Autocomplete */}
      <AutocompleteDropdown
        items={autocompleteItems}
        isVisible={isAutocompleteVisible}
        position={autocompletePosition}
        searchTerm={searchTerm}
        selectedIndex={selectedIndex}
        onSelect={selectItem}
        onCreateNew={autocompleteType === 'project' ? onCreateProject : onCreateTag}
        type={autocompleteType || 'project'}
      />

      <div className="help-text">
        <span><LightbulbIcon size={16} className="help-icon" /> Dicas: Use "hoje", "amanhã", "segunda" para datas, #tag para categorias e @projeto para projetos</span>
      </div>

      <style>{`
        .add-task-form {
          margin-bottom: 2rem;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .input-container {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .task-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 2px solid var(--border-color);
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: var(--bg-primary);
          color: var(--text-primary);
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

        .add-button {
          padding: 0.75rem 1rem;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 3rem;
        }

        .add-button:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }

        .add-button:disabled {
          background: var(--text-muted);
          cursor: not-allowed;
          transform: none;
        }

        .nlp-preview {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          padding: 0.75rem;
          font-size: 0.875rem;
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

        .help-text {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-align: center;
        }

        @media (max-width: 640px) {
          .input-container {
            flex-direction: column;
          }

          .add-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}