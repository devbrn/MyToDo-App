import React from 'react';

interface ClipboardIconProps {
  size?: number;
  className?: string;
}

/**
 * Ícone de clipboard/prancheta
 */
export const ClipboardIcon: React.FC<ClipboardIconProps> = ({ size = 16, className = '' }) => {
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
      className={className}
    >
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="m16,4h2a2,2 0 0,1 2,2v14a2,2 0 0,1 -2,2H6a2,2 0 0,1 -2,-2V6A2,2 0 0,1 6,4h2" />
    </svg>
  );
};