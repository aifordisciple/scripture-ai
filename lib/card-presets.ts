// lib/card-presets.ts
// 经文卡片预设常量 - 分辨率、渐变、字体、布局等

// --------------------------------------------------
// 1. 分辨率预设
// --------------------------------------------------

export interface ResolutionPreset {
  id: string;
  nameKey: string;       // i18n key
  width: number;
  height: number;
  category: 'wallpaper' | 'social' | 'avatar';
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { id: 'phone-wallpaper',  nameKey: 'shareCard.resPhoneWallpaper',  width: 1080, height: 1920, category: 'wallpaper' },
  { id: 'tablet-wallpaper', nameKey: 'shareCard.resTabletWallpaper', width: 1536, height: 2048, category: 'wallpaper' },
  { id: 'desktop-wallpaper', nameKey: 'shareCard.resDesktopWallpaper', width: 1920, height: 1080, category: 'wallpaper' },
  { id: 'social-card',     nameKey: 'shareCard.resSocialCard',      width: 1080, height: 1440, category: 'social' },
  { id: 'square',          nameKey: 'shareCard.resSquare',          width: 1080, height: 1080, category: 'social' },
  { id: 'wechat-avatar',   nameKey: 'shareCard.resWechatAvatar',    width: 640,  height: 640,  category: 'avatar' },
];

export const RESOLUTION_MIN = 320;
export const RESOLUTION_MAX = 3840;

export const ASPECT_RATIO_PRESETS = [
  { label: '1:1',  ratio: 1 },
  { label: '3:4',  ratio: 3 / 4 },
  { label: '4:3',  ratio: 4 / 3 },
  { label: '9:16', ratio: 9 / 16 },
  { label: '16:9', ratio: 16 / 9 },
];

// --------------------------------------------------
// 2. 渐变预设
// --------------------------------------------------

export interface GradientPreset {
  nameKey: string;
  bg: string;
  text: string;
  info: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { nameKey: 'shareCard.gradientPureWhite',  bg: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', text: '#333333', info: '#666666' },
  { nameKey: 'shareCard.gradientSerenity',   bg: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)',  text: '#333333', info: '#555555' },
  { nameKey: 'shareCard.gradientDream',      bg: 'linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%)',  text: '#ffffff', info: '#f0f0f0' },
  { nameKey: 'shareCard.gradientDeepBlue',   bg: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)',  text: '#ffffff', info: '#cccccc' },
  { nameKey: 'shareCard.gradientFreshGreen', bg: 'linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)',  text: '#333333', info: '#555555' },
  { nameKey: 'shareCard.gradientAurora',     bg: 'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)', text: '#333333', info: '#444444' },
  { nameKey: 'shareCard.gradientDeepNight',  bg: 'linear-gradient(to top, #09203f 0%, #537895 100%)',  text: '#ffffff', info: '#aaaaaa' },
  { nameKey: 'shareCard.gradientWarmSun',    bg: 'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)', text: '#333333', info: '#666666' },
];

// --------------------------------------------------
// 3. Unsplash 精选预设
// --------------------------------------------------

export const UNSPLASH_PRESETS = [
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494548162494-384bba4ab999?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1491466424936-e304919aada7?q=80&w=1080&auto=format&fit=crop',
];

// --------------------------------------------------
// 4. 字体选项
// --------------------------------------------------

export interface FontOption {
  nameKey: string;
  value: string;
  satoriName: string;  // Satori 渲染时使用的字体名
}

export const FONT_OPTIONS: FontOption[] = [
  { nameKey: 'shareCard.fontSongti', value: "'Noto Serif SC', serif",     satoriName: 'NotoSerifSC' },
  { nameKey: 'shareCard.fontHeiti', value: "'Noto Sans SC', sans-serif",  satoriName: 'NotoSansSC' },
  { nameKey: 'shareCard.fontKaiti', value: "'KaiTi', 'STKaiti', serif",   satoriName: 'KaiTi' },
];

// --------------------------------------------------
// 5. 布局模式
// --------------------------------------------------

export type LayoutMode = 'classic' | 'poster' | 'card' | 'modern' | 'split' | 'frame' | 'film' | 'minimal' | 'magazine' | 'stamp';

export const LAYOUT_MODES: { mode: LayoutMode; nameKey: string; icon: string }[] = [
  { mode: 'classic',   nameKey: 'shareCard.layoutClassic',   icon: 'Layout' },
  { mode: 'poster',    nameKey: 'shareCard.layoutPoster',    icon: 'Image' },
  { mode: 'card',      nameKey: 'shareCard.layoutCard',      icon: 'StickyNote' },
  { mode: 'modern',    nameKey: 'shareCard.layoutModern',    icon: 'AlignLeft' },
  { mode: 'split',     nameKey: 'shareCard.layoutSplit',     icon: 'Columns' },
  { mode: 'frame',     nameKey: 'shareCard.layoutFrame',     icon: 'Frame' },
  { mode: 'film',      nameKey: 'shareCard.layoutFilm',      icon: 'Clapperboard' },
  { mode: 'minimal',   nameKey: 'shareCard.layoutMinimal',   icon: 'Minus' },
  { mode: 'magazine',  nameKey: 'shareCard.layoutMagazine',  icon: 'Type' },
  { mode: 'stamp',     nameKey: 'shareCard.layoutStamp',     icon: 'Quote' },
];

// --------------------------------------------------
// 6. 文字颜色预设
// --------------------------------------------------

export const TEXT_COLOR_PRESETS = ['#ffffff', '#f8f9fa', '#e2e8f0', '#333333', '#1a202c', '#000000', '#2b6cb0', '#2f855a', '#c53030'];

export const INFO_COLOR_PRESETS = ['#ffffff', '#cccccc', '#999999', '#666666', '#333333', '#000000'];

// --------------------------------------------------
// 7. QR 码位置选项
// --------------------------------------------------

export type QRPosition = 'bottom-left' | 'bottom-right' | 'none';

export const QR_POSITION_OPTIONS: { value: QRPosition; nameKey: string }[] = [
  { value: 'none',         nameKey: 'shareCard.qrNone' },
  { value: 'bottom-left',  nameKey: 'shareCard.qrBottomLeft' },
  { value: 'bottom-right', nameKey: 'shareCard.qrBottomRight' },
];

// --------------------------------------------------
// 8. Picsum 分类
// --------------------------------------------------

export const PICSUM_CATEGORIES = [
  { id: 'all',     nameKey: 'shareCard.picsumAll' },
  { id: 'nature',  nameKey: 'shareCard.picsumNature' },
  { id: 'city',    nameKey: 'shareCard.picsumCity' },
  { id: 'people',  nameKey: 'shareCard.picsumPeople' },
  { id: 'tech',    nameKey: 'shareCard.picsumTech' },
  { id: 'food',    nameKey: 'shareCard.picsumFood' },
];

// --------------------------------------------------
// 9. 卡片编辑完整配置类型
// --------------------------------------------------

export interface CardConfig {
  // 内容
  verseContent: string[];
  bookName: string;
  chapter: string;
  verseRange: string;

  // 分辨率
  width: number;
  height: number;
  resolutionPresetId: string | null;

  // 背景
  bgImage: string | null;     // Base64 data URL 或 null
  bgGradient: string;
  selectedBgUrl: string | null;

  // 布局
  layoutMode: LayoutMode;

  // 文字
  textColor: string;
  infoColor: string;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';

  // AI 标题
  aiTitle: string | null;

  // QR 码
  qrCodeUrl: string | null;
  qrCodePosition: QRPosition;
}

export const DEFAULT_CARD_CONFIG: CardConfig = {
  verseContent: [],
  bookName: '',
  chapter: '',
  verseRange: '',
  width: 1080,
  height: 1440,
  resolutionPresetId: 'social-card',
  bgImage: null,
  bgGradient: GRADIENT_PRESETS[0].bg,
  selectedBgUrl: null,
  layoutMode: 'classic',
  textColor: GRADIENT_PRESETS[0].text,
  infoColor: GRADIENT_PRESETS[0].info,
  fontSize: 22,
  lineHeight: 1.8,
  fontFamily: FONT_OPTIONS[0].value,
  textAlign: 'center',
  aiTitle: null,
  qrCodeUrl: null,
  qrCodePosition: 'none',
};

// --------------------------------------------------
// 10. 辅助函数
// --------------------------------------------------

/** 格式化经文范围 (如 "1, 3-5, 7") */
export function formatVerseRange(verses: number[]): string {
  if (!verses || verses.length === 0) return '';
  const sorted = [...verses].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = sorted[i];
      prev = sorted[i];
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(', ');
}

/** 根据布局模式推荐文字颜色 */
export function getRecommendedColorsForLayout(
  mode: LayoutMode,
  bgImage: string | null,
  gradientPreset: GradientPreset | null,
): { textColor: string; infoColor: string; textAlign: 'left' | 'center' | 'right' } {
  if (mode === 'card' || mode === 'split') {
    return { textColor: '#333333', infoColor: '#666666', textAlign: 'left' };
  }
  if (mode === 'poster' || mode === 'film') {
    return { textColor: '#ffffff', infoColor: '#cccccc', textAlign: mode === 'film' ? 'center' : 'left' };
  }
  if (bgImage) {
    return { textColor: '#ffffff', infoColor: '#e5e5e5', textAlign: 'center' };
  }
  if (gradientPreset) {
    return { textColor: gradientPreset.text, infoColor: gradientPreset.info, textAlign: 'center' };
  }
  return { textColor: '#333333', infoColor: '#666666', textAlign: 'center' };
}

/** 计算预览缩放比例 */
export function calculatePreviewScale(
  cardWidth: number,
  cardHeight: number,
  containerWidth: number,
  containerHeight: number,
): number {
  const scaleW = containerWidth / cardWidth;
  const scaleH = containerHeight / cardHeight;
  return Math.min(scaleW, scaleH, 1);
}