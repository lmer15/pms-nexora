import React from 'react';
import { colors } from '../../../styles/designTokens';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'auto';
  className?: string;
  isDarkMode?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  color = 'auto',
  className = '',
  isDarkMode = false
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const getColor = () => {
    if (color !== 'auto') {
      return colors[color];
    }
    
    if (percentage >= 100) return colors.danger;
    if (percentage >= 80) return colors.warning;
    if (percentage >= 60) return colors.primary;
    return colors.success;
  };

  const getStatusColor = () => {
    if (percentage >= 100) return colors.status.overloaded;
    if (percentage >= 80) return colors.status.caution;
    return colors.status.balanced;
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span 
              className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
            >
              {label}
            </span>
          )}
          {showPercentage && (
            <span 
              className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div 
        className={`w-full rounded-full overflow-hidden ${sizeClasses[size]} ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        <div
          className="h-full transition-all duration-300 ease-out rounded-full"
          style={{
            width: `${percentage}%`,
            background: color === 'auto' && percentage >= 80 
              ? `linear-gradient(90deg, ${getStatusColor()} 0%, ${getStatusColor()}dd 100%)`
              : (color === 'auto' ? getStatusColor() : getColor())
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
