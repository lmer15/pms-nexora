import React, { useState, useEffect } from 'react';
import {
  LucidePlus,
  LucideSearch,
  LucideFilter,
  LucidePin,
  LucideArchive,
  LucideEdit,
  LucideTrash2,
  LucideFileText,
  LucideTag,
  LucideFolder,
  LucideMoreVertical,
  LucideX,
  LucideChevronDown,
  LucideEye
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import NoteEditorModal from '../components/NoteEditorModal';
import NoteReaderModal from '../components/NoteReaderModal';
import { Note } from '../api/notesService';

const Notes: React.FC = () => {
  const {
    notes,
    pinnedNotes,
    archivedNotes,
    categories,
    tags,
    loading,
    error,
    searchTerm,
    selectedCategory,
    viewMode,
    setViewMode,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    searchNotes,
    filterByCategory,
    clearFilters
  } = useNotes();
  
  const { isDarkMode } = useTheme();
  const { showToast } = useToast();
  
  // Local state
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);

  // Sync search input with context
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  const getCurrentNotes = () => {
    switch (viewMode) {
      case 'pinned':
        return pinnedNotes;
      case 'archived':
        return archivedNotes;
      default:
        return notes;
    }
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    searchNotes(value);
  };

  const handleCreateNote = () => {
    setSelectedNote(null);
    setEditorMode('create');
    setShowEditor(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setEditorMode('edit');
    setShowEditor(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const note = getCurrentNotes().find(n => n.id === noteId);
      await deleteNote(noteId);
      setShowDeleteConfirm(null);
      showToast({
        type: 'success',
        title: 'Note deleted',
        message: note ? `"${note.title}" has been deleted` : 'Note has been deleted',
        duration: 3000
      });
    } catch (err) {
      console.error('Error deleting note:', err);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete note',
        duration: 4000
      });
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      await togglePin(note.id, !note.isPinned);
      showToast({
        type: 'success',
        title: note.isPinned ? 'Note unpinned' : 'Note pinned',
        message: `"${note.title}" has been ${note.isPinned ? 'unpinned' : 'pinned'}`,
        duration: 3000
      });
    } catch (err) {
      console.error('Error toggling pin:', err);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update note pin status',
        duration: 4000
      });
    }
  };

  const handleToggleArchive = async (note: Note) => {
    try {
      await toggleArchive(note.id, !note.isArchived);
      showToast({
        type: 'success',
        title: note.isArchived ? 'Note unarchived' : 'Note archived',
        message: `"${note.title}" has been ${note.isArchived ? 'unarchived' : 'archived'}`,
        duration: 3000
      });
    } catch (err) {
      console.error('Error toggling archive:', err);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update note archive status',
        duration: 4000
      });
    }
  };

  const handleReadNote = (note: Note) => {
    const currentNotes = getCurrentNotes();
    const index = currentNotes.findIndex(n => n.id === note.id);
    setCurrentNoteIndex(index);
    setSelectedNote(note);
    setShowReader(true);
  };

  const handleEditFromReader = (note: Note) => {
    setShowReader(false);
    handleEditNote(note);
  };

  const handlePreviousNote = () => {
    const currentNotes = getCurrentNotes();
    if (currentNoteIndex > 0) {
      setCurrentNoteIndex(currentNoteIndex - 1);
      setSelectedNote(currentNotes[currentNoteIndex - 1]);
    }
  };

  const handleNextNote = () => {
    const currentNotes = getCurrentNotes();
    if (currentNoteIndex < currentNotes.length - 1) {
      setCurrentNoteIndex(currentNoteIndex + 1);
      setSelectedNote(currentNotes[currentNoteIndex + 1]);
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Original date:', date);
      return 'Invalid Date';
    }
  };

  const renderNoteContent = (content: string) => {
    if (!content) return '';
    
    if (content.includes('<') && content.includes('>')) {
      return (
        <div 
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(linkRegex);
    
    return parts.map((part, index) => {
      if (linkRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const getNoteColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      yellow: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 border-amber-200 dark:border-amber-700',
      green: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 border-emerald-200 dark:border-emerald-700',
      blue: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700',
      purple: 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900 dark:to-violet-800 border-violet-200 dark:border-violet-700',
      pink: 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900 dark:to-rose-800 border-rose-200 dark:border-rose-700',
      red: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 border-red-200 dark:border-red-700',
      orange: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700'
    };
    return colorMap[color] || colorMap.default;
  };

  const currentNotes = getCurrentNotes();

  return (
    <div className="p-4 space-y-3 bg-neutral-light dark:bg-gray-900 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <LucideFileText className="w-6 h-6 text-brand" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notes</h1>
        </div>
        <button 
          onClick={handleCreateNote}
          className="flex items-center space-x-1 px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm"
        >
          <LucidePlus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <LucideSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <LucideFilter className="w-3 h-3" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setViewMode('all')}
          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
            viewMode === 'all' 
              ? 'bg-brand text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setViewMode('pinned')}
          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
            viewMode === 'pinned' 
              ? 'bg-brand text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Pinned
        </button>
        <button
          onClick={() => setViewMode('archived')}
          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
            viewMode === 'archived' 
              ? 'bg-brand text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Archived
        </button>
      </div>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-3 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-brand/10">
            <LucideFileText className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Notes</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{notes.length}</p>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <LucidePin className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Pinned</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{pinnedNotes.length}</p>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
            <LucideArchive className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Archived</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{archivedNotes.length}</p>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
            <LucideTag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Categories</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{categories.length}</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Notes List */}
      <div className={`p-3 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b border-brand"></div>
          </div>
        ) : currentNotes.length === 0 ? (
          <div className="text-center py-6">
            <LucideFileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {viewMode === 'pinned' ? 'No pinned notes' : 
               viewMode === 'archived' ? 'No archived notes' : 
               'No notes found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentNotes.map((note) => (
              <div 
                key={note.id} 
                className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${getNoteColorClass(note.color)} hover:shadow-md transition-shadow min-h-[140px] flex flex-col`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1 mb-1">
                      {note.isPinned && (
                        <LucidePin className="w-3 h-3 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      )}
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight">
                        {note.title}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <LucideFolder className="w-3 h-3" />
                      <span className="truncate capitalize">{note.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => handleTogglePin(note)}
                      className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        note.isPinned ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400'
                      }`}
                      title={note.isPinned ? 'Unpin note' : 'Pin note'}
                    >
                      <LucidePin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleToggleArchive(note)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"
                      title={note.isArchived ? 'Unarchive note' : 'Archive note'}
                    >
                      <LucideArchive className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-3 leading-relaxed">
                  {renderNoteContent(note.content)}
                </div>
                
                {/* Tags */}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {note.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-1.5 py-0.5 bg-brand/10 text-brand text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{note.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Footer */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleReadNote(note)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"
                      title="Read note"
                    >
                      <LucideEye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"
                      title="Edit note"
                    >
                      <LucideEdit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(note.id)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-400 hover:text-red-600"
                      title="Delete note"
                    >
                      <LucideTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(note.updatedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        note={selectedNote}
        mode={editorMode}
      />

      {/* Note Reader Modal */}
      <NoteReaderModal
        isOpen={showReader}
        onClose={() => setShowReader(false)}
        note={selectedNote}
        onEdit={handleEditFromReader}
        onDelete={handleDeleteNote}
        onTogglePin={(noteId) => {
          const note = getCurrentNotes().find(n => n.id === noteId);
          if (note) handleTogglePin(note);
        }}
        onToggleArchive={(noteId) => {
          const note = getCurrentNotes().find(n => n.id === noteId);
          if (note) handleToggleArchive(note);
        }}
        onPrevious={handlePreviousNote}
        onNext={handleNextNote}
        hasPrevious={currentNoteIndex > 0}
        hasNext={currentNoteIndex < getCurrentNotes().length - 1}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(null)}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delete Note</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this note? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteNote(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;