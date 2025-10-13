import React from 'react';
import { 
  LucideX, 
  LucideEdit, 
  LucidePin, 
  LucideArchive, 
  LucideTag, 
  LucideFolder,
  LucideChevronLeft,
  LucideChevronRight,
  LucideCalendar,
  LucideUser,
  LucideTrash2
} from 'lucide-react';
import { Note } from '../api/notesService';

interface NoteReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

const NoteReaderModal: React.FC<NoteReaderModalProps> = ({
  isOpen,
  onClose,
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false
}) => {
  if (!isOpen || !note) return null;

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Function to render rich text content safely
  const renderNoteContent = (content: string) => {
    if (!content) return '';
    
    // If content contains HTML tags (from rich text editor), render as HTML
    if (content.includes('<') && content.includes('>')) {
      return (
        <div 
          className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    
    // For plain text, detect and make links clickable
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(linkRegex);
    
    return (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        {parts.map((part, index) => {
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
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`relative w-full max-w-4xl mx-auto ${getColorClass(note.color)} rounded-lg shadow-xl border border-gray-200 dark:border-gray-700`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={onPrevious}
                  disabled={!hasPrevious}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous note"
                >
                  <LucideChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={onNext}
                  disabled={!hasNext}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next note"
                >
                  <LucideChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {/* Note title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {note.title}
              </h1>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onTogglePin(note.id)}
                className={`p-2 rounded-md transition-colors ${
                  note.isPinned 
                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
                title={note.isPinned ? 'Unpin note' : 'Pin note'}
              >
                <LucidePin className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => onEdit(note)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                title="Edit note"
              >
                <LucideEdit className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => onToggleArchive(note.id)}
                className={`p-2 rounded-md transition-colors ${
                  note.isArchived 
                    ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
                title={note.isArchived ? 'Unarchive note' : 'Archive note'}
              >
                <LucideArchive className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => onDelete(note.id)}
                className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 transition-colors"
                title="Delete note"
              >
                <LucideTrash2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                title="Close"
              >
                <LucideX className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <LucideCalendar className="w-4 h-4" />
                <span>Created: {formatDate(note.createdAt)}</span>
              </div>
              
              {note.updatedAt && note.updatedAt !== note.createdAt && (
                <div className="flex items-center space-x-1">
                  <LucideCalendar className="w-4 h-4" />
                  <span>Updated: {formatDate(note.updatedAt)}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <LucideFolder className="w-4 h-4" />
                <span className="capitalize">{note.category}</span>
              </div>
              
              {note.tags.length > 0 && (
                <div className="flex items-center space-x-1">
                  <LucideTag className="w-4 h-4" />
                  <span>{note.tags.length} tag{note.tags.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            
            {/* Tags */}
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {note.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Note content */}
            <div className="min-h-[400px]">
              {renderNoteContent(note.content)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteReaderModal;
