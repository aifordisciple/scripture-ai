import { StateCreator } from 'zustand';
import { StoreState, SermonSlice } from '../types';

export const createSermonSlice: StateCreator<StoreState, [], [], SermonSlice> = (set) => ({
  currentSermon: null,
  setCurrentSermon: (sermon) => set({ currentSermon: sermon }),

  sermons: [],
  setSermons: (sermons) => set({ sermons }),

  sermonFolders: [],
  setSermonFolders: (folders) => set({ sermonFolders: folders }),

  activeSermonPanel: 'list',
  setActiveSermonPanel: (panel) => set({ activeSermonPanel: panel }),

  sermonSearchQuery: '',
  setSermonSearchQuery: (query) => set({ sermonSearchQuery: query }),
  sermonSelectedFolderId: null,
  setSermonSelectedFolderId: (id) => set({ sermonSelectedFolderId: id }),
  sermonSelectedTags: [],
  setSermonSelectedTags: (tags) => set({ sermonSelectedTags: tags }),

  isSermonSaving: false,
  setIsSermonSaving: (saving) => set({ isSermonSaving: saving }),

  sermonsLoading: false,
  setSermonsLoading: (loading) => set({ sermonsLoading: loading }),
});
