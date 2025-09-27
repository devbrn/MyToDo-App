import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, Tag } from '@/types';
import { AutocompleteItem } from '@/components/AutocompleteDropdown';
import { normalizeProjectName } from '@/utils/normalizeProjectName';

interface AutocompleteState {
  isVisible: boolean;
  type: 'project' | 'tag' | null;
  searchTerm: string;
  selectedIndex: number;
  position: { top: number; left: number };
  triggerPosition: number; // Posição do @ ou # no texto
}

interface UseAutocompleteProps {
  projects: Project[];
  tags: Tag[];
  onCreateProject?: (name: string) => Promise<Project | null>;
  onCreateTag?: (name: string) => Promise<Tag | null>;
}

/**
 * Hook personalizado para gerenciar autocomplete de projetos e tags
 * Detecta @ para projetos e # para tags
 */
export function useAutocomplete({
  projects,
  tags,
  onCreateProject,
  onCreateTag
}: UseAutocompleteProps) {
  const [state, setState] = useState<AutocompleteState>({
    isVisible: false,
    type: null,
    searchTerm: '',
    selectedIndex: 0,
    position: { top: 0, left: 0 },
    triggerPosition: -1
  });

  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Converte projetos para itens de autocomplete
   */
  const projectItems: AutocompleteItem[] = projects.map(project => ({
    id: project.id,
    name: project.name,
    type: 'project' as const,
    color: project.color
  }));

  /**
   * Converte tags para itens de autocomplete
   */
  const tagItems: AutocompleteItem[] = tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    type: 'tag' as const
  }));

  /**
   * Obtém os itens baseado no tipo atual
   */
  const getCurrentItems = useCallback((): AutocompleteItem[] => {
    if (state.type === 'project') return projectItems;
    if (state.type === 'tag') return tagItems;
    return [];
  }, [state.type, projectItems, tagItems]);

  /**
   * Calcula a posição do dropdown baseado na posição do cursor
   */
  const calculateDropdownPosition = useCallback((input: HTMLInputElement, cursorPosition: number) => {
    const inputRect = input.getBoundingClientRect();
    
    // Criar elemento temporário para medir o texto até o cursor
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'pre';
    tempSpan.style.font = window.getComputedStyle(input).font;
    tempSpan.style.fontSize = window.getComputedStyle(input).fontSize;
    tempSpan.style.fontFamily = window.getComputedStyle(input).fontFamily;
    tempSpan.style.padding = '0';
    tempSpan.style.margin = '0';
    tempSpan.style.border = 'none';
    tempSpan.textContent = input.value.substring(0, cursorPosition);
    
    document.body.appendChild(tempSpan);
    const textWidth = tempSpan.getBoundingClientRect().width;
    document.body.removeChild(tempSpan);

    // Calcular posição mais precisa - usando coordenadas fixas (sem scroll)
    const inputPadding = parseInt(window.getComputedStyle(input).paddingLeft) || 0;
    const cursorX = inputRect.left + inputPadding + textWidth;
    const cursorY = inputRect.bottom;

    // Verificar se há espaço suficiente abaixo
    const dropdownHeight = 200; // altura estimada do dropdown
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - cursorY;
    const spaceAbove = inputRect.top;

    let top = cursorY + 2; // pequeno espaçamento
    
    // Se não há espaço suficiente abaixo, posicionar acima
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      top = inputRect.top - dropdownHeight - 2;
    }

    return {
      top: top, // Removido window.scrollY pois agora é position: fixed
      left: Math.min(cursorX, window.innerWidth - 250) // evitar sair da tela
    };
  }, []);

  /**
   * Detecta @ ou # no texto e atualiza o estado do autocomplete
   */
  /**
   * Manipula mudanças no input para detectar triggers de autocomplete
   * Aplica normalização automática em tempo real para projetos (@)
   */
  const handleInputChange = useCallback((value: string, cursorPosition: number) => {
    if (!inputRef.current) return;

    // Procurar por @ ou # antes da posição do cursor
    let triggerChar = '';
    let triggerPos = -1;
    let searchStart = -1;

    // Procurar de trás para frente a partir da posição do cursor
    for (let i = cursorPosition - 1; i >= 0; i--) {
      const char = value[i];
      
      if (char === '@' || char === '#') {
        triggerChar = char;
        triggerPos = i;
        searchStart = i + 1;
        break;
      }
      
      // Se encontrar espaço, quebrar a busca
      if (char === ' ') {
        break;
      }
    }

    // Se encontrou trigger e está na posição correta
    if (triggerChar && triggerPos >= 0 && searchStart <= cursorPosition) {
      let searchTerm = value.substring(searchStart, cursorPosition);
      
      // Aplicar normalização em tempo real para projetos (@)
      if (triggerChar === '@') {
        const normalizedTerm = normalizeProjectName(searchTerm);
        
        // Se o termo foi normalizado, atualizar o input
        if (normalizedTerm !== searchTerm && inputRef.current) {
          const beforeTrigger = value.substring(0, searchStart);
          const afterCursor = value.substring(cursorPosition);
          const newValue = beforeTrigger + normalizedTerm + afterCursor;
          
          // Atualizar o valor do input
          inputRef.current.value = newValue;
          
          // Ajustar a posição do cursor
          const newCursorPosition = searchStart + normalizedTerm.length;
          inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
          
          // Disparar evento de mudança para sincronizar com o estado do componente
          const event = new Event('input', { bubbles: true });
          inputRef.current.dispatchEvent(event);
          
          // Atualizar o termo de busca para o valor normalizado
          searchTerm = normalizedTerm;
          cursorPosition = newCursorPosition;
        }
      }
      
      const type = triggerChar === '@' ? 'project' : 'tag';
      
      setState(prev => ({
        ...prev,
        isVisible: true,
        type,
        searchTerm,
        selectedIndex: 0,
        triggerPosition: triggerPos,
        position: calculateDropdownPosition(inputRef.current!, cursorPosition)
      }));
    } else {
      // Esconder dropdown se não há trigger válido
      setState(prev => ({
        ...prev,
        isVisible: false,
        type: null,
        searchTerm: '',
        selectedIndex: 0,
        triggerPosition: -1
      }));
    }
  }, [calculateDropdownPosition]);

  /**
   * Navega pelos itens do dropdown
   */
  const navigateDropdown = useCallback((direction: 'up' | 'down') => {
    if (!state.isVisible) return;

    const items = getCurrentItems().filter(item =>
      item?.name?.toLowerCase().includes(state.searchTerm.toLowerCase())
    );
    
    // Adicionar item "criar novo" se houver termo de busca
    const totalItems = state.searchTerm.trim().length > 0 ? items.length + 1 : items.length;
    
    setState(prev => {
      let newIndex = prev.selectedIndex;
      
      if (direction === 'down') {
        newIndex = (newIndex + 1) % totalItems;
      } else {
        newIndex = newIndex <= 0 ? totalItems - 1 : newIndex - 1;
      }
      
      return { ...prev, selectedIndex: newIndex };
    });
  }, [state.isVisible, state.searchTerm, getCurrentItems]);

  /**
   * Seleciona um item do dropdown
   */
  const selectItem = useCallback(async (item: AutocompleteItem | null, inputValue: string): Promise<string> => {
    if (!state.isVisible || state.triggerPosition < 0) return inputValue;

    let newValue = inputValue;
    let selectedItem = item;

    // Se não há item selecionado, usar o item atualmente selecionado
    if (!selectedItem) {
      const items = getCurrentItems().filter(i =>
        i?.name?.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
      
      if (state.selectedIndex < items.length) {
        selectedItem = items[state.selectedIndex];
      } else if (state.searchTerm.trim().length > 0) {
        // Criar novo item
        if (state.type === 'project' && onCreateProject) {
          const newProject = await onCreateProject(state.searchTerm);
          if (newProject) {
            selectedItem = {
              id: newProject.id,
              name: newProject.name,
              type: 'project'
            };
          }
        } else if (state.type === 'tag' && onCreateTag) {
          const newTag = await onCreateTag(state.searchTerm);
          if (newTag) {
            selectedItem = {
              id: newTag.id,
              name: newTag.name,
              type: 'tag'
            };
          }
        }
      }
    }

    if (selectedItem) {
      const prefix = state.type === 'project' ? '@' : '#';
      const replacement = `${prefix}${selectedItem.name} `;
      
      // Substituir o texto desde o trigger até a posição atual do cursor
      const beforeTrigger = inputValue.substring(0, state.triggerPosition);
      const afterCursor = inputValue.substring(state.triggerPosition + state.searchTerm.length + 1);
      
      newValue = beforeTrigger + replacement + afterCursor;
    }

    // Esconder dropdown
    setState(prev => ({
      ...prev,
      isVisible: false,
      type: null,
      searchTerm: '',
      selectedIndex: 0,
      triggerPosition: -1
    }));

    return newValue;
  }, [state, getCurrentItems, onCreateProject, onCreateTag]);

  /**
   * Esconde o dropdown
   */
  const hideDropdown = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: false,
      type: null,
      searchTerm: '',
      selectedIndex: 0,
      triggerPosition: -1
    }));
  }, []);

  /**
   * Manipula teclas especiais
   */
  const handleKeyDown = useCallback(async (
    event: React.KeyboardEvent<HTMLInputElement>,
    inputValue: string,
    onValueChange: (value: string) => void
  ) => {
    if (!state.isVisible) return false;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        navigateDropdown('down');
        return true;

      case 'ArrowUp':
        event.preventDefault();
        navigateDropdown('up');
        return true;

      case 'Enter':
      case 'Tab':
        event.preventDefault();
        const newValue = await selectItem(null, inputValue);
        onValueChange(newValue);
        return true;

      case 'Escape':
        event.preventDefault();
        hideDropdown();
        return true;

      default:
        return false;
    }
  }, [state.isVisible, navigateDropdown, selectItem, hideDropdown]);

  return {
    // Estado
    isVisible: state.isVisible,
    type: state.type,
    searchTerm: state.searchTerm,
    selectedIndex: state.selectedIndex,
    position: state.position,
    
    // Itens
    items: getCurrentItems(),
    
    // Métodos
    handleInputChange,
    handleKeyDown,
    selectItem,
    hideDropdown,
    
    // Ref
    inputRef
  };
}