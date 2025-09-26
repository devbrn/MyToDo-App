import React from 'react';

interface LoadingIconProps {
  size?: number;
  className?: string;
}

/**
 * Ícone de carregamento/loading
 */
export const LoadingIcon: React.FC<LoadingIconProps> = ({ size = 16, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`loading-spinner ${className}`}
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
};