// scripts/seed_theme_network.ts
// 主题网络种子脚本 - 预置主题、主题-经文关联、主题-主题连接

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 预置的主题-经文关联（高频经文）
const THEME_VERSE_LINKS = [
  // 救恩
  { themeName: '救恩', bookId: 'Jhn', chapter: 3, verseStart: 16, relevance: 1.0 },
  { themeName: '救恩', bookId: 'Eph', chapter: 2, verseStart: 8, verseEnd: 9, relevance: 0.95 },
  { themeName: '救恩', bookId: 'Rom', chapter: 10, verseStart: 9, relevance: 0.9 },
  { themeName: '救恩', bookId: 'Act', chapter: 4, verseStart: 12, relevance: 0.85 },
  { themeName: '救恩', bookId: 'Tit', chapter: 3, verseStart: 5, relevance: 0.8 },

  // 神的爱
  { themeName: '爱', bookId: 'Jhn', chapter: 3, verseStart: 16, relevance: 1.0 },
  { themeName: '爱', bookId: '1Jn', chapter: 4, verseStart: 8, relevance: 0.95 },
  { themeName: '爱', bookId: 'Rom', chapter: 5, verseStart: 8, relevance: 0.9 },
  { themeName: '爱', bookId: '1Co', chapter: 13, verseStart: 4, verseEnd: 8, relevance: 0.85 },
  { themeName: '爱', bookId: 'Jhn', chapter: 15, verseStart: 13, relevance: 0.8 },

  // 永生
  { themeName: '永生', bookId: 'Jhn', chapter: 3, verseStart: 16, relevance: 1.0 },
  { themeName: '永生', bookId: 'Jhn', chapter: 17, verseStart: 3, relevance: 0.9 },
  { themeName: '永生', bookId: 'Rom', chapter: 6, verseStart: 23, relevance: 0.85 },
  { themeName: '永生', bookId: '1Jn', chapter: 5, verseStart: 11, relevance: 0.8 },

  // 恩典
  { themeName: '恩典', bookId: 'Eph', chapter: 2, verseStart: 8, relevance: 1.0 },
  { themeName: '恩典', bookId: 'Rom', chapter: 5, verseStart: 20, relevance: 0.9 },
  { themeName: '恩典', bookId: '2Co', chapter: 12, verseStart: 9, relevance: 0.85 },
  { themeName: '恩典', bookId: 'Tit', chapter: 2, verseStart: 11, relevance: 0.8 },

  // 信心
  { themeName: '信心', bookId: 'Heb', chapter: 11, verseStart: 1, relevance: 1.0 },
  { themeName: '信心', bookId: 'Rom', chapter: 4, verseStart: 3, relevance: 0.9 },
  { themeName: '信心', bookId: 'Eph', chapter: 2, verseStart: 8, relevance: 0.85 },
  { themeName: '信心', bookId: 'Jas', chapter: 2, verseStart: 17, relevance: 0.8 },

  // 悔改
  { themeName: '悔改', bookId: 'Act', chapter: 3, verseStart: 19, relevance: 1.0 },
  { themeName: '悔改', bookId: 'Mat', chapter: 4, verseStart: 17, relevance: 0.9 },
  { themeName: '悔改', bookId: 'Luk', chapter: 15, verseStart: 7, relevance: 0.85 },
  { themeName: '悔改', bookId: '2Pe', chapter: 3, verseStart: 9, relevance: 0.8 },

  // 称义
  { themeName: '称义', bookId: 'Rom', chapter: 3, verseStart: 24, relevance: 1.0 },
  { themeName: '称义', bookId: 'Rom', chapter: 5, verseStart: 1, relevance: 0.9 },
  { themeName: '称义', bookId: 'Gal', chapter: 2, verseStart: 16, relevance: 0.85 },

  // 成圣
  { themeName: '成圣', bookId: '1Th', chapter: 4, verseStart: 3, relevance: 1.0 },
  { themeName: '成圣', bookId: 'Heb', chapter: 12, verseStart: 14, relevance: 0.9 },
  { themeName: '成圣', bookId: '1Pe', chapter: 1, verseStart: 15, verseEnd: 16, relevance: 0.85 },

  // 复活
  { themeName: '复活', bookId: '1Co', chapter: 15, verseStart: 3, verseEnd: 4, relevance: 1.0 },
  { themeName: '复活', bookId: '1Co', chapter: 15, verseStart: 20, relevance: 0.9 },
  { themeName: '复活', bookId: 'Rom', chapter: 6, verseStart: 4, relevance: 0.85 },

  // 创造
  { themeName: '创造', bookId: 'Gen', chapter: 1, verseStart: 1, relevance: 1.0 },
  { themeName: '创造', bookId: 'Gen', chapter: 1, verseStart: 27, relevance: 0.9 },
  { themeName: '创造', bookId: 'Jhn', chapter: 1, verseStart: 3, relevance: 0.85 },
  { themeName: '创造', bookId: 'Col', chapter: 1, verseStart: 16, relevance: 0.8 },

  // 神的国
  { themeName: '神的国', bookId: 'Mat', chapter: 6, verseStart: 33, relevance: 1.0 },
  { themeName: '神的国', bookId: 'Mar', chapter: 1, verseStart: 15, relevance: 0.9 },
  { themeName: '神的国', bookId: 'Luk', chapter: 17, verseStart: 21, relevance: 0.85 },

  // 盼望
  { themeName: '盼望', bookId: 'Rom', chapter: 5, verseStart: 5, relevance: 1.0 },
  { themeName: '盼望', bookId: 'Heb', chapter: 6, verseStart: 19, relevance: 0.9 },
  { themeName: '盼望', bookId: 'Rom', chapter: 15, verseStart: 13, relevance: 0.85 },

  // 和平
  { themeName: '和平', bookId: 'Eph', chapter: 2, verseStart: 14, relevance: 1.0 },
  { themeName: '和平', bookId: 'Rom', chapter: 5, verseStart: 1, relevance: 0.9 },
  { themeName: '和平', bookId: 'Mat', chapter: 5, verseStart: 9, relevance: 0.85 },

  // 饶恕
  { themeName: '饶恕', bookId: 'Mat', chapter: 6, verseStart: 14, verseEnd: 15, relevance: 1.0 },
  { themeName: '饶恕', bookId: 'Eph', chapter: 4, verseStart: 32, relevance: 0.9 },
  { themeName: '饶恕', bookId: 'Col', chapter: 3, verseStart: 13, relevance: 0.85 },

  // 谦卑
  { themeName: '谦卑', bookId: 'Mat', chapter: 5, verseStart: 3, relevance: 1.0 },
  { themeName: '谦卑', bookId: '1Pe', chapter: 5, verseStart: 5, relevance: 0.9 },
  { themeName: '谦卑', bookId: 'Php', chapter: 2, verseStart: 3, relevance: 0.85 },

  // 祷告
  { themeName: '祷告', bookId: 'Mat', chapter: 6, verseStart: 9, verseEnd: 13, relevance: 1.0 },
  { themeName: '祷告', bookId: '1Th', chapter: 5, verseStart: 17, relevance: 0.9 },
  { themeName: '祷告', bookId: 'Eph', chapter: 6, verseStart: 18, relevance: 0.85 },

  // 服事
  { themeName: '服事', bookId: 'Mar', chapter: 10, verseStart: 45, relevance: 1.0 },
  { themeName: '服事', bookId: 'Gal', chapter: 5, verseStart: 13, relevance: 0.9 },
  { themeName: '服事', bookId: 'Jhn', chapter: 12, verseStart: 26, relevance: 0.85 },

  // 受苦
  { themeName: '受苦', bookId: 'Jhn', chapter: 16, verseStart: 33, relevance: 1.0 },
  { themeName: '受苦', bookId: 'Rom', chapter: 8, verseStart: 17, verseEnd: 18, relevance: 0.9 },
  { themeName: '受苦', bookId: '1Pe', chapter: 4, verseStart: 12, verseEnd: 13, relevance: 0.85 },

  // 约
  { themeName: '约', bookId: 'Gen', chapter: 17, verseStart: 7, relevance: 1.0 },
  { themeName: '约', bookId: 'Jer', chapter: 31, verseStart: 31, verseEnd: 34, relevance: 0.9 },
  { themeName: '约', bookId: 'Heb', chapter: 8, verseStart: 6, relevance: 0.85 },

  // 弥赛亚
  { themeName: '弥赛亚', bookId: 'Isa', chapter: 9, verseStart: 6, verseEnd: 7, relevance: 1.0 },
  { themeName: '弥赛亚', bookId: 'Isa', chapter: 53, verseStart: 1, relevance: 0.9 },
  { themeName: '弥赛亚', bookId: 'Mat', chapter: 1, verseStart: 1, relevance: 0.85 },
  { themeName: '弥赛亚', bookId: 'Jhn', chapter: 4, verseStart: 25, relevance: 0.8 },

  // 审判
  { themeName: '审判', bookId: 'Heb', chapter: 9, verseStart: 27, relevance: 1.0 },
  { themeName: '审判', bookId: 'Rev', chapter: 20, verseStart: 11, verseEnd: 15, relevance: 0.9 },
  { themeName: '审判', bookId: '2Co', chapter: 5, verseStart: 10, relevance: 0.85 },

  // 新天新地
  { themeName: '新天新地', bookId: 'Isa', chapter: 65, verseStart: 17, relevance: 1.0 },
  { themeName: '新天新地', bookId: 'Rev', chapter: 21, verseStart: 1, verseEnd: 4, relevance: 0.9 },
  { themeName: '新天新地', bookId: '2Pe', chapter: 3, verseStart: 13, relevance: 0.85 },

  // 诗篇23篇相关主题
  { themeName: '牧者', bookId: 'Psa', chapter: 23, verseStart: 1, relevance: 1.0 },
  { themeName: '牧者', bookId: 'Jhn', chapter: 10, verseStart: 11, relevance: 0.9 },
  { themeName: '安慰', bookId: 'Psa', chapter: 23, verseStart: 4, relevance: 1.0 },
  { themeName: '安慰', bookId: '2Co', chapter: 1, verseStart: 3, relevance: 0.85 },
  { themeName: '信靠', bookId: 'Psa', chapter: 23, verseStart: 1, relevance: 0.9 },
  { themeName: '信靠', bookId: 'Pro', chapter: 3, verseStart: 5, relevance: 0.9 },

  // 罗马书8:28相关
  { themeName: '神的主权', bookId: 'Rom', chapter: 8, verseStart: 28, relevance: 1.0 },
  { themeName: '神的主权', bookId: 'Eph', chapter: 1, verseStart: 11, relevance: 0.9 },
  { themeName: '万事互相效力', bookId: 'Rom', chapter: 8, verseStart: 28, relevance: 1.0 },
];

// 预置的主题-主题连接（基于神学关系）
const THEME_CONNECTIONS = [
  // 救恩相关
  { theme: '救恩', related: '恩典', type: 'RELATED', strength: 0.95 },
  { theme: '救恩', related: '信心', type: 'RELATED', strength: 0.9 },
  { theme: '救恩', related: '悔改', type: 'RELATED', strength: 0.85 },
  { theme: '救恩', related: '永生', type: 'CHILD', strength: 0.85 },
  { theme: '救恩', related: '称义', type: 'CHILD', strength: 0.8 },
  { theme: '救恩', related: '弥赛亚', type: 'FULFILLS', strength: 0.95 },

  // 称义与成圣
  { theme: '称义', related: '成圣', type: 'CHILD', strength: 0.85 },
  { theme: '成圣', related: '圣灵', type: 'RELATED', strength: 0.8 },

  // 爱相关
  { theme: '爱', related: '饶恕', type: 'RELATED', strength: 0.9 },
  { theme: '爱', related: '和平', type: 'RELATED', strength: 0.8 },
  { theme: '神的爱', related: '爱', type: 'PARENT', strength: 0.95 },

  // 信心与盼望
  { theme: '信心', related: '盼望', type: 'RELATED', strength: 0.85 },
  { theme: '信心', related: '恩典', type: 'RELATED', strength: 0.85 },

  // 基督论
  { theme: '弥赛亚', related: '复活', type: 'RELATED', strength: 0.9 },
  { theme: '弥赛亚', related: '救恩', type: 'FULFILLS', strength: 0.95 },
  { theme: '弥赛亚', related: '约', type: 'FULFILLS', strength: 0.8 },

  // 末世论
  { theme: '末世', related: '审判', type: 'RELATED', strength: 0.95 },
  { theme: '末世', related: '新天新地', type: 'CHILD', strength: 0.85 },
  { theme: '末世', related: '复活', type: 'RELATED', strength: 0.8 },

  // 复活与盼望
  { theme: '复活', related: '盼望', type: 'RELATED', strength: 0.85 },
  { theme: '复活', related: '永生', type: 'RELATED', strength: 0.9 },

  // 创造与神的主权
  { theme: '创造', related: '神的主权', type: 'RELATED', strength: 0.85 },
  { theme: '创造', related: '神的权能', type: 'RELATED', strength: 0.85 },

  // 牧者与信靠
  { theme: '牧者', related: '信靠', type: 'RELATED', strength: 0.9 },
  { theme: '牧者', related: '安慰', type: 'RELATED', strength: 0.85 },

  // 祷告与服事
  { theme: '祷告', related: '服事', type: 'RELATED', strength: 0.7 },

  // 受苦与盼望
  { theme: '受苦', related: '盼望', type: 'RELATED', strength: 0.8 },
  { theme: '受苦', related: '安慰', type: 'RELATED', strength: 0.85 },

  // 三位一体
  { theme: '三位一体', related: '圣灵', type: 'RELATED', strength: 0.9 },
  { theme: '三位一体', related: '创造', type: 'RELATED', strength: 0.8 },

  // 神的国
  { theme: '神的国', related: '弥赛亚', type: 'RELATED', strength: 0.85 },
  { theme: '神的国', related: '新天新地', type: 'RELATED', strength: 0.8 },

  // 谦卑与服事
  { theme: '谦卑', related: '服事', type: 'RELATED', strength: 0.8 },
];

async function main() {
  console.log('开始种子主题网络数据...');

  // 1. 创建主题-经文关联
  console.log('\n--- 创建主题-经文关联 ---');
  let linkCount = 0;
  for (const link of THEME_VERSE_LINKS) {
    try {
      const theme = await prisma.bibleTheme.findFirst({
        where: {
          OR: [
            { nameZh: link.themeName },
            { nameEn: link.themeName },
            { aliases: { has: link.themeName } },
          ],
        },
      });

      if (!theme) {
        console.log(`主题不存在: ${link.themeName}`);
        continue;
      }

      // 检查是否已存在
      const existing = await prisma.themeVerseLink.findFirst({
        where: {
          themeId: theme.id,
          bookId: link.bookId,
          chapter: link.chapter,
          verseStart: link.verseStart,
        },
      });

      if (existing) {
        continue; // 已存在，跳过
      }

      await prisma.themeVerseLink.create({
        data: {
          themeId: theme.id,
          bookId: link.bookId,
          chapter: link.chapter,
          verseStart: link.verseStart,
          verseEnd: link.verseEnd,
          relevance: link.relevance,
          linkType: 'PRIMARY',
          source: 'MANUAL',
        },
      });
      linkCount++;
      console.log(`创建关联: ${theme.nameZh} -> ${link.bookId} ${link.chapter}:${link.verseStart}`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`创建关联失败:`, error.message);
      }
    }
  }
  console.log(`创建了 ${linkCount} 个主题-经文关联`);

  // 2. 创建主题-主题连接
  console.log('\n--- 创建主题-主题连接 ---');
  let connCount = 0;
  for (const conn of THEME_CONNECTIONS) {
    try {
      const theme = await prisma.bibleTheme.findFirst({
        where: { nameZh: conn.theme },
      });
      const relatedTheme = await prisma.bibleTheme.findFirst({
        where: { nameZh: conn.related },
      });

      if (!theme || !relatedTheme) {
        console.log(`主题不存在: ${conn.theme} 或 ${conn.related}`);
        continue;
      }

      // 检查是否已存在（双向检查）
      const existing = await prisma.themeConnection.findFirst({
        where: {
          OR: [
            { themeId: theme.id, relatedThemeId: relatedTheme.id },
            { themeId: relatedTheme.id, relatedThemeId: theme.id },
          ],
        },
      });

      if (existing) {
        continue; // 已存在，跳过
      }

      await prisma.themeConnection.create({
        data: {
          themeId: theme.id,
          relatedThemeId: relatedTheme.id,
          connectionType: conn.type,
          strength: conn.strength,
        },
      });
      connCount++;
      console.log(`创建连接: ${conn.theme} --[${conn.type}]--> ${conn.related}`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.error(`创建连接失败:`, error.message);
      }
    }
  }
  console.log(`创建了 ${connCount} 个主题-主题连接`);

  // 3. 更新主题的经文计数
  console.log('\n--- 更新主题经文计数 ---');
  const themes = await prisma.bibleTheme.findMany();
  for (const theme of themes) {
    const count = await prisma.themeVerseLink.count({
      where: { themeId: theme.id },
    });
    if (count !== theme.verseCount) {
      await prisma.bibleTheme.update({
        where: { id: theme.id },
        data: { verseCount: count },
      });
      console.log(`更新 ${theme.nameZh} 经文计数: ${theme.verseCount} -> ${count}`);
    }
  }

  // 4. 更新主题的连接计数
  console.log('\n--- 更新主题连接计数 ---');
  for (const theme of themes) {
    const count = await prisma.themeConnection.count({
      where: {
        OR: [
          { themeId: theme.id },
          { relatedThemeId: theme.id },
        ],
      },
    });
    if (count !== theme.connectionCount) {
      await prisma.bibleTheme.update({
        where: { id: theme.id },
        data: { connectionCount: count },
      });
      console.log(`更新 ${theme.nameZh} 连接计数: ${theme.connectionCount} -> ${count}`);
    }
  }

  console.log('\n主题网络数据种子完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });