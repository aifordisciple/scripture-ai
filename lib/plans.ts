// lib/plans.ts

export interface PlanReadingTask {
  book: string;
  chapter: number;
}

export interface PlanDay {
  day: number;
  readings: PlanReadingTask[];
  devotional?: string; // 支持 AI 自动生成的每日灵修摘要
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  tags: string[];
  tasks: PlanDay[];
}

// 计划模板库
export const BIBLE_PLANS: ReadingPlan[] = [
  {
    id: "nt-90days",
    title: "新约 90 天通读",
    description: "每天阅读大约 2-3 章，三个月内轻松读完整个新约。非常适合初信者或者想要重新温习耶稣生平与使徒教导的弟兄姊妹。",
    durationDays: 90,
    tags: ["新约", "三个月", "初信友好"],
    tasks: [
      { day: 1, readings: [{ book: "Mat", chapter: 1 }, { book: "Mat", chapter: 2 }, { book: "Mat", chapter: 3 }] },
      { day: 2, readings: [{ book: "Mat", chapter: 4 }, { book: "Mat", chapter: 5 }, { book: "Mat", chapter: 6 }] },
      { day: 3, readings: [{ book: "Mat", chapter: 7 }, { book: "Mat", chapter: 8 }, { book: "Mat", chapter: 9 }] },
      { day: 4, readings: [{ book: "Mat", chapter: 10 }, { book: "Mat", chapter: 11 }, { book: "Mat", chapter: 12 }] },
      { day: 5, readings: [{ book: "Mat", chapter: 13 }, { book: "Mat", chapter: 14 }, { book: "Mat", chapter: 15 }] },
      { day: 6, readings: [{ book: "Mat", chapter: 16 }, { book: "Mat", chapter: 17 }, { book: "Mat", chapter: 18 }] },
      { day: 7, readings: [{ book: "Mat", chapter: 19 }, { book: "Mat", chapter: 20 }, { book: "Mat", chapter: 21 }] },
      { day: 8, readings: [{ book: "Mat", chapter: 22 }, { book: "Mat", chapter: 23 }, { book: "Mat", chapter: 24 }] },
      { day: 9, readings: [{ book: "Mat", chapter: 25 }, { book: "Mat", chapter: 26 }, { book: "Mat", chapter: 27 }] },
      { day: 10, readings: [{ book: "Mat", chapter: 28 }, { book: "Mrk", chapter: 1 }, { book: "Mrk", chapter: 2 }] },
      { day: 11, readings: [{ book: "Mrk", chapter: 3 }, { book: "Mrk", chapter: 4 }, { book: "Mrk", chapter: 5 }] },
      { day: 12, readings: [{ book: "Mrk", chapter: 6 }, { book: "Mrk", chapter: 7 }, { book: "Mrk", chapter: 8 }] },
      { day: 13, readings: [{ book: "Mrk", chapter: 9 }, { book: "Mrk", chapter: 10 }, { book: "Mrk", chapter: 11 }] },
      { day: 14, readings: [{ book: "Mrk", chapter: 12 }, { book: "Mrk", chapter: 13 }, { book: "Mrk", chapter: 14 }] },
      { day: 15, readings: [{ book: "Mrk", chapter: 15 }, { book: "Mrk", chapter: 16 }, { book: "Luk", chapter: 1 }] },
      { day: 16, readings: [{ book: "Luk", chapter: 2 }, { book: "Luk", chapter: 3 }, { book: "Luk", chapter: 4 }] },
      { day: 17, readings: [{ book: "Luk", chapter: 5 }, { book: "Luk", chapter: 6 }, { book: "Luk", chapter: 7 }] },
      { day: 18, readings: [{ book: "Luk", chapter: 8 }, { book: "Luk", chapter: 9 }, { book: "Luk", chapter: 10 }] },
      { day: 19, readings: [{ book: "Luk", chapter: 11 }, { book: "Luk", chapter: 12 }, { book: "Luk", chapter: 13 }] },
      { day: 20, readings: [{ book: "Luk", chapter: 14 }, { book: "Luk", chapter: 15 }, { book: "Luk", chapter: 16 }] },
      { day: 21, readings: [{ book: "Luk", chapter: 17 }, { book: "Luk", chapter: 18 }, { book: "Luk", chapter: 19 }] },
      { day: 22, readings: [{ book: "Luk", chapter: 20 }, { book: "Luk", chapter: 21 }, { book: "Luk", chapter: 22 }] },
      { day: 23, readings: [{ book: "Luk", chapter: 23 }, { book: "Luk", chapter: 24 }, { book: "Jhn", chapter: 1 }] },
      { day: 24, readings: [{ book: "Jhn", chapter: 2 }, { book: "Jhn", chapter: 3 }, { book: "Jhn", chapter: 4 }] },
      { day: 25, readings: [{ book: "Jhn", chapter: 5 }, { book: "Jhn", chapter: 6 }, { book: "Jhn", chapter: 7 }] },
      { day: 26, readings: [{ book: "Jhn", chapter: 8 }, { book: "Jhn", chapter: 9 }, { book: "Jhn", chapter: 10 }] },
      { day: 27, readings: [{ book: "Jhn", chapter: 11 }, { book: "Jhn", chapter: 12 }, { book: "Jhn", chapter: 13 }] },
      { day: 28, readings: [{ book: "Jhn", chapter: 14 }, { book: "Jhn", chapter: 15 }, { book: "Jhn", chapter: 16 }] },
      { day: 29, readings: [{ book: "Jhn", chapter: 17 }, { book: "Jhn", chapter: 18 }, { book: "Jhn", chapter: 19 }] },
      { day: 30, readings: [{ book: "Jhn", chapter: 20 }, { book: "Jhn", chapter: 21 }, { book: "Act", chapter: 1 }] },
      { day: 31, readings: [{ book: "Act", chapter: 2 }, { book: "Act", chapter: 3 }, { book: "Act", chapter: 4 }] },
      { day: 32, readings: [{ book: "Act", chapter: 5 }, { book: "Act", chapter: 6 }, { book: "Act", chapter: 7 }] },
      { day: 33, readings: [{ book: "Act", chapter: 8 }, { book: "Act", chapter: 9 }, { book: "Act", chapter: 10 }] },
      { day: 34, readings: [{ book: "Act", chapter: 11 }, { book: "Act", chapter: 12 }, { book: "Act", chapter: 13 }] },
      { day: 35, readings: [{ book: "Act", chapter: 14 }, { book: "Act", chapter: 15 }, { book: "Act", chapter: 16 }] },
      { day: 36, readings: [{ book: "Act", chapter: 17 }, { book: "Act", chapter: 18 }, { book: "Act", chapter: 19 }] },
      { day: 37, readings: [{ book: "Act", chapter: 20 }, { book: "Act", chapter: 21 }, { book: "Act", chapter: 22 }] },
      { day: 38, readings: [{ book: "Act", chapter: 23 }, { book: "Act", chapter: 24 }, { book: "Act", chapter: 25 }] },
      { day: 39, readings: [{ book: "Act", chapter: 26 }, { book: "Act", chapter: 27 }, { book: "Act", chapter: 28 }] },
      { day: 40, readings: [{ book: "Rom", chapter: 1 }, { book: "Rom", chapter: 2 }, { book: "Rom", chapter: 3 }] },
      { day: 41, readings: [{ book: "Rom", chapter: 4 }, { book: "Rom", chapter: 5 }, { book: "Rom", chapter: 6 }] },
      { day: 42, readings: [{ book: "Rom", chapter: 7 }, { book: "Rom", chapter: 8 }, { book: "Rom", chapter: 9 }] },
      { day: 43, readings: [{ book: "Rom", chapter: 10 }, { book: "Rom", chapter: 11 }, { book: "Rom", chapter: 12 }] },
      { day: 44, readings: [{ book: "Rom", chapter: 13 }, { book: "Rom", chapter: 14 }, { book: "Rom", chapter: 15 }] },
      { day: 45, readings: [{ book: "Rom", chapter: 16 }, { book: "1Co", chapter: 1 }, { book: "1Co", chapter: 2 }] },
      { day: 46, readings: [{ book: "1Co", chapter: 3 }, { book: "1Co", chapter: 4 }, { book: "1Co", chapter: 5 }] },
      { day: 47, readings: [{ book: "1Co", chapter: 6 }, { book: "1Co", chapter: 7 }, { book: "1Co", chapter: 8 }] },
      { day: 48, readings: [{ book: "1Co", chapter: 9 }, { book: "1Co", chapter: 10 }, { book: "1Co", chapter: 11 }] },
      { day: 49, readings: [{ book: "1Co", chapter: 12 }, { book: "1Co", chapter: 13 }, { book: "1Co", chapter: 14 }] },
      { day: 50, readings: [{ book: "1Co", chapter: 15 }, { book: "1Co", chapter: 16 }, { book: "2Co", chapter: 1 }] },
      { day: 51, readings: [{ book: "2Co", chapter: 2 }, { book: "2Co", chapter: 3 }, { book: "2Co", chapter: 4 }] },
      { day: 52, readings: [{ book: "2Co", chapter: 5 }, { book: "2Co", chapter: 6 }, { book: "2Co", chapter: 7 }] },
      { day: 53, readings: [{ book: "2Co", chapter: 8 }, { book: "2Co", chapter: 9 }, { book: "2Co", chapter: 10 }] },
      { day: 54, readings: [{ book: "2Co", chapter: 11 }, { book: "2Co", chapter: 12 }, { book: "2Co", chapter: 13 }] },
      { day: 55, readings: [{ book: "Gal", chapter: 1 }, { book: "Gal", chapter: 2 }, { book: "Gal", chapter: 3 }] },
      { day: 56, readings: [{ book: "Gal", chapter: 4 }, { book: "Gal", chapter: 5 }, { book: "Gal", chapter: 6 }] },
      { day: 57, readings: [{ book: "Eph", chapter: 1 }, { book: "Eph", chapter: 2 }, { book: "Eph", chapter: 3 }] },
      { day: 58, readings: [{ book: "Eph", chapter: 4 }, { book: "Eph", chapter: 5 }, { book: "Eph", chapter: 6 }] },
      { day: 59, readings: [{ book: "Php", chapter: 1 }, { book: "Php", chapter: 2 }, { book: "Php", chapter: 3 }] },
      { day: 60, readings: [{ book: "Php", chapter: 4 }, { book: "Col", chapter: 1 }, { book: "Col", chapter: 2 }] },
      { day: 61, readings: [{ book: "Col", chapter: 3 }, { book: "Col", chapter: 4 }, { book: "1Th", chapter: 1 }] },
      { day: 62, readings: [{ book: "1Th", chapter: 2 }, { book: "1Th", chapter: 3 }, { book: "1Th", chapter: 4 }] },
      { day: 63, readings: [{ book: "1Th", chapter: 5 }, { book: "2Th", chapter: 1 }, { book: "2Th", chapter: 2 }] },
      { day: 64, readings: [{ book: "2Th", chapter: 3 }, { book: "1Ti", chapter: 1 }, { book: "1Ti", chapter: 2 }] },
      { day: 65, readings: [{ book: "1Ti", chapter: 3 }, { book: "1Ti", chapter: 4 }, { book: "1Ti", chapter: 5 }] },
      { day: 66, readings: [{ book: "1Ti", chapter: 6 }, { book: "2Ti", chapter: 1 }, { book: "2Ti", chapter: 2 }] },
      { day: 67, readings: [{ book: "2Ti", chapter: 3 }, { book: "2Ti", chapter: 4 }, { book: "Tit", chapter: 1 }] },
      { day: 68, readings: [{ book: "Tit", chapter: 2 }, { book: "Tit", chapter: 3 }, { book: "Phm", chapter: 1 }] },
      { day: 69, readings: [{ book: "Heb", chapter: 1 }, { book: "Heb", chapter: 2 }, { book: "Heb", chapter: 3 }] },
      { day: 70, readings: [{ book: "Heb", chapter: 4 }, { book: "Heb", chapter: 5 }, { book: "Heb", chapter: 6 }] },
      { day: 71, readings: [{ book: "Heb", chapter: 7 }, { book: "Heb", chapter: 8 }, { book: "Heb", chapter: 9 }] },
      { day: 72, readings: [{ book: "Heb", chapter: 10 }, { book: "Heb", chapter: 11 }, { book: "Heb", chapter: 12 }] },
      { day: 73, readings: [{ book: "Heb", chapter: 13 }, { book: "Jas", chapter: 1 }, { book: "Jas", chapter: 2 }] },
      { day: 74, readings: [{ book: "Jas", chapter: 3 }, { book: "Jas", chapter: 4 }, { book: "Jas", chapter: 5 }] },
      { day: 75, readings: [{ book: "1Pe", chapter: 1 }, { book: "1Pe", chapter: 2 }, { book: "1Pe", chapter: 3 }] },
      { day: 76, readings: [{ book: "1Pe", chapter: 4 }, { book: "1Pe", chapter: 5 }, { book: "2Pe", chapter: 1 }] },
      { day: 77, readings: [{ book: "2Pe", chapter: 2 }, { book: "2Pe", chapter: 3 }, { book: "1Jn", chapter: 1 }] },
      { day: 78, readings: [{ book: "1Jn", chapter: 2 }, { book: "1Jn", chapter: 3 }, { book: "1Jn", chapter: 4 }] },
      { day: 79, readings: [{ book: "1Jn", chapter: 5 }, { book: "2Jn", chapter: 1 }, { book: "3Jn", chapter: 1 }] },
      { day: 80, readings: [{ book: "Jud", chapter: 1 }, { book: "Rev", chapter: 1 }, { book: "Rev", chapter: 2 }] },
      { day: 81, readings: [{ book: "Rev", chapter: 3 }, { book: "Rev", chapter: 4 }] },
      { day: 82, readings: [{ book: "Rev", chapter: 5 }, { book: "Rev", chapter: 6 }] },
      { day: 83, readings: [{ book: "Rev", chapter: 7 }, { book: "Rev", chapter: 8 }] },
      { day: 84, readings: [{ book: "Rev", chapter: 9 }, { book: "Rev", chapter: 10 }] },
      { day: 85, readings: [{ book: "Rev", chapter: 11 }, { book: "Rev", chapter: 12 }] },
      { day: 86, readings: [{ book: "Rev", chapter: 13 }, { book: "Rev", chapter: 14 }] },
      { day: 87, readings: [{ book: "Rev", chapter: 15 }, { book: "Rev", chapter: 16 }] },
      { day: 88, readings: [{ book: "Rev", chapter: 17 }, { book: "Rev", chapter: 18 }] },
      { day: 89, readings: [{ book: "Rev", chapter: 19 }, { book: "Rev", chapter: 20 }] },
      { day: 90, readings: [{ book: "Rev", chapter: 21 }, { book: "Rev", chapter: 22 }] },
    ]
  }
];