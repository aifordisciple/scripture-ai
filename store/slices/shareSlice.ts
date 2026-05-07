// store/slices/shareSlice.ts
// 经文卡片编辑状态 - ShareSlice

import { StateCreator } from 'zustand';
import { StoreState, ShareSlice } from '../types';
import { DEFAULT_CARD_CONFIG, GRADIENT_PRESETS, FONT_OPTIONS, type CardConfig, type LayoutMode, type QRPosition } from '@/lib/card-presets';
import { getRecommendedColorsForLayout, formatVerseRange } from '@/lib/card-presets';

export const createShareSlice: StateCreator<StoreState, [], [], ShareSlice> = (set, get) => ({
  // 卡片编辑配置
  cardConfig: DEFAULT_CARD_CONFIG,
  setCardConfig: (config) => set({ cardConfig: config }),
  updateCardConfig: (partial) => set((state) => ({
    cardConfig: { ...state.cardConfig, ...partial }
  })),

  // 生成状态
  cardGenerating: false,
  setCardGenerating: (generating) => set({ cardGenerating: generating }),
  cardResultImage: null,
  setCardResultImage: (image) => set({ cardResultImage: image }),
  cardStep: 'edit',
  setCardStep: (step) => set({ cardStep: step }),

  // AI 生成状态
  cardAiGenerating: false,
  setCardAiGenerating: (generating) => set({ cardAiGenerating: generating }),
  cardAiConfigBackup: null,  // AI 生成前的配置备份，用于撤销
  setCardAiConfigBackup: (backup) => set({ cardAiConfigBackup: backup }),

  // 模板收藏
  cardTemplates: [],
  setCardTemplates: (templates) => set({ cardTemplates: templates }),
  addCardTemplate: (template) => set((state) => ({
    cardTemplates: [...state.cardTemplates, template]
  })),
  removeCardTemplate: (id) => set((state) => ({
    cardTemplates: state.cardTemplates.filter(t => t.id !== id)
  })),

  // 生成历史
  cardHistories: [],
  setCardHistories: (histories) => set({ cardHistories: histories }),
  addCardHistory: (history) => set((state) => ({
    cardHistories: [history, ...state.cardHistories].slice(0, 50)
  })),
  clearCardHistories: () => set({ cardHistories: [] }),

  // --- 便捷操作方法 ---

  /** 初始化卡片配置（打开分享弹窗时调用） */
  initCardConfig: (book, chapter, verses) => {
    set({
      cardConfig: {
        ...DEFAULT_CARD_CONFIG,
        bookName: book,
        chapter: String(chapter),
        verseRange: formatVerseRange(verses),
      },
      cardStep: 'edit',
      cardResultImage: null,
      cardAiGenerating: false,
      cardAiConfigBackup: null,
    });
  },

  /** 切换布局模式，自动调整推荐颜色 */
  changeLayoutMode: (mode: LayoutMode) => {
    const state = get();
    const currentConfig = state.cardConfig;
    const recommended = getRecommendedColorsForLayout(mode, currentConfig.bgImage, null);

    set({
      cardConfig: {
        ...currentConfig,
        layoutMode: mode,
        textColor: recommended.textColor,
        infoColor: recommended.infoColor,
        textAlign: recommended.textAlign,
      }
    });
  },

  /** 选择背景图片（通过代理转为 Base64） */
  selectBgImage: (base64Image: string) => {
    const state = get();
    const mode = state.cardConfig.layoutMode;
    const recommended = getRecommendedColorsForLayout(mode, base64Image, null);

    set({
      cardConfig: {
        ...state.cardConfig,
        bgImage: base64Image,
        selectedBgUrl: 'proxy',
        textColor: recommended.textColor,
        infoColor: recommended.infoColor,
      }
    });
  },

  /** 选择渐变背景 */
  selectBgGradient: (gradient: string, textColor: string, infoColor: string) => {
    const state = get();
    set({
      cardConfig: {
        ...state.cardConfig,
        bgImage: null,
        selectedBgUrl: null,
        bgGradient: gradient,
        textColor,
        infoColor,
      }
    });
  },

  /** 上传本地图片 */
  uploadBgImage: (base64Image: string) => {
    const state = get();
    const mode = state.cardConfig.layoutMode;
    const recommended = getRecommendedColorsForLayout(mode, base64Image, null);

    set({
      cardConfig: {
        ...state.cardConfig,
        bgImage: base64Image,
        selectedBgUrl: 'custom',
        textColor: recommended.textColor,
        infoColor: recommended.infoColor,
      }
    });
  },

  /** 应用 AI 推荐配置 */
  applyAiConfig: (aiConfig: Partial<CardConfig>) => {
    const state = get();
    // 备份当前配置以便撤销
    set({
      cardConfig: { ...state.cardConfig, ...aiConfig },
      cardAiConfigBackup: state.cardConfig,
    });
  },

  /** 撤销 AI 推荐 */
  undoAiConfig: () => {
    const state = get();
    if (state.cardAiConfigBackup) {
      set({
        cardConfig: state.cardAiConfigBackup,
        cardAiConfigBackup: null,
      });
    }
  },

  /** 重置卡片配置到默认 */
  resetCardConfig: () => {
    set({
      cardConfig: DEFAULT_CARD_CONFIG,
      cardResultImage: null,
      cardStep: 'edit',
      cardAiConfigBackup: null,
    });
  },
});