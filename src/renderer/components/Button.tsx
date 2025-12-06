import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  className = '',
  style = {}
}) => {
  const baseStyles: React.CSSProperties = {
    padding: '11px 20px',
    fontSize: '14px',
    fontWeight: 700,
    borderRadius: '8px',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.06)',
    border: '1px solid #e4e4e7',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      color: '#ffffff',
      backgroundColor: '#3f0c8d',
    },
    secondary: {
      color: '#52525b',
      backgroundColor: '#ffffff',
      border: '1px solid #e4e4e7',
    },
  };

  const hoverBg = variant === 'primary' ? '#8017f5' : '#f0f0f2';
  const defaultBg = variant === 'primary' ? '#3f0c8d' : '#ffffff';

  return (
    <button
      onClick={onClick}
      className={`flex items-center transition-colors duration-150 ${className}`}
      style={{ ...baseStyles, ...variantStyles[variant], ...style }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = defaultBg}
    >
      {children}
    </button>
  );
};
