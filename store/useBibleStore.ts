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
  createDMSlice,
  createLocaleSlice,
  createSermonSlice
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
      ...createLocaleSlice(...a),
      ...createSermonSlice(...a),
    }),
    {
      name: 'bible-storage',
      storage: createJSONStorage(() => {
        // 包装 localStorage，处理 quota exceeded 错误
        return {
          getItem: (name: string) => {
            try {
              return localStorage.getItem(name);
            } catch {
              return null;
            }
          },
          setItem: (name: string, value: string) => {
            try {
              localStorage.setItem(name, value);
            } catch {
              // [P2-16修复] localStorage 配额超出时，尝试释放空间后重试
              console.warn('[Store] localStorage quota exceeded, attempting cleanup');
              try {
                // 清理其他 bible 相关的旧存储键来释放空间
                const keysToRemove: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && key !== name && (key.startsWith('bible-') || key.startsWith('zustand-'))) {
                    keysToRemove.push(key);
                  }
                }
                for (const key of keysToRemove) {
                  localStorage.removeItem(key);
                }
                localStorage.setItem(name, value);
              } catch {
                console.error('[Store] Failed to write to localStorage even after cleanup');
              }
            }
          },
          removeItem: (name: string) => {
            try {
              localStorage.removeItem(name);
            } catch {
              // ignore
            }
          },
        };
      }),
      // 控制哪些状态不要保存到 localStorage 中
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sessions, currentSessionId, currentAiRequest, aiQueue, ...rest } = state;
        // 安全：apiKey 不持久化到 localStorage，仅保存 hasApiKey 标志
        const safeApiConfig = { ...rest.apiConfig, apiKey: '' };
        return {
          ...rest,
          apiConfig: safeApiConfig,
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
          sessionStatus: 'idle',
          sessionError: null,
          // Sermon 状态不持久化
          currentSermon: null,
          sermons: [],
          sermonFolders: [],
          isSermonSaving: false,
          sermonsLoading: false,
        };
      },
    }
  )
);

// --------------------------------------------------
// 重新导出所有类型，确保其他组件引用的兼容性
// --------------------------------------------------
export * from './types';