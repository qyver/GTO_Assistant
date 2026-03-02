import { ReactNode } from 'react';
import { haptic } from '@/lib/telegram';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const handleClick = () => {
    if (disabled || loading) return;
    haptic.light();
    onClick?.();
  };

  const variantClass = {
    primary: 'btn btn-primary',
    secondary: 'btn btn-secondary',
    ghost: 'btn btn-ghost',
  }[variant];

  // Only lg gets full-size padding; sm/ghost override inline
  const sizeExtra = size === 'sm' ? 'text-sm py-2 px-3' : size === 'lg' ? 'text-base' : '';

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${variantClass} ${sizeExtra} ${className}`}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg
            style={{ animation: 'spin 0.8s linear infinite', width: 18, height: 18 }}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
            <path
              fill="currentColor"
              opacity="0.75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading…
        </span>
      ) : (
        children
      )}
    </button>
  );
}
