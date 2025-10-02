import React, { useState, useEffect } from 'react';
import { LucideBookmark, LucideBookmarkCheck, LucidePlus, LucideX, LucideEdit, LucideTrash2 } from 'lucide-react';

interface SavedFilterView {
  id: string;
  name: string;
  filters: {
    searchTerm: string;
    filter: string;
    assigneeFilter: string;
    tagFilter: string;
    priorityFilter: string;
  };
  isDefault?: boolean;
}

interface SavedFilterViewsProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  currentFilters: {
    searchTerm: string;
    filter: string;
    assigneeFilter: string;
    tagFilter: string;
    priorityFilter: string;
  };
  onApplyFilters: (filters: SavedFilterView['filters']) => void;
  onSaveCurrentFilters: (name: string) => void;
}

const SavedFilterViews: React.FC<SavedFilterViewsProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  currentFilters,
  onApplyFilters,
  onSaveCurrentFilters,
}) => {
  const [savedViews, setSavedViews] = useState<SavedFilterView[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Load saved views from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedFilterViews');
    if (saved) {
      try {
        setSavedViews(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved filter views:', error);
      }
    }
  }, []);

  // Save views to localStorage
  const saveViewsToStorage = (views: SavedFilterView[]) => {
    localStorage.setItem('savedFilterViews', JSON.stringify(views));
  };

  const handleSaveView = () => {
    if (!newViewName.trim()) return;

    const newView: SavedFilterView = {
      id: Date.now().toString(),
      name: newViewName.trim(),
      filters: { ...currentFilters },
    };

    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    saveViewsToStorage(updatedViews);
    setNewViewName('');
    setIsCreating(false);
  };

  const handleApplyView = (view: SavedFilterView) => {
    onApplyFilters(view.filters);
    onClose();
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = savedViews.filter(view => view.id !== viewId);
    setSavedViews(updatedViews);
    saveViewsToStorage(updatedViews);
  };

  const handleStartEdit = (view: SavedFilterView) => {
    setEditingViewId(view.id);
    setEditingName(view.name);
  };

  const handleSaveEdit = () => {
    if (!editingName.trim() || !editingViewId) return;

    const updatedViews = savedViews.map(view =>
      view.id === editingViewId
        ? { ...view, name: editingName.trim() }
        : view
    );
    setSavedViews(updatedViews);
    saveViewsToStorage(updatedViews);
    setEditingViewId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingViewId(null);
    setEditingName('');
  };

  const isCurrentFiltersSaved = savedViews.some(view =>
    JSON.stringify(view.filters) === JSON.stringify(currentFilters)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-2xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Saved Filter Views
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LucideX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Save Current Filters */}
          {!isCurrentFiltersSaved && (
            <div className="mb-4">
              {isCreating ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="View name..."
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveView();
                      } else if (e.key === 'Escape') {
                        setIsCreating(false);
                        setNewViewName('');
                      }
                    }}
                  />
                  <button
                    onClick={handleSaveView}
                    disabled={!newViewName.trim()}
                    className="px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewViewName('');
                    }}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand hover:bg-brand/5 transition-colors text-sm text-gray-700 dark:text-gray-300"
                >
                  <LucidePlus className="w-4 h-4" />
                  <span>Save current filters as view</span>
                </button>
              )}
            </div>
          )}

          {/* Saved Views List */}
          <div className="space-y-2">
            {savedViews.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No saved views yet
              </div>
            ) : (
              savedViews.map((view) => (
                <div
                  key={view.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {editingViewId === view.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className={`flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-brand ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit();
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="px-2 py-1 bg-brand text-white rounded text-xs hover:bg-brand-dark transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <LucideBookmark className="w-4 h-4 text-brand flex-shrink-0" />
                        <span className={`text-sm font-medium truncate ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {view.name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {editingViewId !== view.id && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleApplyView(view)}
                        className="p-1 text-brand hover:bg-brand/10 rounded transition-colors"
                        title="Apply view"
                      >
                        <LucideBookmarkCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(view)}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Edit view"
                      >
                        <LucideEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteView(view.id)}
                        className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete view"
                      >
                        <LucideTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {savedViews.length} saved view{savedViews.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedFilterViews;
