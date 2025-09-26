import React, { useEffect, useState } from 'react';
import { COLOR_THEMES } from '@/utils/colors';
import { CheckIcon } from './icons';

interface ColorPickerProps {
  selectedColor?: string | null;
  onColorSelect: (color: string | null) => void;
  onClose: () => void;
}

/**
 * Componente para seleção de cores - Design dropdown moderno
 */
export function ColorPicker({ selectedColor, onColorSelect, onClose }: ColorPickerProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const calculatePosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;
      
      // Dimensões do dropdown
      const dropdownWidth = 200;
      const dropdownHeight = 300;
      
      // Calcular posição central da área visível
      const centerX = scrollLeft + (viewportWidth / 2) - (dropdownWidth / 2);
      const centerY = scrollTop + (viewportHeight / 2) - (dropdownHeight / 2);
      
      // Garantir que o dropdown não saia das bordas visíveis
      const finalX = Math.max(scrollLeft + 20, Math.min(centerX, scrollLeft + viewportWidth - dropdownWidth - 20));
      const finalY = Math.max(scrollTop + 20, Math.min(centerY, scrollTop + viewportHeight - dropdownHeight - 20));
      
      setPosition({ top: finalY, left: finalX });
    };

    calculatePosition();
    
    // Recalcular posição quando a janela for redimensionada ou houver scroll
    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="color-picker-backdrop" onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
      <div 
        className="color-picker-dropdown"
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
        }}
      >
        {/* Opção padrão */}
        <button
          className={`color-option ${!selectedColor ? 'selected' : ''}`}
          onClick={() => onColorSelect(null)}
        >
          <div className="color-circle default-color">
            <span className="default-text">padrão</span>
          </div>
          <span className="color-name">Padrão</span>
          {!selectedColor && <CheckIcon className="check-icon" size={16} />}
        </button>
        
        {/* Opções de cores */}
        {COLOR_THEMES.map((color) => (
          <button
            key={color.id}
            className={`color-option ${selectedColor === color.id ? 'selected' : ''}`}
            onClick={() => onColorSelect(color.id)}
          >
            <div 
              className="color-circle"
              style={{ backgroundColor: color.iconColor }}
            ></div>
            <span className="color-name">{color.name}</span>
            {selectedColor === color.id && <CheckIcon className="check-icon" size={16} />}
          </button>
        ))}
      </div>

      <style>{`
        .color-picker-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 1000;
          backdrop-filter: blur(2px);
        }

        .color-picker-dropdown {
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          padding: 8px;
          min-width: 200px;
          max-height: 300px;
          overflow-y: auto;
          z-index: 1001;
        }

        .color-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 14px;
          color: var(--text-primary, #374151);
          position: relative;
        }

        .color-option:hover {
          background: var(--bg-hover, #f3f4f6);
        }

        .color-option.selected {
          background: var(--bg-selected, #eff6ff);
          color: var(--text-selected, #1d4ed8);
        }

        .color-circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
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

        .color-name {
          flex: 1;
          text-align: left;
          font-weight: 500;
        }

        .check-icon {
          color: var(--text-selected, #1d4ed8);
          margin-left: auto;
        }

        /* Scrollbar personalizada */
        .color-picker-dropdown::-webkit-scrollbar {
          width: 6px;
        }

        .color-picker-dropdown::-webkit-scrollbar-track {
          background: transparent;
        }

        .color-picker-dropdown::-webkit-scrollbar-thumb {
          background: var(--border-color, #d1d5db);
          border-radius: 3px;
        }

        .color-picker-dropdown::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted, #9ca3af);
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .color-picker-dropdown {
            --bg-primary: #1f2937;
            --bg-hover: #374151;
            --bg-selected: #1e3a8a;
            --text-primary: #f9fafb;
            --text-selected: #60a5fa;
            --text-muted: #9ca3af;
            --border-color: #4b5563;
          }

          .default-color {
            background: #374151;
            border-color: #6b7280;
          }

          .default-text {
            color: #9ca3af;
          }
        }

        /* Responsividade */
        @media (max-width: 640px) {
          .color-picker-dropdown {
            min-width: 180px;
            max-height: 250px;
          }

          .color-option {
            padding: 10px 12px;
          }

          .color-circle {
            width: 18px;
            height: 18px;
          }

          .default-text {
            font-size: 7px;
          }
        }
      `}</style>
    </div>
  );
}