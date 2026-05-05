// lib/bible-periods.ts
// 圣经历史时期定义

export interface BiblePeriod {
  id: string;
  name: string;
  nameEn: string;
  yearStart: number;  // 负数表示公元前
  yearEnd: number;
  description: string;
  color: string;
}

// 圣经历史时期划分
export const BIBLE_PERIODS: BiblePeriod[] = [
  {
    id: 'creation',
    name: '创造时期',
    nameEn: 'Creation Period',
    yearStart: -4004,
    yearEnd: -2348,
    description: '从创世到大洪水',
    color: '#8b5cf6', // purple
  },
  {
    id: 'patriarchs',
    name: '族长时期',
    nameEn: 'Patriarchal Period',
    yearStart: -2166,
    yearEnd: -1805,
    description: '亚伯拉罕、以撒、雅各、约瑟',
    color: '#0066cc', // action blue
  },
  {
    id: 'exodus',
    name: '出埃及时期',
    nameEn: 'Exodus Period',
    yearStart: -1446,
    yearEnd: -1406,
    description: '出埃及、旷野漂流',
    color: '#0ea5e9', // sky
  },
  {
    id: 'conquest',
    name: '征服时期',
    nameEn: 'Conquest Period',
    yearStart: -1406,
    yearEnd: -1375,
    description: '约书亚征服迦南',
    color: '#14b8a6', // teal
  },
  {
    id: 'judges',
    name: '士师时期',
    nameEn: 'Judges Period',
    yearStart: -1375,
    yearEnd: -1050,
    description: '士师治理以色列',
    color: '#10b981', // emerald
  },
  {
    id: 'united-kingdom',
    name: '统一王国时期',
    nameEn: 'United Kingdom',
    yearStart: -1050,
    yearEnd: -931,
    description: '扫罗、大卫、所罗门',
    color: '#f59e0b', // amber
  },
  {
    id: 'divided-kingdom',
    name: '分裂王国时期',
    nameEn: 'Divided Kingdom',
    yearStart: -931,
    yearEnd: -586,
    description: '北国以色列与南国犹大',
    color: '#f97316', // orange
  },
  {
    id: 'exile',
    name: '被掳时期',
    nameEn: 'Exile Period',
    yearStart: -586,
    yearEnd: -538,
    description: '被掳巴比伦',
    color: '#ef4444', // red
  },
  {
    id: 'restoration',
    name: '归回时期',
    nameEn: 'Restoration Period',
    yearStart: -538,
    yearEnd: -400,
    description: '归回耶路撒冷、重建圣殿',
    color: '#ec4899', // pink
  },
  {
    id: 'intertestamental',
    name: '两约之间',
    nameEn: 'Intertestamental Period',
    yearStart: -400,
    yearEnd: -4,
    description: '旧约与新约之间',
    color: '#64748b', // slate
  },
  {
    id: 'jesus',
    name: '耶稣时期',
    nameEn: 'Jesus Ministry',
    yearStart: -4,
    yearEnd: 30,
    description: '耶稣降生、传道、受死、复活',
    color: '#f43f5e', // rose
  },
  {
    id: 'early-church',
    name: '初期教会',
    nameEn: 'Early Church',
    yearStart: 30,
    yearEnd: 100,
    description: '使徒时代、福音传播',
    color: '#06b6d4', // cyan
  },
];

// 书卷到时期的映射（简化版，基于主要事件）
export const BOOK_TO_PERIOD: Record<string, string> = {
  // 律法书
  'GEN': 'patriarchs',      // 创世记 - 族长时期
  'EXO': 'exodus',          // 出埃及记
  'LEV': 'exodus',          // 利未记
  'NUM': 'exodus',          // 民数记
  'DEU': 'exodus',          // 申命记

  // 历史书
  'JOS': 'conquest',        // 约书亚记
  'JDG': 'judges',          // 士师记
  'RUT': 'judges',          // 路得记
  '1SA': 'united-kingdom',  // 撒母耳记上
  '2SA': 'united-kingdom',  // 撒母耳记下
  '1KI': 'united-kingdom',  // 列王纪上
  '2KI': 'divided-kingdom', // 列王纪下
  '1CH': 'united-kingdom',  // 历代志上
  '2CH': 'divided-kingdom', // 历代志下
  'EZR': 'restoration',     // 以斯拉记
  'NEH': 'restoration',     // 尼希米记
  'EST': 'exile',           // 以斯帖记

  // 诗歌智慧书
  'JOB': 'patriarchs',      // 约伯记
  'PSA': 'united-kingdom',  // 诗篇
  'PRO': 'united-kingdom',  // 箴言
  'ECC': 'united-kingdom',  // 传道书
  'SNG': 'united-kingdom',  // 雅歌

  // 先知书
  'ISA': 'divided-kingdom', // 以赛亚书
  'JER': 'exile',           // 耶利米书
  'LAM': 'exile',           // 耶利米哀歌
  'EZK': 'exile',           // 以西结书
  'DAN': 'exile',           // 但以理书
  'HOS': 'divided-kingdom', // 何西阿书
  'JOL': 'divided-kingdom', // 约珥书
  'AMO': 'divided-kingdom', // 阿摩司书
  'OBA': 'divided-kingdom', // 俄巴底亚书
  'JON': 'divided-kingdom', // 约拿书
  'MIC': 'divided-kingdom', // 弥迦书
  'NAM': 'divided-kingdom', // 那鸿书
  'HAB': 'divided-kingdom', // 哈巴谷书
  'ZEP': 'divided-kingdom', // 西番雅书
  'HAG': 'restoration',     // 哈该书
  'ZEC': 'restoration',     // 撒迦利亚书
  'MAL': 'restoration',     // 玛拉基书

  // 新约
  'MAT': 'jesus',           // 马太福音
  'MRK': 'jesus',           // 马可福音
  'LUK': 'jesus',           // 路加福音
  'JHN': 'jesus',           // 约翰福音
  'ACT': 'early-church',    // 使徒行传
  'ROM': 'early-church',    // 罗马书
  '1CO': 'early-church',    // 哥林多前书
  '2CO': 'early-church',    // 哥林多后书
  'GAL': 'early-church',    // 加拉太书
  'EPH': 'early-church',    // 以弗所书
  'PHP': 'early-church',    // 腓立比书
  'COL': 'early-church',    // 歌罗西书
  '1TH': 'early-church',    // 帖撒罗尼迦前书
  '2TH': 'early-church',    // 帖撒罗尼迦后书
  '1TI': 'early-church',    // 提摩太前书
  '2TI': 'early-church',    // 提摩太后书
  'TIT': 'early-church',    // 提多书
  'PHM': 'early-church',    // 腓利门书
  'HEB': 'early-church',    // 希伯来书
  'JAS': 'early-church',    // 雅各书
  '1PE': 'early-church',    // 彼得前书
  '2PE': 'early-church',    // 彼得后书
  '1JN': 'early-church',    // 约翰一书
  '2JN': 'early-church',    // 约翰二书
  '3JN': 'early-church',    // 约翰三书
  'JUD': 'early-church',    // 犹大书
  'REV': 'early-church',    // 启示录
};

// 获取书卷对应的时期
export function getBookPeriod(bookId: string): BiblePeriod | undefined {
  const periodId = BOOK_TO_PERIOD[bookId?.toUpperCase()];
  return BIBLE_PERIODS.find(p => p.id === periodId);
}

// 格式化年份显示
export function formatYear(year: number): string {
  if (year < 0) {
    return `公元前 ${Math.abs(year)} 年`;
  } else if (year === 0) {
    return '公元元年';
  } else {
    return `公元 ${year} 年`;
  }
}