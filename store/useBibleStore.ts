// store/useBibleStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StoreState } from './types';
import {
  createUISlice,
  createReaderSlice,
  createAISlice,
  createUserDataSlice,
  createSyncSlice,
  createGroupSlice,
  createAtlasSlice,
  createDMSlice
} from './slices';

// --------------------------------------------------
// 组合主 Store
// --------------------------------------------------
export const useBibleStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createUISlice(...a),
      ...createReaderSlice(...a),
      ...createAISlice(...a),
      ...createUserDataSlice(...a),
      ...createSyncSlice(...a),
      ...createGroupSlice(...a),
      ...createAtlasSlice(...a),
      ...createDMSlice(...a),
    }),
    {
      name: 'bible-storage',
      storage: createJSONStorage(() => localStorage),
      // 控制哪些状态不要保存到 localStorage 中
      partialize: (state) => ({
        ...state,
        isAuthOpen: false,
        isShareOpen: false,
        isNoteOpen: false,
        isAiGenerating: false,
        isMobileSettingsOpen: false,
        isAiOpen: false,
        aiRequestTrigger: null,
        chapterSpeechText: "",
        scrollToVerse: null,
        isSyncing: false,
        syncError: null,
        groupPlanContext: null, // 不持久化小组计划上下文
        // Atlas 状态不持久化
        selectedLocationId: null,
        selectedLocation: null,
        isAtlasPanelOpen: false,
        locationSearchResults: [],
        atlasVerseContext: null,
        viewingLocationVerses: null,
        // DM 状态不持久化
        isDmPanelOpen: false,
        dmConversations: [],
        activeDmUserId: null,
        dmMessages: [],
        dmUnreadCount: 0,
      }),
    }
  )
);

// --------------------------------------------------
// 重新导出所有类型，确保其他组件引用的兼容性
// --------------------------------------------------
export * from './types';