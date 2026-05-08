import { StateCreator } from 'zustand';
import { StoreState, SermonSlice, OutlineSection, OutlineChangeStrategy } from '../types';
import { detectFlowStage, getStageSuggestions } from '@/lib/sermon-flow';

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
  sermonAiLoading: false,
  setSermonAiLoading: (loading) => set({ sermonAiLoading: loading }),
  sermonAiError: null,
  setSermonAiError: (error) => set({ sermonAiError: error }),
  sermonAiActionLoading: false,
  setSermonAiActionLoading: (loading) => set({ sermonAiActionLoading: loading }),
  sermonReviewData: null,
  setSermonReviewData: (data) => set({ sermonReviewData: data }),
  sermonReviewLoading: false,
  setSermonReviewLoading: (loading) => set({ sermonReviewLoading: loading }),
  sermonInitialVerseRefs: '',
  setSermonInitialVerseRefs: (refs) => set({ sermonInitialVerseRefs: refs }),
  sermonAutoSave: true,
  setSermonAutoSave: (enabled) => set({ sermonAutoSave: enabled }),
  sermonAiPreference: 'casual',
  setSermonAiPreference: (pref) => set({ sermonAiPreference: pref }),
  sermonMobileView: 'list',
  setSermonMobileView: (view) => set({ sermonMobileView: view }),
  sermonFlowStage: 'verse-study',
  setSermonFlowStage: (stage) => set({ sermonFlowStage: stage }),
  sermonAiSuggestions: [],
  setSermonAiSuggestions: (suggestions) => set({ sermonAiSuggestions: suggestions }),
  sermonGhostText: '',
  setSermonGhostText: (text) => set({ sermonGhostText: text }),
  sermonGhostTextVisible: false,
  setSermonGhostTextVisible: (visible) => set({ sermonGhostTextVisible: visible }),
});

/** Update flow stage based on sermon content changes */
export function updateSermonFlowStage(content: string, wordCount: number): Partial<SermonSlice> {
  const stage = detectFlowStage(content, wordCount)
  const suggestions = getStageSuggestions(stage)
  return {
    sermonFlowStage: stage,
    sermonAiSuggestions: suggestions,
  }
}