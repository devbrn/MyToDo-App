import React from 'react';
import { createPortal } from 'react-dom';
import { PlusIcon } from 'lucide-react';

export interface AutocompleteItem {
  id: string;
  name: string;
  type: 'project' | 'tag';
  color?: string;
}

interface AutocompleteDropdownProps {
  items: AutocompleteItem[];
  isVisible: boolean;
  position: { top: number; left: number };
  searchTerm: string;
  selectedIndex: number;
  onSelect: (item: AutocompleteItem, inputValue: string) => void;
  onCreateNew?: (name: string) => void;
  type: 'project' | 'tag';
  inputValue?: string; // Adicionar prop para o valor atual do input
}

/**
 * Componente de dropdown para autocomplete de projetos e tags
 * Renderizado via portal para evitar problemas de z-index e posicionamento
 */
export function AutocompleteDropdown({
  items,
  isVisible,
  position,
  searchTerm,
  selectedIndex,
  onSelect,
  onCreateNew,
  type,
  inputValue
}: AutocompleteDropdownProps) {
  if (!isVisible) return null;

  // Filtrar itens baseado no termo de busca
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar se deve mostrar opção "criar novo"
  const showCreateNew = searchTerm.trim().length > 0 && onCreateNew;
  const totalItems = showCreateNew ? filteredItems.length + 1 : filteredItems.length;

  if (totalItems === 0) return null;

  /**
   * Manipula o clique em um item
   */
  const handleItemClick = (item: AutocompleteItem) => {
    // Obter o valor atual do input do DOM se não foi passado via props
    const currentInputValue = inputValue || '';
    onSelect(item, currentInputValue);
  };

  /**
   * Manipula o clique em "criar novo"
   */
  const handleCreateNew = () => {
    if (onCreateNew && searchTerm.trim()) {
      onCreateNew(searchTerm.trim());
    }
  };

  const dropdownContent = (
    <div
      className="autocomplete-dropdown"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 10000, // Z-index muito alto para ficar acima de tudo
        backgroundColor: '#2a2a2a',
        border: '1px solid #444',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        minWidth: '200px',
        maxWidth: '300px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}
    >
      {/* Itens existentes */}
      {filteredItems.map((item, index) => (
        <div
          key={item.id}
          className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => handleItemClick(item)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            backgroundColor: index === selectedIndex ? '#3a3a3a' : 'transparent',
            borderBottom: index < filteredItems.length - 1 || showCreateNew ? '1px solid #444' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#e0e0e0',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3a3a3a';
          }}
          onMouseLeave={(e) => {
            if (index !== selectedIndex) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {item.type === 'project' && (
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: item.color || '#666',
                flexShrink: 0
              }}
            />
          )}
          <span style={{ color: type === 'project' ? '#4ade80' : '#60a5fa' }}>
            {type === 'project' ? '@' : '#'}
          </span>
          <span>{item.name}</span>
        </div>
      ))}

      {/* Opção "criar novo" */}
      {showCreateNew && (
        <div
          className={`autocomplete-item create-new ${filteredItems.length === selectedIndex ? 'selected' : ''}`}
          onClick={handleCreateNew}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            backgroundColor: filteredItems.length === selectedIndex ? '#3a3a3a' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#e0e0e0',
            fontSize: '14px',
            fontStyle: 'italic'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3a3a3a';
          }}
          onMouseLeave={(e) => {
            if (filteredItems.length !== selectedIndex) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <PlusIcon size={12} style={{ color: '#888' }} />
          <span style={{ color: type === 'project' ? '#4ade80' : '#60a5fa' }}>
            {type === 'project' ? '@' : '#'}
          </span>
          <span>Criar "{searchTerm}"</span>
        </div>
      )}
    </div>
  );

  // Renderizar via portal no body para evitar problemas de z-index
  return createPortal(dropdownContent, document.body);
}