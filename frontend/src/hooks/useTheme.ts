import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

/**
 * Hook personalizado para gerenciar o tema da aplicação
 * Persiste a preferência no localStorage e aplica automaticamente ao documento
 */
export const useTheme = () => {
  // Função para detectar preferência do sistema
  const getSystemTheme = (): Theme => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Função para obter tema salvo ou usar preferência do sistema
  const getSavedTheme = (): Theme => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      return saved || getSystemTheme();
    }
    return 'light';
  };

  const [theme, setTheme] = useState<Theme>(getSavedTheme);

  // Função para alternar entre temas
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Efeito para aplicar o tema ao documento e salvar no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Remove classes de tema anteriores
      document.documentElement.classList.remove('light', 'dark');
      
      // Adiciona a nova classe de tema
      document.documentElement.classList.add(theme);
      
      // Salva no localStorage
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  // Efeito para escutar mudanças na preferência do sistema
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        // Só atualiza se não há preferência salva
        if (!localStorage.getItem('theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };
};