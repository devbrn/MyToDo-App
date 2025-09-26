import React from 'react';

interface EmptyStateIconProps {
  size?: number;
  className?: string;
}

/**
 * Ícone para estado vazio (lista vazia)
 */
export const EmptyStateIcon: React.FC<EmptyStateIconProps> = ({ size = 48, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21,15 -3.086,-3.086a2,2 0 0,0 -2.828,0L6,21" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
    </svg>
  );
};