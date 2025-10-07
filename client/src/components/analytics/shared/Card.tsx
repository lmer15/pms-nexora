import React from 'react';
import { colors, spacing, radius, shadow } from '../../../styles/designTokens';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  elevation?: 'sm' | 'base' | 'lg';
  onClick?: () => void;
  hoverable?: boolean;
  isDarkMode?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  elevation = 'base',
  onClick,
  hoverable = false,
  isDarkMode = false
}) => {
  const paddingClasses = {
    sm: `p-${spacing.sm / 4}`,
    md: `p-${spacing.md / 4}`,
    lg: `p-${spacing.lg / 4}`
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    base: 'shadow-md',
    lg: 'shadow-lg'
  };

  const baseClasses = `
    rounded-lg border
    ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
    ${paddingClasses[padding]}
    ${shadowClasses[elevation]}
    ${hoverable ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim();

  return (
    <div 
      className={baseClasses}
      onClick={onClick}
      style={{
        borderRadius: `${radius.base}px`
      }}
    >
      {children}
    </div>
  );
};

export default Card;
