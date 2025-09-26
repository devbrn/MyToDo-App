import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { MoonIcon, SunIcon } from './icons';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Componente de toggle para alternar entre modo claro e escuro
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      title={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
      aria-label={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
    >
      {isDark ? (
        <SunIcon size={18} />
      ) : (
        <MoonIcon size={18} />
      )}
    </button>
  );
};