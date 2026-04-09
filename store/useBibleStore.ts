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
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sessions, currentSessionId, currentAiRequest, aiQueue, ...rest } = state;
        return {
          ...rest,
          // UI状态重置
          isAuthOpen: false,
          isShareOpen: false,
          isNoteOpen: false,
          isAiGenerating: false,
          isMobileSettingsOpen: false,
          isAiOpen: false,
          aiRequestTrigger: null,
          chapterSpeechText: "",
          scrollToVerse: null,
          // 同步状态重置
          isSyncing: false,
          syncError: null,
          // 保留同步配置和最后同步时间
          lastSyncTime: state.lastSyncTime,
          syncMode: state.syncMode,
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
          // [修复] AI会话状态不持久化，页面刷新后创建新会话
          // sessions 和 currentSessionId 从 API 加载，不保存到 localStorage
          currentSessionId: null,
          currentAiRequest: null,
          aiQueue: [],
        };
      },
    }
  )
);

// --------------------------------------------------
// 重新导出所有类型，确保其他组件引用的兼容性
// --------------------------------------------------
export * from './types';