import { StateCreator } from 'zustand';
import { StoreState, SermonSlice, OutlineSection, OutlineChangeStrategy, SectionVersion, SectionVersionSource, VoiceProfile, TheologyResource, ToneMetrics, SermonComment, SermonSeries } from '../types';
import { detectFlowStage, getStageSuggestions } from '@/lib/sermon-flow';

function sectionId(title: string, index: number): string {
  return `section-${index}-${title.replace(/\s+/g, '-').slice(0, 20)}`;
}

function markdownToSections(markdown: string): OutlineSection[] {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const sections: OutlineSection[] = [];
  let currentTitle = '';
  let currentContent: string[] = [];
  let sectionIndex = 0;
  const flush = () => {
    if (currentTitle) {
      const content = currentContent.join('\n').trim();
      const keyPoints = content
        .split('\n')
        .filter(l => l.trim().startsWith('- ') || l.trim().startsWith('* ') || l.trim().startsWith('• '))
        .map(l => l.replace(/^[\s\-*•]+/, '').trim())
        .filter(l => l.length > 0)
        .slice(0, 5);
      sections.push({
        id: sectionId(currentTitle, sectionIndex),
        title: currentTitle,
        keyPoints,
        targetWordCount: 300,
        status: 'editable',
        locked: false,
        contentId: `content-${sectionIndex}`,
      });
      sectionIndex++;
    }
    currentTitle = '';
    currentContent = [];
  };
  for (const line of lines) {
    const match = line.match(/^##\s+(.+)/);
    if (match) {
      flush();
      currentTitle = match[1].trim();
    } else {
      currentContent.push(line);
    }
  }
  flush();
  return sections;
}

export const createSermonSlice: StateCreator<StoreState, [], [], SermonSlice> = (set, get) => ({
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

  // [P1.3] 大纲锁定与段落独立操作
  outlineSections: [],
  outlineChangeStrategy: 'regenerate-affected',
  setOutlineSections: (sections) => set({ outlineSections: sections }),
  toggleSectionLock: (sectionId) => set({
    outlineSections: get().outlineSections.map(s =>
      s.id === sectionId ? { ...s, locked: !s.locked, status: s.locked ? 'editable' : 'locked' } : s
    ),
  }),
  lockAllSections: () => set({
    outlineSections: get().outlineSections.map(s => ({ ...s, locked: true, status: 'locked' as const })),
  }),
  unlockAllSections: () => set({
    outlineSections: get().outlineSections.map(s => ({ ...s, locked: false, status: 'editable' as const })),
  }),
  updateSectionStatus: (sectionId, status) => set({
    outlineSections: get().outlineSections.map(s =>
      s.id === sectionId ? { ...s, status } : s
    ),
  }),
  setOutlineChangeStrategy: (strategy) => set({ outlineChangeStrategy: strategy }),
  parseOutlineToSections: (markdown) => set({
    outlineSections: markdownToSections(markdown),
  }),

  // [P1.4] 段落级版本管理
  sectionVersions: [],
  activeVersionId: null,
  setSectionVersions: (versions) => set({ sectionVersions: versions }),
  addSectionVersion: (sectionId, content, source, label) => {
    const version: SectionVersion = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sectionId,
      content,
      source,
      wordCount: content.length,
      createdAt: Date.now(),
      label,
    };
    set({ sectionVersions: [...get().sectionVersions, version] });
  },
  restoreSectionVersion: (versionId) => {
    const version = get().sectionVersions.find(v => v.id === versionId);
    if (!version) return;
    get().addSectionVersion(version.sectionId, version.content, 'manual-restore');
  },
  deleteSectionVersion: (versionId) => set({
    sectionVersions: get().sectionVersions.filter(v => v.id !== versionId),
  }),
  setActiveVersionId: (versionId) => set({ activeVersionId: versionId }),
  getSectionVersions: (sectionId) => get().sectionVersions.filter(v => v.sectionId === sectionId),

  // [P2.1] 语音特征配置
  voiceProfile: {
    name: 'default',
    tone: 'warm',
    formality: 'semi-formal',
    audience: 'general',
  },
  setVoiceProfile: (profile) => set({ voiceProfile: profile }),

  // [P2.2] 神学知识注入
  theologyResources: [],
  setTheologyResources: (resources) => set({ theologyResources: resources }),

  // [P2.3] 语调仪表盘
  toneMetrics: {
    formality: 50,
    emotion: 50,
    doctrinalDensity: 30,
    readability: 70,
    engagement: 60,
    timestamp: Date.now(),
  },
  setToneMetrics: (metrics) => set({ toneMetrics: metrics }),

  // [P3.1] 讲章评论批注
  sermonComments: [],
  setSermonComments: (comments) => set({ sermonComments: comments }),
  addSermonComment: (comment) => {
    const newComment: SermonComment = {
      ...comment,
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
      resolved: false,
    };
    set({ sermonComments: [...get().sermonComments, newComment] });
  },
  resolveSermonComment: (commentId) => set({
    sermonComments: get().sermonComments.map(c =>
      c.id === commentId ? { ...c, resolved: true } : c
    ),
  }),
  deleteSermonComment: (commentId) => set({
    sermonComments: get().sermonComments.filter(c => c.id !== commentId),
  }),

  // [P3.3] 讲章系列
  sermonSeries: [],
  setSermonSeries: (series) => set({ sermonSeries: series }),
  addSermonSeries: (series) => {
    const newSeries: SermonSeries = {
      ...series,
      id: `series-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set({ sermonSeries: [...get().sermonSeries, newSeries] });
  },
  updateSermonSeries: (seriesId, updates) => set({
    sermonSeries: get().sermonSeries.map(s =>
      s.id === seriesId ? { ...s, ...updates, updatedAt: Date.now() } : s
    ),
  }),
  deleteSermonSeries: (seriesId) => set({
    sermonSeries: get().sermonSeries.filter(s => s.id !== seriesId),
  }),
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
