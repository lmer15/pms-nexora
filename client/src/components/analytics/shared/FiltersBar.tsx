import React from 'react';
import { colors, typography } from '../../../styles/designTokens';
import { TimeRange } from '../../../types/analytics';

interface FiltersBarProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  className?: string;
  isDarkMode?: boolean;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: '1w', label: '1 Week' },
  { value: '2w', label: '2 Weeks' },
  { value: '4w', label: '4 Weeks' },
  { value: '8w', label: '8 Weeks' },
  { value: '12w', label: '12 Weeks' }
];

const FiltersBar: React.FC<FiltersBarProps> = ({
  timeRange,
  onTimeRangeChange,
  className = '',
  isDarkMode = false
}) => {
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <label 
          className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
        >
          Time Range:
        </label>
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
          className={`px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          {timeRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FiltersBar;
