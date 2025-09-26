import React, { useState, useEffect, useRef } from 'react';
import { Tag } from '@/types';
import { COLOR_THEMES, getColorTheme } from '@/utils/colors';
import { CheckIcon, CloseIcon } from './icons';

interface TagModalProps {
  tag?: Tag | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color?: string | null }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  position?: { top: number; left: number } | null;
}

/**
 * Modal para edição de tags - Design moderno baseado na imagem fornecida
 */
export function TagModal({ tag, isOpen, onClose, onSave, onDelete, position }: TagModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Inicializar dados quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      if (tag) {
        setName(tag.name);
        setSelectedColor(tag.color);
      } else {
        setName('');
        setSelectedColor(null);
      }
      setError(null);
      setShowColorDropdown(false);
      
      // Desabilitar scroll do body quando modal abrir
      document.body.style.overflow = 'hidden';
      
      // Focar no input após um pequeno delay
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    } else {
      // Reabilitar scroll do body quando modal fechar
      document.body.style.overflow = 'unset';
    }

    // Cleanup: garantir que o scroll seja reabilitado se o componente for desmontado
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, tag]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Nome da tag é obrigatório');
      return;
    }

    if (name.trim().length > 50) {
      setError('Nome deve ter no máximo 50 caracteres');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await onSave({
        name: name.trim(),
        color: selectedColor
      });
      
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar tag';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tag || !onDelete) return;
    
    if (confirm('Tem certeza que deseja excluir esta tag?')) {
      try {
        setIsLoading(true);
        await onDelete(tag.id);
        onClose();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir tag';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleColorSelect = (colorId: string | null) => {
    setSelectedColor(colorId);
    setShowColorDropdown(false);
  };

  const getSelectedColorTheme = () => {
    return selectedColor ? getColorTheme(selectedColor) : null;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="tag-modal-backdrop" 
      onClick={handleBackdropClick}
    >
      <div 
        className="tag-modal" 
        ref={modalRef}
      >
        {/* Header */}
        <div className="tag-modal-header">
          <h2 className="tag-modal-title">
            {tag ? 'Editar etiqueta' : 'Nova etiqueta'}
          </h2>
          <button
            className="tag-modal-close"
            onClick={onClose}
            disabled={isLoading}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="tag-modal-form">
          {/* Nome */}
          <div className="form-group">
            <label htmlFor="tag-name" className="form-label">
              Nome
            </label>
            <input
              id="tag-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="Digite o nome da tag"
              maxLength={50}
              disabled={isLoading}
            />
            <div className="character-count">
              {name.length}/50
            </div>
          </div>

          {/* Cor */}
          <div className="form-group">
            <label className="form-label">Cor</label>
            <div className="color-grid">
              {/* Opção padrão */}
              <button
                type="button"
                className={`color-option ${!selectedColor ? 'selected' : ''}`}
                onClick={() => handleColorSelect(null)}
                title="Padrão"
              >
                <div className="color-circle default-color">
                </div>
                {!selectedColor && <CheckIcon className="check-icon" size={16} />}
              </button>
              
              {/* Opções de cores */}
              {COLOR_THEMES.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  className={`color-option ${selectedColor === color.id ? 'selected' : ''}`}
                  onClick={() => handleColorSelect(color.id)}
                  title={color.name}
                >
                  <div 
                    className="color-circle"
                    style={{ backgroundColor: color.iconColor }}
                  />
                  {selectedColor === color.id && <CheckIcon className="check-icon" size={16} />}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="tag-modal-actions">
            {tag && onDelete && (
              <button
                type="button"
                className="delete-button"
                onClick={handleDelete}
                disabled={isLoading}
              >
                Excluir
              </button>
            )}
            <div className="action-buttons">
              <button
                type="button"
                className="cancel-button"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="save-button"
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .tag-modal-backdrop {
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
          backdrop-filter: blur(4px);
          height: 100vh;
          width: 100vw;
        }

        .tag-modal {
          background: var(--bg-primary, #ffffff);
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 400px;
          max-height: 90vh;
          overflow-y: auto;
          transform: translateX(-140%);
        }

        .tag-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 24px 0 24px;
          margin-bottom: 24px;
        }

        .tag-modal-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #111827);
          margin: 0;
        }

        .tag-modal-close {
          background: none;
          border: none;
          color: var(--text-muted, #6b7280);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        .tag-modal-close:hover {
          background: var(--bg-hover, #f3f4f6);
          color: var(--text-primary, #374151);
        }

        .tag-modal-form {
          padding: 0 24px 24px 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary, #374151);
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border-color, #d1d5db);
          border-radius: 8px;
          font-size: 14px;
          color: var(--text-primary, #111827);
          background: var(--bg-primary, #ffffff);
          transition: all 0.15s ease;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary-color, #3b82f6);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .character-count {
          font-size: 12px;
          color: var(--text-muted, #6b7280);
          text-align: right;
          margin-top: 4px;
        }

        .color-selector {
          position: relative;
        }

        .color-selector-button {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border-color, #d1d5db);
          border-radius: 8px;
          background: var(--bg-primary, #ffffff);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.15s ease;
        }

        .color-selector-button:hover {
          border-color: var(--border-hover, #9ca3af);
        }

        .color-preview {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .color-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .default-color {
          background: var(--bg-primary, #ffffff);
          border: 2px solid var(--border-color, #d1d5db);
        }

        .default-text {
          font-size: 8px;
          color: var(--text-muted, #6b7280);
          font-weight: 500;
          text-transform: lowercase;
        }

        .color-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .color-option {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          padding: 0;
        }

        .color-option:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .color-option.selected {
          box-shadow: 0 0 0 3px var(--bg-selected, #eff6ff);
        }

        .check-icon {
          color: var(--text-selected, #1d4ed8);
          position: absolute;
          right: -2px;
          top: -2px;
          background: var(--bg-primary, #ffffff);
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .tag-modal-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 24px;
        }

        .delete-button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .delete-button:hover {
          background: #b91c1c;
        }

        .delete-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .cancel-button {
          background: transparent;
          color: var(--text-muted, #6b7280);
          border: 1px solid var(--border-color, #d1d5db);
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .cancel-button:hover {
          background: var(--bg-hover, #f3f4f6);
          color: var(--text-primary, #374151);
        }

        .save-button {
          background: var(--primary-color, #3b82f6);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .save-button:hover {
          background: var(--primary-hover, #2563eb);
        }

        .save-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .tag-modal {
            --bg-primary: #1f2937;
            --bg-hover: #374151;
            --bg-selected: #1e3a8a;
            --text-primary: #f9fafb;
            --text-selected: #60a5fa;
            --text-muted: #9ca3af;
            --border-color: #4b5563;
            --border-hover: #6b7280;
            --primary-color: #3b82f6;
            --primary-hover: #2563eb;
          }

          .default-color {
            background: #374151;
            border-color: #6b7280;
          }

          .error-message {
            background: #7f1d1d;
            border-color: #dc2626;
            color: #fca5a5;
          }
        }

        /* Responsividade */
        @media (max-width: 640px) {
          .tag-modal {
            margin: 10px;
            max-width: calc(100vw - 20px);
          }

          .tag-modal-header {
            padding: 20px 20px 0 20px;
            margin-bottom: 20px;
          }

          .tag-modal-form {
            padding: 0 20px 20px 20px;
          }

          .tag-modal-actions {
            flex-direction: column-reverse;
            align-items: stretch;
          }

          .action-buttons {
            width: 100%;
          }

          .cancel-button,
          .save-button {
            flex: 1;
          }

          .delete-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}