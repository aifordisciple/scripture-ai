// lib/plans.ts

export interface PlanReadingTask {
  book: string;
  chapter: number;
}

export interface PlanDay {
  day: number;
  readings: PlanReadingTask[];
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
    id: "mcheyne-1year",
    title: "麦琴读经法 (经典版)",
    description: "史上最经典的读经计划。每天阅读4章，一年内读完旧约一遍、新约和诗篇两遍。适合有一定基础、渴望全面概览圣经的信徒。",
    durationDays: 365,
    tags: ["一年", "经典", "全面"],
    tasks: [
      { day: 1, readings: [{ book: "Gen", chapter: 1 }, { book: "Mt", chapter: 1 }, { book: "Ezr", chapter: 1 }, { book: "Act", chapter: 1 }] },
      { day: 2, readings: [{ book: "Gen", chapter: 2 }, { book: "Mt", chapter: 2 }, { book: "Ezr", chapter: 2 }, { book: "Act", chapter: 2 }] },
      { day: 3, readings: [{ book: "Gen", chapter: 3 }, { book: "Mt", chapter: 3 }, { book: "Ezr", chapter: 3 }, { book: "Act", chapter: 3 }] },
    ]
  },
  {
    id: "nt-90days",
    title: "新约 90 天通读",
    description: "每天阅读大约 3 章，三个月内轻松读完整个新约。非常适合初信者或者想要重新温习耶稣生平与使徒教导的弟兄姊妹。",
    durationDays: 90,
    tags: ["新约", "三个月", "初信友好"],
    tasks: [
      { day: 1, readings: [{ book: "Mt", chapter: 1 }, { book: "Mt", chapter: 2 }, { book: "Mt", chapter: 3 }] },
      { day: 2, readings: [{ book: "Mt", chapter: 4 }, { book: "Mt", chapter: 5 }, { book: "Mt", chapter: 6 }] },
      { day: 3, readings: [{ book: "Mt", chapter: 7 }, { book: "Mt", chapter: 8 }, { book: "Mt", chapter: 9 }] },
    ]
  },
  {
    id: "psalms-proverbs-31",
    title: "诗篇与箴言 31 天",
    description: "每月一轮。每天阅读 5 篇诗篇和 1 章箴言，在敬拜赞美与生活智慧中度过每一天。",
    durationDays: 31,
    tags: ["诗歌智慧", "按月", "灵修"],
    tasks: [
      { day: 1, readings: [{ book: "Ps", chapter: 1 }, { book: "Ps", chapter: 2 }, { book: "Ps", chapter: 3 }, { book: "Ps", chapter: 4 }, { book: "Ps", chapter: 5 }, { book: "Prov", chapter: 1 }] },
      { day: 2, readings: [{ book: "Ps", chapter: 6 }, { book: "Ps", chapter: 7 }, { book: "Ps", chapter: 8 }, { book: "Ps", chapter: 9 }, { book: "Ps", chapter: 10 }, { book: "Prov", chapter: 2 }] },
    ]
  }
];
