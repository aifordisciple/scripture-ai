// store/slices/uiSlice.ts
import { StateCreator } from 'zustand'
import { StoreState, UISlice } from '../types'

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set, get) => ({
  isAuthOpen: false,
  setAuthOpen: (open) => set({ isAuthOpen: open }),

  isSidebarOpen: false,
  toggleSidebar: (open) => set((state) => ({
    isSidebarOpen: open !== undefined ? open : !state.isSidebarOpen
  })),

  isDesktopSidebarOpen: false,
  toggleDesktopSidebar: () => set((state) => ({
    isDesktopSidebarOpen: !state.isDesktopSidebarOpen
  })),

  sidebarWidth: 480,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  isMobileSettingsOpen: false,
  setMobileSettingsOpen: (open) => set({ isMobileSettingsOpen: open }),

  isShareOpen: false,
  shareData: null,
  openShareModal: (book, chapter, verses) => set({
    isShareOpen: true,
    shareData: { book, chapter, verses }
  }),
  closeShareModal: () => set({ isShareOpen: false, shareData: null }),

  isDashboardOpen: false,
  setDashboardOpen: (open) => set({ isDashboardOpen: open }),

  viewingPlanId: null,
  setViewingPlanId: (id) => set({ viewingPlanId: id }),

  onboarding: {
    welcome: { completed: false, shown: false },
    reading: { completed: false, shown: false },
    ai: { completed: false, shown: false },
    plan: { completed: false, shown: false },
    group: { completed: false, shown: false },
  },

  initOnboarding: (status) => set((state) => ({
    onboarding: { ...state.onboarding, ...status }
  })),

  startOnboarding: (type) => set((state) => ({
    onboarding: {
      ...state.onboarding,
      [type]: { ...state.onboarding[type], shown: true }
    }
  })),

  completeOnboarding: (type) => {
    const newStatus = { ...get().onboarding[type], completed: true, shown: true }
    set((state) => ({
      onboarding: { ...state.onboarding, [type]: newStatus }
    }))
    if (typeof window !== 'undefined') {
      fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, completed: true })
      }).catch(() => {})
    }
  },

  skipOnboarding: (type) => {
    const newStatus = { ...get().onboarding[type], completed: true, shown: true }
    set((state) => ({
      onboarding: { ...state.onboarding, [type]: newStatus }
    }))
    if (typeof window !== 'undefined') {
      fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, completed: true, skipped: true })
      }).catch(() => {})
    }
  },

  resetOnboarding: (type) => set((state) => {
    if (type) {
      return {
        onboarding: {
          ...state.onboarding,
          [type]: { completed: false, shown: false }
        }
      }
    }
    return {
      onboarding: {
        welcome: { completed: false, shown: false },
        reading: { completed: false, shown: false },
        ai: { completed: false, shown: false },
        plan: { completed: false, shown: false },
        group: { completed: false, shown: false },
      }
    }
  }),
})