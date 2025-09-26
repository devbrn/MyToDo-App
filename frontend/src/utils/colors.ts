/**
 * Sistema de cores para tags e projetos
 */

export interface ColorTheme {
  id: string;
  name: string;
  iconColor: string;
  textColor: string;
  backgroundColor?: string; // Para uso futuro se quisermos fundos
}

/**
 * Paleta de cores predefinidas para tags e projetos
 */
export const COLOR_THEMES: ColorTheme[] = [
  // Azul (padrão)
  {
    id: 'blue',
    name: 'Azul',
    iconColor: '#3b82f6',
    textColor: '#1d4ed8'
  },
  // Verde
  {
    id: 'green',
    name: 'Verde',
    iconColor: '#10b981',
    textColor: '#059669'
  },
  // Roxo
  {
    id: 'purple',
    name: 'Roxo',
    iconColor: '#8b5cf6',
    textColor: '#7c3aed'
  },
  // Vermelho
  {
    id: 'red',
    name: 'Vermelho',
    iconColor: '#ef4444',
    textColor: '#dc2626'
  },
  // Laranja
  {
    id: 'orange',
    name: 'Laranja',
    iconColor: '#f97316',
    textColor: '#ea580c'
  },
  // Rosa
  {
    id: 'pink',
    name: 'Rosa',
    iconColor: '#ec4899',
    textColor: '#db2777'
  },
  // Amarelo
  {
    id: 'yellow',
    name: 'Amarelo',
    iconColor: '#eab308',
    textColor: '#ca8a04'
  },
  // Cinza
  {
    id: 'gray',
    name: 'Cinza',
    iconColor: '#6b7280',
    textColor: '#374151'
  },
  // Índigo
  {
    id: 'indigo',
    name: 'Índigo',
    iconColor: '#6366f1',
    textColor: '#4f46e5'
  },
  // Teal
  {
    id: 'teal',
    name: 'Teal',
    iconColor: '#14b8a6',
    textColor: '#0d9488'
  }
];

/**
 * Obtém o tema de cor por ID
 */
export function getColorTheme(colorId?: string): ColorTheme {
  if (!colorId) {
    return COLOR_THEMES[0]; // Azul como padrão
  }
  
  return COLOR_THEMES.find(theme => theme.id === colorId) || COLOR_THEMES[0];
}

/**
 * Gera uma cor aleatória da paleta
 */
export function getRandomColorTheme(): ColorTheme {
  const randomIndex = Math.floor(Math.random() * COLOR_THEMES.length);
  return COLOR_THEMES[randomIndex];
}

/**
 * Obtém todas as cores disponíveis
 */
export function getAllColorThemes(): ColorTheme[] {
  return COLOR_THEMES;
}