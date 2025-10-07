import React from 'react';
import { typography, colors } from '../../../styles/designTokens';

interface SectionHeaderProps {
  label: string;
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  isDarkMode?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  title,
  action,
  className = '',
  isDarkMode = false
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <div 
          className={`text-xs font-medium tracking-wide mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
        >
          {label}
        </div>
        <h2 
          className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {title}
        </h2>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className={`text-sm font-medium hover:underline transition-colors duration-150 ${
            isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
