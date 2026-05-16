'use client';

import { create } from 'zustand';
import { notesAPI } from '@/lib/api';

/**
 * Notes state store with optimistic updates
 */
const useNotesStore = create((set, get) => ({
  notes: [],
  currentNote: null,
  tags: [],
  isLoading: false,
  isSaving: false,
  error: null,

  // Search & filter state
  searchQuery: '',
  selectedTags: [],
  sortBy: 'updated',
  showArchived: false,

  /**
   * Fetch all notes with current filters
   */
  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const { searchQuery, selectedTags, sortBy, showArchived } = get();
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedTags.length > 0) params.tags = selectedTags.join(',');
      if (sortBy) params.sort = sortBy;
      if (showArchived) params.archived = 'true';

      const res = await notesAPI.getAll(params);
      set({ notes: res.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to fetch notes', isLoading: false });
    }
  },

  /**
   * Fetch a single note by ID
   */
  fetchNote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await notesAPI.getById(id);
      set({ currentNote: res.data, isLoading: false });
      return res.data;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to fetch note', isLoading: false });
      throw error;
    }
  },

  /**
   * Create a new note
   */
  createNote: async (data = {}) => {
    try {
      const res = await notesAPI.create(data);
      set((state) => ({ notes: [res.data, ...state.notes] }));
      return res.data;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to create note' });
      throw error;
    }
  },

  /**
   * Update a note (optimistic update for auto-save)
   */
  updateNote: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      currentNote: state.currentNote?.id === id
        ? { ...state.currentNote, ...updates }
        : state.currentNote,
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      ),
      isSaving: true,
    }));

    try {
      const res = await notesAPI.update(id, updates);
      set((state) => ({
        currentNote: state.currentNote?.id === id ? res.data : state.currentNote,
        isSaving: false,
      }));
      return res.data;
    } catch (error) {
      // Rollback on failure — refetch
      set({ isSaving: false });
      get().fetchNote(id);
      throw error;
    }
  },

  /**
   * Delete a note (optimistic)
   */
  deleteNote: async (id) => {
    const previousNotes = get().notes;
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    }));

    try {
      await notesAPI.delete(id);
    } catch (error) {
      // Rollback
      set({ notes: previousNotes });
      throw error;
    }
  },

  /**
   * Toggle archive status (optimistic)
   */
  toggleArchive: async (id) => {
    try {
      const res = await notesAPI.toggleArchive(id);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        currentNote: state.currentNote?.id === id ? res.data : state.currentNote,
      }));
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Generate AI summary
   */
  generateSummary: async (id) => {
    try {
      const res = await notesAPI.generateSummary(id);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toggle share link
   */
  toggleShare: async (id) => {
    try {
      const res = await notesAPI.toggleShare(id);
      set((state) => ({
        currentNote: state.currentNote?.id === id ? res.data : state.currentNote,
        notes: state.notes.map((n) => (n.id === id ? res.data : n)),
      }));
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch user tags
   */
  fetchTags: async () => {
    try {
      const res = await notesAPI.getTags();
      set({ tags: res.data });
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  },

  // Filter setters
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setShowArchived: (show) => set({ showArchived: show }),
  setCurrentNote: (note) => set({ currentNote: note }),
}));

export default useNotesStore;
