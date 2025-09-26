import React, { useState, useEffect, useRef } from 'react';
import { Project } from '@/services/api';
import { CloseIcon, FolderIcon, CheckIcon } from './icons';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string }) => Promise<void>;
  project?: Project | null; // null para criar, Project para editar
  isLoading?: boolean;
}

/**
 * Modal para criar ou editar projetos - Design moderno e funcionalidades aprimoradas
 */
export function ProjectModal({ isOpen, onClose, onSave, project, isLoading = false }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Resetar estado quando o modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setName(project?.name || '');
      setError('');
      setInternalLoading(false);
      // Focar no input após um pequeno delay para garantir que o modal esteja renderizado
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, project]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !internalLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, internalLoading]);

  /**
   * Manipula o envio do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nome do projeto é obrigatório');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return;
    }

    if (trimmedName.length > 50) {
      setError('Nome deve ter no máximo 50 caracteres');
      return;
    }

    try {
      setError('');
      setInternalLoading(true);
      await onSave({ name: trimmedName });
      // O modal será fechado pelo componente pai se a operação for bem-sucedida
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar projeto');
    } finally {
      setInternalLoading(false);
    }
  };

  /**
   * Manipula clique no backdrop
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !internalLoading) {
      onClose();
    }
  };

  const currentLoading = isLoading || internalLoading;

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div className="modal-title-container">
            <FolderIcon className="modal-icon" />
            <h2 id="modal-title" className="modal-title">
              {project ? 'Editar Projeto' : 'Novo Projeto'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="close-button"
            aria-label="Fechar modal"
            disabled={currentLoading}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="project-name" className="form-label">
              Nome do Projeto
            </label>
            <input
              ref={inputRef}
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do projeto..."
              className={`form-input ${error ? 'error' : ''}`}
              disabled={currentLoading}
              maxLength={50}
              required
            />
            <div className="character-count">
              {name.length}/50
            </div>
            {error && <span className="error-message">{error}</span>}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={currentLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={currentLoading || !name.trim()}
            >
              {currentLoading ? (
                <>Salvando...</>
              ) : (
                <>
                  <CheckIcon size={16} />
                  {project ? 'Salvar' : 'Criar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-backdrop {
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

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 400px;
          max-height: 90vh;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .modal-icon {
          width: 24px;
          height: 24px;
          color: #3b82f6;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-form {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: white;
          color: #111827;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input.error {
          border-color: #ef4444;
        }

        .form-input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .character-count {
          font-size: 0.75rem;
          color: #6b7280;
          text-align: right;
          margin-top: 0.25rem;
        }

        .error-message {
          display: block;
          font-size: 0.875rem;
          color: #ef4444;
          margin-top: 0.5rem;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        .cancel-button {
          padding: 0.75rem 1.5rem;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-button:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .cancel-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .save-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .modal-content {
            background: #1f2937;
          }

          .modal-header {
            border-color: #374151;
          }

          .modal-title {
            color: #f9fafb;
          }

          .close-button:hover {
            background: #374151;
            color: #d1d5db;
          }

          .form-label {
            color: #d1d5db;
          }

          .form-input {
            background: #111827;
            border-color: #4b5563;
            color: #f9fafb;
          }

          .form-input:focus {
            border-color: #60a5fa;
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
          }

          .form-input:disabled {
            background: #374151;
          }

          .character-count {
            color: #9ca3af;
          }

          .cancel-button {
            background: #374151;
            border-color: #4b5563;
            color: #d1d5db;
          }

          .cancel-button:hover:not(:disabled) {
            background: #4b5563;
            border-color: #6b7280;
          }

          .save-button {
            background: #3b82f6;
          }

          .save-button:hover:not(:disabled) {
            background: #2563eb;
          }
        }

        /* Responsividade */
        @media (max-width: 640px) {
          .modal-content {
            margin: 1rem;
            max-width: none;
          }

          .modal-header {
            padding: 1rem 1rem 0.75rem;
          }

          .modal-form {
            padding: 1rem;
          }

          .modal-actions {
            flex-direction: column-reverse;
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