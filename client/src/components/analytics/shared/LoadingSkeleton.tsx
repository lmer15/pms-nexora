import React from 'react';
import { colors } from '../../../styles/designTokens';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
  isDarkMode?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  lines = 1,
  height = 'h-4',
  isDarkMode = false
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${height} rounded mb-2 ${
            index === lines - 1 ? 'mb-0' : ''
          } ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  );
};

// Specific skeleton components for different use cases
export const KPICardSkeleton: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = false }) => (
  <div className={`p-6 rounded-lg border ${
    isDarkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200'
  }`}>
    <LoadingSkeleton lines={1} height="h-3" className="mb-2 w-1/3" isDarkMode={isDarkMode} />
    <LoadingSkeleton lines={1} height="h-8" className="mb-2 w-1/2" isDarkMode={isDarkMode} />
    <LoadingSkeleton lines={1} height="h-3" className="w-1/4" isDarkMode={isDarkMode} />
  </div>
);

export const ChartSkeleton: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = false }) => (
  <div className={`p-6 rounded-lg border ${
    isDarkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200'
  }`}>
    <LoadingSkeleton lines={1} height="h-6" className="mb-4 w-1/3" isDarkMode={isDarkMode} />
    <div className={`h-64 rounded ${
      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
    }`}></div>
  </div>
);

export const TableSkeleton: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = false }) => (
  <div className={`rounded-lg border overflow-hidden ${
    isDarkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200'
  }`}>
    <div className={`p-4 border-b ${
      isDarkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <LoadingSkeleton lines={1} height="h-5" className="w-1/4" isDarkMode={isDarkMode} />
    </div>
    <div className="p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex space-x-4">
          <LoadingSkeleton lines={1} height="h-4" className="w-1/4" isDarkMode={isDarkMode} />
          <LoadingSkeleton lines={1} height="h-4" className="w-1/3" isDarkMode={isDarkMode} />
          <LoadingSkeleton lines={1} height="h-4" className="w-1/6" isDarkMode={isDarkMode} />
          <LoadingSkeleton lines={1} height="h-4" className="w-1/5" isDarkMode={isDarkMode} />
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSkeleton;
