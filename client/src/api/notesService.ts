import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get Firebase ID token
const getFirebaseIdToken = async (): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }
  return await auth.currentUser.getIdToken();
};

// Types
export interface Note {
  id: string;
  title: string;
  content: string;
  facilityId: string;
  userId: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteData {
  title: string;
  content: string;
  facilityId: string;
  userId: string;
  category?: string;
  tags?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
  color?: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
  color?: string;
}

export interface SearchParams {
  facilityId: string;
  searchTerm: string;
}

export interface FilterParams {
  facilityId: string;
  category?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const notesService = {
  // Get all notes for a facility
  async getNotes(facilityId: string): Promise<Note[]> {
    try {
      const idToken = await getFirebaseIdToken();
      
      const response = await axios.get(`${API_BASE_URL}/notes/facility/${facilityId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notes');
    }
  },

  // Get a specific note by ID
  async getNoteById(noteId: string): Promise<Note> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.get(`${API_BASE_URL}/notes/${noteId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching note:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch note');
    }
  },

  // Get notes by user
  async getNotesByUser(): Promise<Note[]> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.get(`${API_BASE_URL}/notes/user/me`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user notes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user notes');
    }
  },

  // Search notes
  async searchNotes(params: SearchParams): Promise<Note[]> {
    try {
      const idToken = await getFirebaseIdToken();
      const queryParams = new URLSearchParams({
        facilityId: params.facilityId,
        searchTerm: params.searchTerm
      });
      
      const response = await axios.get(`${API_BASE_URL}/notes/search?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error searching notes:', error);
      throw new Error(error.response?.data?.message || 'Failed to search notes');
    }
  },

  // Get notes by category
  async getNotesByCategory(params: FilterParams): Promise<Note[]> {
    try {
      const idToken = await getFirebaseIdToken();
      const queryParams = new URLSearchParams({
        facilityId: params.facilityId
      });
      if (params.category) queryParams.append('category', params.category);
      
      const response = await axios.get(`${API_BASE_URL}/notes/category?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching notes by category:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notes by category');
    }
  },

  // Get pinned notes
  async getPinnedNotes(facilityId: string): Promise<Note[]> {
    try {
      const idToken = await getFirebaseIdToken();
      const params = new URLSearchParams({ facilityId });
      
      const response = await axios.get(`${API_BASE_URL}/notes/pinned?${params}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching pinned notes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch pinned notes');
    }
  },

  // Get archived notes
  async getArchivedNotes(facilityId: string): Promise<Note[]> {
    try {
      const idToken = await getFirebaseIdToken();
      const params = new URLSearchParams({ facilityId });
      
      const response = await axios.get(`${API_BASE_URL}/notes/archived?${params}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching archived notes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch archived notes');
    }
  },

  // Get categories
  async getCategories(facilityId: string): Promise<string[]> {
    try {
      const idToken = await getFirebaseIdToken();
      const params = new URLSearchParams({ facilityId });
      
      const response = await axios.get(`${API_BASE_URL}/notes/categories?${params}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  },

  // Get tags
  async getTags(facilityId: string): Promise<string[]> {
    try {
      const idToken = await getFirebaseIdToken();
      const params = new URLSearchParams({ facilityId });
      
      const response = await axios.get(`${API_BASE_URL}/notes/tags?${params}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch tags');
    }
  },

  // Create a new note
  async createNote(noteData: CreateNoteData): Promise<Note> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.post(`${API_BASE_URL}/notes`, noteData, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating note:', error);
      throw new Error(error.response?.data?.message || 'Failed to create note');
    }
  },

  // Update a note
  async updateNote(noteId: string, updateData: UpdateNoteData): Promise<Note> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.put(`${API_BASE_URL}/notes/${noteId}`, updateData, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating note:', error);
      throw new Error(error.response?.data?.message || 'Failed to update note');
    }
  },

  // Toggle pin status
  async togglePin(noteId: string, isPinned: boolean): Promise<Note> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.put(`${API_BASE_URL}/notes/${noteId}/pin`, { isPinned }, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error toggling pin status:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle pin status');
    }
  },

  // Toggle archive status
  async toggleArchive(noteId: string, isArchived: boolean): Promise<Note> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.put(`${API_BASE_URL}/notes/${noteId}/archive`, { isArchived }, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error toggling archive status:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle archive status');
    }
  },

  // Delete a note
  async deleteNote(noteId: string): Promise<void> {
    try {
      const idToken = await getFirebaseIdToken();
      await axios.delete(`${API_BASE_URL}/notes/${noteId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      console.error('Error deleting note:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete note');
    }
  }
};
