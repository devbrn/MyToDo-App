/**
 * Ícone de ampulheta/carregamento
 */
export const HourglassIcon = ({ className = '', size = 16 }: { className?: string; size?: number }) => (
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
    <path d="M6 2v6h12V2M6 16v6h12v-6M6 8l6 4 6-4M6 16l6-4 6 4" />
  </svg>
);