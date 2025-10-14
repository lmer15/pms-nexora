import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notesService, Note, CreateNoteData, UpdateNoteData, SearchParams, FilterParams } from '../api/notesService';
import { useAuth } from './AuthContext';

interface NotesContextType {
  notes: Note[];
  pinnedNotes: Note[];
  archivedNotes: Note[];
  categories: string[];
  tags: string[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedCategory: string | null;
  selectedTags: string[];
  viewMode: 'all' | 'pinned' | 'archived' | 'category' | 'search';
  
  // Actions
  loadNotes: () => Promise<void>;
  loadPinnedNotes: () => Promise<void>;
  loadArchivedNotes: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadTags: () => Promise<void>;
  searchNotes: (searchTerm: string) => Promise<void>;
  filterByCategory: (category: string | null) => Promise<void>;
  filterByTags: (tags: string[]) => Promise<void>;
  createNote: (noteData: CreateNoteData) => Promise<Note>;
  updateNote: (noteId: string, updateData: UpdateNoteData) => Promise<Note>;
  deleteNote: (noteId: string) => Promise<void>;
  togglePin: (noteId: string, isPinned: boolean) => Promise<void>;
  toggleArchive: (noteId: string, isArchived: boolean) => Promise<void>;
  setViewMode: (mode: 'all' | 'pinned' | 'archived' | 'category' | 'search') => void;
  clearFilters: () => void;
  refreshNotes: () => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

interface NotesProviderProps {
  children: ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  
  // State
  const [notes, setNotes] = useState<Note[]>([]);
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([]);
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'pinned' | 'archived' | 'category' | 'search'>('all');

  // Load notes when user changes (independent of facility)
  useEffect(() => {
    if (user && token) {
      loadNotes();
      loadPinnedNotes();
      loadArchivedNotes();
      loadCategories();
      loadTags();
    }
  }, [user, token]);

  const loadNotes = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const notesData = await notesService.getNotes('personal');
      setNotes(notesData);
    } catch (err: any) {
      console.error('Error loading notes:', err);
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const loadPinnedNotes = async () => {
    if (!user) return;
    
    try {
      const pinnedData = await notesService.getPinnedNotes('personal');
      setPinnedNotes(pinnedData);
    } catch (err: any) {
      console.error('Error loading pinned notes:', err);
    }
  };

  const loadArchivedNotes = async () => {
    if (!user) return;
    
    try {
      const archivedData = await notesService.getArchivedNotes('personal');
      setArchivedNotes(archivedData);
    } catch (err: any) {
      console.error('Error loading archived notes:', err);
    }
  };

  const loadCategories = async () => {
    if (!user) return;
    
    try {
      const categoriesData = await notesService.getCategories('personal');
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Error loading categories:', err);
    }
  };

  const loadTags = async () => {
    if (!user) return;
    
    try {
      const tagsData = await notesService.getTags('personal');
      setTags(tagsData);
    } catch (err: any) {
      console.error('Error loading tags:', err);
    }
  };

  const searchNotes = async (term: string) => {
    if (!user) return;
    
    setSearchTerm(term);
    setLoading(true);
    setError(null);
    
    try {
      if (term.trim()) {
        const searchResults = await notesService.searchNotes({
          facilityId: 'personal',
          searchTerm: term
        });
        setNotes(searchResults);
        setViewMode('search');
      } else {
        await loadNotes();
        setViewMode('all');
      }
    } catch (err: any) {
      console.error('Error searching notes:', err);
      setError(err.message || 'Failed to search notes');
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = async (category: string | null) => {
    if (!user) return;
    
    setSelectedCategory(category);
    setLoading(true);
    setError(null);
    
    try {
      if (category) {
        const categoryNotes = await notesService.getNotesByCategory({
          facilityId: 'personal',
          category
        });
        setNotes(categoryNotes);
        setViewMode('category');
      } else {
        await loadNotes();
        setViewMode('all');
      }
    } catch (err: any) {
      console.error('Error filtering by category:', err);
      setError(err.message || 'Failed to filter by category');
    } finally {
      setLoading(false);
    }
  };

  const filterByTags = async (tags: string[]) => {
    setSelectedTags(tags);
    // For now, we'll filter client-side since the backend doesn't have a specific tags filter
    // In a real implementation, you might want to add a backend endpoint for tag filtering
    if (tags.length > 0) {
      const filteredNotes = notes.filter(note => 
        tags.some(tag => note.tags.includes(tag))
      );
      setNotes(filteredNotes);
    } else {
      await loadNotes();
    }
  };

  const createNote = async (noteData: CreateNoteData): Promise<Note> => {
    if (!user) {
      throw new Error('No user selected');
    }
    
    try {
      const newNote = await notesService.createNote({
        ...noteData,
        facilityId: 'personal'
      });
      
      // Add to local state
      setNotes(prev => [newNote, ...prev]);
      
      // Update categories and tags if new ones were added
      if (noteData.category && !categories.includes(noteData.category)) {
        setCategories(prev => [...prev, noteData.category!].sort());
      }
      
      if (noteData.tags) {
        const newTags = noteData.tags.filter(tag => !tags.includes(tag));
        if (newTags.length > 0) {
          setTags(prev => [...prev, ...newTags].sort());
        }
      }
      
      return newNote;
    } catch (err: any) {
      console.error('Error creating note:', err);
      throw err;
    }
  };

  const updateNote = async (noteId: string, updateData: UpdateNoteData): Promise<Note> => {
    try {
      const updatedNote = await notesService.updateNote(noteId, updateData);
      
      // Update local state
      setNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note));
      setPinnedNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note));
      setArchivedNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note));
      
      // Update categories and tags if new ones were added
      if (updateData.category && !categories.includes(updateData.category)) {
        setCategories(prev => [...prev, updateData.category!].sort());
      }
      
      if (updateData.tags) {
        const newTags = updateData.tags.filter(tag => !tags.includes(tag));
        if (newTags.length > 0) {
          setTags(prev => [...prev, ...newTags].sort());
        }
      }
      
      return updatedNote;
    } catch (err: any) {
      console.error('Error updating note:', err);
      throw err;
    }
  };

  const deleteNote = async (noteId: string): Promise<void> => {
    try {
      await notesService.deleteNote(noteId);
      
      // Remove from local state
      setNotes(prev => prev.filter(note => note.id !== noteId));
      setPinnedNotes(prev => prev.filter(note => note.id !== noteId));
      setArchivedNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (err: any) {
      console.error('Error deleting note:', err);
      throw err;
    }
  };

  const togglePin = async (noteId: string, isPinned: boolean): Promise<void> => {
    try {
      const updatedNote = await notesService.togglePin(noteId, isPinned);
      
      if (isPinned) {
        // Pin the note - remove from main notes and add to pinned
        setNotes(prev => prev.filter(note => note.id !== noteId));
        setPinnedNotes(prev => [updatedNote, ...prev]);
      } else {
        // Unpin the note - remove from pinned and add back to main notes
        setPinnedNotes(prev => prev.filter(note => note.id !== noteId));
        setNotes(prev => [updatedNote, ...prev]);
      }
    } catch (err: any) {
      console.error('Error toggling pin:', err);
      throw err;
    }
  };

  const toggleArchive = async (noteId: string, isArchived: boolean): Promise<void> => {
    try {
      const updatedNote = await notesService.toggleArchive(noteId, isArchived);
      
      if (isArchived) {
        // Archive the note - remove from all lists and add to archived
        setNotes(prev => prev.filter(note => note.id !== noteId));
        setPinnedNotes(prev => prev.filter(note => note.id !== noteId));
        setArchivedNotes(prev => [updatedNote, ...prev]);
      } else {
        // Unarchive the note - remove from archived and add to appropriate list
        setArchivedNotes(prev => prev.filter(note => note.id !== noteId));
        
        // Add back to appropriate list based on pin status
        if (updatedNote.isPinned) {
          setPinnedNotes(prev => [updatedNote, ...prev]);
        } else {
          setNotes(prev => [updatedNote, ...prev]);
        }
      }
    } catch (err: any) {
      console.error('Error toggling archive:', err);
      throw err;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedTags([]);
    setViewMode('all');
    loadNotes();
  };

  const refreshNotes = async () => {
    await Promise.all([
      loadNotes(),
      loadPinnedNotes(),
      loadArchivedNotes(),
      loadCategories(),
      loadTags()
    ]);
  };

  const value: NotesContextType = {
    notes,
    pinnedNotes,
    archivedNotes,
    categories,
    tags,
    loading,
    error,
    searchTerm,
    selectedCategory,
    selectedTags,
    viewMode,
    loadNotes,
    loadPinnedNotes,
    loadArchivedNotes,
    loadCategories,
    loadTags,
    searchNotes,
    filterByCategory,
    filterByTags,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    setViewMode,
    clearFilters,
    refreshNotes
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
