import React, { useState, useEffect } from 'react';
import { LucideBookmark, LucideBookmarkCheck, LucidePlus, LucideX, LucideEdit, LucideTrash2, LucideLoader2 } from 'lucide-react';
import { savedFilterViewService, SavedFilterView as ServerSavedFilterView } from '../api/savedFilterViewService';

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
  facilityId: string;
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
  facilityId,
  currentFilters,
  onApplyFilters,
  onSaveCurrentFilters,
}) => {
  const [savedViews, setSavedViews] = useState<SavedFilterView[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load saved views from server
  useEffect(() => {
    if (isOpen && facilityId) {
      loadSavedViews();
    }
  }, [isOpen, facilityId]);

  const loadSavedViews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const views = await savedFilterViewService.getByFacility(facilityId);
      // Convert server format to local format
      const localViews: SavedFilterView[] = views.map(view => ({
        id: view.id,
        name: view.name,
        filters: view.filters,
        isDefault: view.isDefault
      }));
      setSavedViews(localViews);
    } catch (err: any) {
      console.error('Failed to load saved filter views from server:', err);
      
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem('savedFilterViews');
        if (saved) {
          const localViews = JSON.parse(saved);
          setSavedViews(localViews);
          setError('Using offline saved views (server unavailable)');
        } else {
          setSavedViews([]);
          setError('Failed to load saved views');
        }
      } catch (localErr) {
        console.error('Failed to load from localStorage:', localErr);
        setSavedViews([]);
        setError('Failed to load saved views');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveView = async () => {
    if (!newViewName.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      const newView = await savedFilterViewService.create({
        name: newViewName.trim(),
        facilityId,
        filters: { ...currentFilters },
        isDefault: false
      });

      // Convert server format to local format
      const localView: SavedFilterView = {
        id: newView.id,
        name: newView.name,
        filters: newView.filters,
        isDefault: newView.isDefault
      };

      setSavedViews(prev => [...prev, localView]);
      setNewViewName('');
      setIsCreating(false);
    } catch (err: any) {
      console.error('Failed to save filter view to server:', err);
      
      // Fallback to localStorage
      try {
        const localView: SavedFilterView = {
          id: Date.now().toString(),
          name: newViewName.trim(),
          filters: { ...currentFilters },
          isDefault: false
        };

        const updatedViews = [...savedViews, localView];
        setSavedViews(updatedViews);
        localStorage.setItem('savedFilterViews', JSON.stringify(updatedViews));
        setNewViewName('');
        setIsCreating(false);
        setError('Saved locally (server unavailable)');
      } catch (localErr) {
        console.error('Failed to save to localStorage:', localErr);
        setError('Failed to save filter view');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyView = (view: SavedFilterView) => {
    onApplyFilters(view.filters);
    onClose();
  };

  const handleDeleteView = async (viewId: string) => {
    setIsDeleting(viewId);
    setError(null);
    try {
      await savedFilterViewService.delete(viewId);
      setSavedViews(prev => prev.filter(view => view.id !== viewId));
    } catch (err: any) {
      console.error('Failed to delete filter view from server:', err);
      
      // Fallback to localStorage
      try {
        const updatedViews = savedViews.filter(view => view.id !== viewId);
        setSavedViews(updatedViews);
        localStorage.setItem('savedFilterViews', JSON.stringify(updatedViews));
        setError('Deleted locally (server unavailable)');
      } catch (localErr) {
        console.error('Failed to delete from localStorage:', localErr);
        setError('Failed to delete filter view');
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const handleStartEdit = (view: SavedFilterView) => {
    setEditingViewId(view.id);
    setEditingName(view.name);
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim() || !editingViewId) return;

    setIsSaving(true);
    setError(null);
    try {
      const updatedView = await savedFilterViewService.update(editingViewId, {
        name: editingName.trim()
      });

      setSavedViews(prev => prev.map(view =>
        view.id === editingViewId
          ? { ...view, name: updatedView.name }
          : view
      ));
      setEditingViewId(null);
      setEditingName('');
    } catch (err: any) {
      console.error('Failed to update filter view on server:', err);
      
      // Fallback to localStorage
      try {
        const updatedViews = savedViews.map(view =>
          view.id === editingViewId
            ? { ...view, name: editingName.trim() }
            : view
        );
        setSavedViews(updatedViews);
        localStorage.setItem('savedFilterViews', JSON.stringify(updatedViews));
        setEditingViewId(null);
        setEditingName('');
        setError('Updated locally (server unavailable)');
      } catch (localErr) {
        console.error('Failed to update localStorage:', localErr);
        setError('Failed to update filter view');
      }
    } finally {
      setIsSaving(false);
    }
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
              <LucideX className="w-4 h-4" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                <LucideX className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

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
                    disabled={!newViewName.trim() || isSaving}
                    className="px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center space-x-1"
                  >
                    {isSaving && <LucideLoader2 className="w-3 h-3 animate-spin" />}
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
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
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                <LucideLoader2 className="w-4 h-4 animate-spin mr-2" />
                Loading saved views...
              </div>
            ) : savedViews.length === 0 ? (
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
                          disabled={isSaving}
                          className="px-2 py-1 bg-brand text-white rounded text-xs hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                        >
                          {isSaving && <LucideLoader2 className="w-3 h-3 animate-spin" />}
                          <span>{isSaving ? 'Saving...' : 'Save'}</span>
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
                        disabled={isDeleting === view.id}
                        className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete view"
                      >
                        {isDeleting === view.id ? (
                          <LucideLoader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LucideTrash2 className="w-4 h-4" />
                        )}
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
