import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBibleStore } from '../useBibleStore'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock fetch
global.fetch = vi.fn(() => Promise.resolve({ ok: true })) as any

describe('useBibleStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('UISlice', () => {
    it('toggles sidebar', () => {
      const { toggleSidebar } = useBibleStore.getState()

      toggleSidebar()
      expect(useBibleStore.getState().isSidebarOpen).toBe(true)

      toggleSidebar()
      expect(useBibleStore.getState().isSidebarOpen).toBe(false)

      toggleSidebar(true)
      expect(useBibleStore.getState().isSidebarOpen).toBe(true)
    })

    it('manages auth modal', () => {
      const { setAuthOpen } = useBibleStore.getState()

      setAuthOpen(true)
      expect(useBibleStore.getState().isAuthOpen).toBe(true)

      setAuthOpen(false)
      expect(useBibleStore.getState().isAuthOpen).toBe(false)
    })

    it('manages sidebar width', () => {
      const { setSidebarWidth } = useBibleStore.getState()

      setSidebarWidth(600)
      expect(useBibleStore.getState().sidebarWidth).toBe(600)
    })
  })

  describe('ReaderSlice', () => {
    it('manages font size', () => {
      const { setFontSize } = useBibleStore.getState()

      setFontSize(24)
      expect(useBibleStore.getState().fontSize).toBe(24)
    })

    it('manages dark mode', () => {
      const { toggleDarkMode } = useBibleStore.getState()

      const initialDarkMode = useBibleStore.getState().isDarkMode
      toggleDarkMode()
      expect(useBibleStore.getState().isDarkMode).toBe(!initialDarkMode)
    })

    it('manages line height', () => {
      const { setLineHeight } = useBibleStore.getState()

      setLineHeight(2.0)
      expect(useBibleStore.getState().lineHeight).toBe(2.0)
    })

    it('manages showDualVersion', () => {
      const { toggleDualVersion } = useBibleStore.getState()

      const initial = useBibleStore.getState().showDualVersion
      toggleDualVersion()
      expect(useBibleStore.getState().showDualVersion).toBe(!initial)
    })
  })

  describe('AISlice', () => {
    it('manages AI sidebar state', () => {
      const { setAiOpen } = useBibleStore.getState()

      setAiOpen(true)
      expect(useBibleStore.getState().isAiOpen).toBe(true)

      setAiOpen(false)
      expect(useBibleStore.getState().isAiOpen).toBe(false)
    })

    it('manages AI mode', () => {
      const { setAiMode } = useBibleStore.getState()

      setAiMode('tutor')
      expect(useBibleStore.getState().aiMode).toBe('tutor')

      setAiMode('sermon')
      expect(useBibleStore.getState().aiMode).toBe('sermon')
    })

    it('manages AI generating state', () => {
      const { setAiGenerating } = useBibleStore.getState()

      setAiGenerating(true)
      expect(useBibleStore.getState().isAiGenerating).toBe(true)
    })
  })

  describe('SyncSlice', () => {
    it('manages sync state', () => {
      const { setIsSyncing, setSyncError } = useBibleStore.getState()

      setIsSyncing(true)
      expect(useBibleStore.getState().isSyncing).toBe(true)

      setSyncError('Test error')
      expect(useBibleStore.getState().syncError).toBe('Test error')
    })
  })

  describe('GroupSlice', () => {
    it('manages group plan context', () => {
      const { setGroupPlanContext } = useBibleStore.getState()

      const context = {
        churchId: 'church-1',
        planId: 'plan-1',
        day: 1,
        stepIndex: 0,
        steps: [],
      }

      setGroupPlanContext(context)
      expect(useBibleStore.getState().groupPlanContext).toEqual(context)

      setGroupPlanContext(null)
      expect(useBibleStore.getState().groupPlanContext).toBeNull()
    })
  })

  describe('AtlasSlice', () => {
    it('manages atlas panel state', () => {
      const { setAtlasPanelOpen, setSelectedLocationId } = useBibleStore.getState()

      setAtlasPanelOpen(true)
      expect(useBibleStore.getState().isAtlasPanelOpen).toBe(true)

      setSelectedLocationId('loc-1')
      expect(useBibleStore.getState().selectedLocationId).toBe('loc-1')
    })
  })

  describe('DMSlice', () => {
    it('manages DM panel state', () => {
      const { setDmPanelOpen } = useBibleStore.getState()

      setDmPanelOpen(true)
      expect(useBibleStore.getState().isDmPanelOpen).toBe(true)
    })
  })
})