import React, { useState, useEffect } from 'react';
import { LucideX, LucideFilter, LucideSearch, LucideRotateCcw } from 'lucide-react';

interface FloatingFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  // Current filter values
  searchTerm: string;
  filter: string;
  // Filter setters
  setSearchTerm: (term: string) => void;
  setFilter: (filter: string) => void;
}

const FloatingFiltersDrawer: React.FC<FloatingFiltersDrawerProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  searchTerm,
  filter,
  setSearchTerm,
  setFilter,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [localFilter, setLocalFilter] = useState(filter);

  // Sync local state with props
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
    setLocalFilter(filter);
  }, [searchTerm, filter]);

  const handleApplyFilters = () => {
    setSearchTerm(localSearchTerm);
    setFilter(localFilter);
    onClose();
  };

  const handleResetFilters = () => {
    setLocalSearchTerm('');
    setLocalFilter('all');
  };

  const hasChanges = 
    localSearchTerm !== searchTerm ||
    localFilter !== filter;

  const hasActiveFilters = 
    localSearchTerm ||
    localFilter !== 'all';

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-sm z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-2xl`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <LucideFilter className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-semibold">Advanced Filters</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LucideX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Search
              </label>
              <div className="relative">
                <LucideSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks and projects..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Status
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Projects' },
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'with-tasks', label: 'With Tasks' },
                  { value: 'empty', label: 'Empty' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={localFilter === option.value}
                      onChange={(e) => setLocalFilter(e.target.value)}
                      className="text-brand focus:ring-brand"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>



          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Active filters:                 {[
                  localSearchTerm && 'Search',
                  localFilter !== 'all' && 'Status',
                ].filter(Boolean).join(', ')}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <LucideRotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleApplyFilters}
                disabled={!hasChanges}
                className="flex-1 px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingFiltersDrawer;
