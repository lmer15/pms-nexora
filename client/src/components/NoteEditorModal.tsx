import React, { useState, useEffect } from 'react';
import { 
  LucideX, 
  LucideSave, 
  LucidePin, 
  LucideArchive, 
  LucideTag, 
  LucideFolder,
  LucidePalette,
  LucidePlus,
  LucideTrash2
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { useNotes } from '../context/NotesContext';
import { Note, CreateNoteData, UpdateNoteData } from '../api/notesService';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  note?: Note | null;
  mode: 'create' | 'edit';
}

  const NOTE_COLORS = [
    { name: 'default', label: 'Default', class: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' },
    { name: 'yellow', label: 'Yellow', class: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 border-amber-200 dark:border-amber-700' },
    { name: 'green', label: 'Green', class: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 border-emerald-200 dark:border-emerald-700' },
    { name: 'blue', label: 'Blue', class: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700' },
    { name: 'purple', label: 'Purple', class: 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900 dark:to-violet-800 border-violet-200 dark:border-violet-700' },
    { name: 'pink', label: 'Pink', class: 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900 dark:to-rose-800 border-rose-200 dark:border-rose-700' },
    { name: 'red', label: 'Red', class: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 border-red-200 dark:border-red-700' },
    { name: 'orange', label: 'Orange', class: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700' }
  ];


const COMMON_CATEGORIES = [
  'general',
  'project',
  'idea',
  'todo',
  'reference',
  'personal',
  'work'
];

const NoteEditorModal: React.FC<NoteEditorModalProps> = ({ isOpen, onClose, note, mode }) => {
  const { createNote, updateNote, deleteNote, categories, tags } = useNotes();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [] as string[],
    isPinned: false,
    isArchived: false,
    color: 'default'
  });
  
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  

  // Initialize form data
  useEffect(() => {
    if (mode === 'edit' && note) {
      setFormData({
        title: note.title,
        content: note.content,
        category: note.category,
        tags: note.tags,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        color: note.color
      });
    } else {
      setFormData({
        title: '',
        content: '',
        category: 'general',
        tags: [],
        isPinned: false,
        isArchived: false,
        color: 'default'
      });
    }
    setError(null);
    setShowDeleteConfirm(false);
  }, [isOpen, note, mode]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        category: newCategory.trim()
      }));
      setNewCategory('');
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'create') {
        const noteData: CreateNoteData = {
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category,
          tags: formData.tags,
          isPinned: formData.isPinned,
          isArchived: formData.isArchived,
          color: formData.color,
          facilityId: 'personal', // Independent notes don't need facility
          userId: '' // Will be set by the context
        };
        await createNote(noteData);
      } else if (note) {
        const updateData: UpdateNoteData = {
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category,
          tags: formData.tags,
          isPinned: formData.isPinned,
          isArchived: formData.isArchived,
          color: formData.color
        };
        await updateNote(note.id, updateData);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;

    setLoading(true);
    setError(null);

    try {
      await deleteNote(note.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedColorClass = NOTE_COLORS.find(c => c.name === formData.color)?.class || 'bg-white dark:bg-gray-800';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] ${selectedColorClass} rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {mode === 'create' ? 'Create New Note' : 'Edit Note'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
          >
            <LucideX className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:ring-brand focus:border-brand placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter note title..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              Content
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              <RichTextEditor
                value={formData.content}
                onChange={(value) => handleInputChange('content', value)}
                placeholder="Write your note content here..."
                style={{
                  backgroundColor: 'transparent',
                  minHeight: '200px'
                }}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              Category
            </label>
            <div className="flex space-x-2">
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:ring-brand focus:border-brand"
              >
                {[...COMMON_CATEGORIES, ...categories].filter((cat, index, arr) => arr.indexOf(cat) === index).map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category"
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:ring-brand focus:border-brand placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                onClick={handleAddCategory}
                className="px-3 py-2 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors"
              >
                <LucidePlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              Tags
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add a tag"
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:ring-brand focus:border-brand placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-2 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors"
              >
                <LucidePlus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 bg-brand/10 text-brand text-xs rounded-md"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-brand-dark"
                  >
                    <LucideX className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {NOTE_COLORS.map(color => (
                <button
                  key={color.name}
                  onClick={() => handleInputChange('color', color.name)}
                  className={`w-8 h-8 rounded-md border-2 ${
                    formData.color === color.name 
                      ? 'border-gray-900 dark:border-white' 
                      : 'border-gray-300 dark:border-gray-600'
                  } ${color.class}`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPinned}
                onChange={(e) => handleInputChange('isPinned', e.target.checked)}
                className="rounded border-gray-300 text-brand focus:ring-brand"
              />
              <span className="text-sm text-gray-800 dark:text-gray-200">Pin note</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isArchived}
                onChange={(e) => handleInputChange('isArchived', e.target.checked)}
                className="rounded border-gray-300 text-brand focus:ring-brand"
              />
              <span className="text-sm text-gray-800 dark:text-gray-200">Archive note</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            {mode === 'edit' && note && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                <LucideTrash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !formData.title.trim()}
              className="flex items-center space-x-1 px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <LucideSave className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Note
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditorModal;
