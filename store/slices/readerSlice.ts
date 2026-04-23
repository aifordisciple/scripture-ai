// store/slices/readerSlice.ts
import { StateCreator } from 'zustand'
import { StoreState, ReaderSlice, Tab } from '../types'

export const createReaderSlice: StateCreator<StoreState, [], [], ReaderSlice> = (set) => ({
  fontSize: 18,
  setFontSize: (size) => set({ fontSize: size }),

  lineHeight: 1.8,
  setLineHeight: (height) => set({ lineHeight: height }),

  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  showDualVersion: false,
  toggleDualVersion: () => set((state) => ({ showDualVersion: !state.showDualVersion })),

  tabs: [{ id: 'tab-1', type: 'read', book: 'Gen', chapter: '1' }],
  activeTabId: 'tab-1',

  addTab: ({ type, book = 'Gen', chapter = '1', query, searchMode, crossRefSource }) =>
    set((state) => {
      const newId = `tab-${Date.now()}`
      const newTab: Tab = { id: newId, type }

      if (type === 'read') {
        newTab.book = book
        newTab.chapter = chapter
      } else if (type === 'search') {
        newTab.query = query
        newTab.searchMode = searchMode
      } else if (type === 'cross-ref' && crossRefSource) {
        newTab.crossRefSource = crossRefSource
      } else if (type === 'atlas') {
        newTab.atlasData = {}
      } else if (type === 'theme-graph') {
        newTab.themeGraphData = {}
      }

      return { tabs: [...state.tabs, newTab], activeTabId: newId }
    }),

  closeTab: (id) =>
    set((state) => {
      if (state.tabs.length <= 1) return state
      const newTabs = state.tabs.filter((t) => t.id !== id)
      let newActiveId = state.activeTabId
      if (id === state.activeTabId) {
        newActiveId = newTabs[newTabs.length - 1].id
      }
      return { tabs: newTabs, activeTabId: newActiveId }
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateActiveTab: (data) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === state.activeTabId ? { ...t, ...data } : t
      ),
    })),

  chapterSpeechText: '',
  setChapterSpeechText: (text) => set({ chapterSpeechText: text }),

  scrollToVerse: null,
  setScrollToVerse: (verse) => set({ scrollToVerse: verse }),
})