// lib/i18n.ts
// Internationalization configuration

export type Locale = 'zh' | 'en' | 'zh-TW' | 'ko' | 'ja';

export const locales: Locale[] = ['zh', 'en', 'zh-TW', 'ko', 'ja'];

export const localeNames: Record<Locale, string> = {
  'zh': '简体中文',
  'en': 'English',
  'zh-TW': '繁體中文',
  'ko': '한국어',
  'ja': '日本語',
};

// Common translations
export const translations = {
  // Navigation
  'nav.read': { zh: '阅读', en: 'Read' },
  'nav.search': { zh: '搜索', en: 'Search' },
  'nav.plans': { zh: '计划', en: 'Plans' },
  'nav.highlights': { zh: '收藏', en: 'Highlights' },
  'nav.notes': { zh: '笔记', en: 'Notes' },
  'nav.profile': { zh: '我的', en: 'Profile' },
  'nav.community': { zh: '社区', en: 'Community' },
  
  // Actions
  'action.save': { zh: '保存', en: 'Save' },
  'action.cancel': { zh: '取消', en: 'Cancel' },
  'action.delete': { zh: '删除', en: 'Delete' },
  'action.edit': { zh: '编辑', en: 'Edit' },
  'action.share': { zh: '分享', en: 'Share' },
  'action.copy': { zh: '复制', en: 'Copy' },
  
  // AI Features
  'ai.tutor': { zh: 'AI 导师', en: 'AI Tutor' },
  'ai.devotional': { zh: '每日灵修', en: 'Daily Devotional' },
  'ai.prayer': { zh: '祷告词', en: 'Prayer' },
  'ai.memorize': { zh: '背诵', en: 'Memorize' },
  'ai.studyGuide': { zh: '查经材料', en: 'Study Guide' },
  'ai.sermon': { zh: '讲道大纲', en: 'Sermon Outline' },
  
  // Memory
  'memory.review': { zh: '复习', en: 'Review' },
  'memory.mastered': { zh: '已掌握', en: 'Mastered' },
  'memory.learning': { zh: '学习中', en: 'Learning' },
  'memory.due': { zh: '待复习', en: 'Due for review' },
  
  // Social
  'social.friends': { zh: '好友', en: 'Friends' },
  'social.post': { zh: '发布', en: 'Post' },
  'social.like': { zh: '点赞', en: 'Like' },
  'social.comment': { zh: '评论', en: 'Comment' },
  
  // Church
  'church.create': { zh: '创建教会', en: 'Create Church' },
  'church.join': { zh: '加入', en: 'Join' },
  'church.leave': { zh: '离开', en: 'Leave' },
  'church.members': { zh: '成员', en: 'Members' },
  'church.groupPlan': { zh: '小组计划', en: 'Group Plan' },
};

export function t(key: string, locale: Locale = 'zh'): string {
  const translation = translations[key as keyof typeof translations];
  if (!translation) return key;
  return translation[locale] || translation.zh || key;
}

export function getLocaleFromHeader(header: string | null): Locale {
  if (!header) return 'zh';
  
  // Check supported locales
  for (const locale of locales) {
    if (header.toLowerCase().includes(locale.toLowerCase())) {
      return locale;
    }
  }
  
  // Default to zh
  return 'zh';
}
