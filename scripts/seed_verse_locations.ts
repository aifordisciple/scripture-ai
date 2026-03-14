// scripts/seed_verse_locations.ts
// 经文-地点预关联种子数据脚本
// 为高频章节预填充地点关联，减少AI依赖

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 经文-地点关联数据
// 格式: { bookId, chapter, verse, locationNameZh, mentionType }
const VERSE_LOCATION_DATA = [
  // ==================== 创世记 - 亚伯拉罕相关 ====================
  { bookId: 'Gen', chapter: 11, verse: 31, locationNameZh: '吾珥', mentionType: 'MENTIONED' },
  { bookId: 'Gen', chapter: 11, verse: 31, locationNameZh: '哈兰', mentionType: 'MENTIONED' },
  { bookId: 'Gen', chapter: 12, verse: 1, locationNameZh: '哈兰', mentionType: 'MENTIONED' },
  { bookId: 'Gen', chapter: 12, verse: 5, locationNameZh: '迦南', mentionType: 'MENTIONED' },
  { bookId: 'Gen', chapter: 12, verse: 6, locationNameZh: '示剑', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 12, verse: 8, locationNameZh: '伯特利', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 12, verse: 10, locationNameZh: '埃及', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Gen', chapter: 13, verse: 3, locationNameZh: '伯特利', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Gen', chapter: 13, verse: 18, locationNameZh: '希伯仑', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 14, verse: 17, locationNameZh: '沙微谷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 18, verse: 1, locationNameZh: '希伯仑', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 19, verse: 1, locationNameZh: '所多玛', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 22, verse: 2, locationNameZh: '摩利亚山', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 23, verse: 2, locationNameZh: '希伯仑', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 23, verse: 19, locationNameZh: '希伯仑', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 25, verse: 9, locationNameZh: '希伯仑', mentionType: 'EVENT_OCCURRED' },

  // ==================== 创世记 - 雅各相关 ====================
  { bookId: 'Gen', chapter: 28, verse: 10, locationNameZh: '别是巴', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Gen', chapter: 28, verse: 19, locationNameZh: '伯特利', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 32, verse: 2, locationNameZh: '玛哈念', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 32, verse: 30, locationNameZh: '毗努伊勒', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 33, verse: 18, locationNameZh: '示剑', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 35, verse: 27, locationNameZh: '希伯仑', mentionType: 'EVENT_OCCURRED' },

  // ==================== 创世记 - 约瑟相关 ====================
  { bookId: 'Gen', chapter: 37, verse: 14, locationNameZh: '希伯仑', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 37, verse: 17, locationNameZh: '多坍', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 37, verse: 36, locationNameZh: '埃及', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Gen', chapter: 41, verse: 41, locationNameZh: '埃及', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Gen', chapter: 46, verse: 1, locationNameZh: '别是巴', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Gen', chapter: 46, verse: 6, locationNameZh: '埃及', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Gen', chapter: 47, verse: 6, locationNameZh: '歌珊地', mentionType: 'EVENT_OCCURRED' },

  // ==================== 出埃及记 ====================
  { bookId: 'Exod', chapter: 1, verse: 11, locationNameZh: '兰塞', mentionType: 'MENTIONED' },
  { bookId: 'Exod', chapter: 12, verse: 37, locationNameZh: '兰塞', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Exod', chapter: 12, verse: 37, locationNameZh: '疏割', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Exod', chapter: 13, verse: 20, locationNameZh: '以倘', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Exod', chapter: 14, verse: 2, locationNameZh: '比哈希录', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Exod', chapter: 14, verse: 21, locationNameZh: '红海', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Exod', chapter: 15, verse: 23, locationNameZh: '玛拉', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Exod', chapter: 15, verse: 27, locationNameZh: '以琳', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Exod', chapter: 16, verse: 1, locationNameZh: '汛旷野', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Exod', chapter: 17, verse: 1, locationNameZh: '利非订', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Exod', chapter: 19, verse: 1, locationNameZh: '西奈山', mentionType: 'EVENT_OCCURRED' },

  // ==================== 民数记 ====================
  { bookId: 'Num', chapter: 11, verse: 35, locationNameZh: '基博罗哈他瓦', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Num', chapter: 13, verse: 26, locationNameZh: '加低斯', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Num', chapter: 20, verse: 1, locationNameZh: '加低斯', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Num', chapter: 22, verse: 1, locationNameZh: '摩押平原', mentionType: 'JOURNEY_POINT' },

  // ==================== 约书亚记 ====================
  { bookId: 'Josh', chapter: 3, verse: 1, locationNameZh: '什亭', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Josh', chapter: 3, verse: 17, locationNameZh: '约旦河', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Josh', chapter: 6, verse: 1, locationNameZh: '耶利哥', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Josh', chapter: 8, verse: 1, locationNameZh: '艾城', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Josh', chapter: 8, verse: 30, locationNameZh: '示剑', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Josh', chapter: 10, verse: 36, locationNameZh: '希伯仑', mentionType: 'EVENT_OCCURRED' },

  // ==================== 马太福音 ====================
  { bookId: 'Matt', chapter: 2, verse: 1, locationNameZh: '伯利恒', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Matt', chapter: 2, verse: 14, locationNameZh: '埃及', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Matt', chapter: 2, verse: 23, locationNameZh: '拿撒勒', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Matt', chapter: 3, verse: 13, locationNameZh: '约旦河', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Matt', chapter: 4, verse: 1, locationNameZh: '旷野', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Matt', chapter: 4, verse: 13, locationNameZh: '迦百农', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Matt', chapter: 14, verse: 25, locationNameZh: '加利利湖', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Matt', chapter: 16, verse: 13, locationNameZh: '该撒利亚腓立比', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Matt', chapter: 21, verse: 1, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Matt', chapter: 21, verse: 17, locationNameZh: '伯大尼', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Matt', chapter: 24, verse: 3, locationNameZh: '橄榄山', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Matt', chapter: 26, verse: 36, locationNameZh: '客西马尼园', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Matt', chapter: 27, verse: 33, locationNameZh: '各各他', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Matt', chapter: 28, verse: 1, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },

  // ==================== 马可福音 ====================
  { bookId: 'Mark', chapter: 1, verse: 9, locationNameZh: '拿撒勒', mentionType: 'MENTIONED' },
  { bookId: 'Mark', chapter: 1, verse: 9, locationNameZh: '约旦河', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Mark', chapter: 1, verse: 21, locationNameZh: '迦百农', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Mark', chapter: 4, verse: 1, locationNameZh: '加利利湖', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Mark', chapter: 5, verse: 1, locationNameZh: '格拉森', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Mark', chapter: 6, verse: 53, locationNameZh: '革尼撒勒', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Mark', chapter: 10, verse: 1, locationNameZh: '约旦河', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Mark', chapter: 11, verse: 1, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Mark', chapter: 14, verse: 32, locationNameZh: '客西马尼园', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Mark', chapter: 15, verse: 22, locationNameZh: '各各他', mentionType: 'EVENT_OCCURRED' },

  // ==================== 路加福音 ====================
  { bookId: 'Luke', chapter: 1, verse: 26, locationNameZh: '拿撒勒', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Luke', chapter: 2, verse: 4, locationNameZh: '伯利恒', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Luke', chapter: 2, verse: 25, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Luke', chapter: 2, verse: 41, locationNameZh: '耶路撒冷', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Luke', chapter: 4, verse: 16, locationNameZh: '拿撒勒', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Luke', chapter: 4, verse: 31, locationNameZh: '迦百农', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Luke', chapter: 5, verse: 1, locationNameZh: '加利利湖', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Luke', chapter: 7, verse: 11, locationNameZh: '拿因城', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Luke', chapter: 9, verse: 10, locationNameZh: '伯赛大', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Luke', chapter: 9, verse: 51, locationNameZh: '耶路撒冷', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Luke', chapter: 10, verse: 38, locationNameZh: '伯大尼', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Luke', chapter: 19, verse: 1, locationNameZh: '耶利哥', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Luke', chapter: 19, verse: 28, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Luke', chapter: 22, verse: 39, locationNameZh: '橄榄山', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Luke', chapter: 23, verse: 33, locationNameZh: '各各他', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Luke', chapter: 24, verse: 13, locationNameZh: '以马忤斯', mentionType: 'EVENT_OCCURRED' },

  // ==================== 约翰福音 ====================
  { bookId: 'John', chapter: 1, verse: 28, locationNameZh: '伯大尼', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 2, verse: 1, locationNameZh: '迦拿', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 2, verse: 13, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 3, verse: 23, locationNameZh: '哀嫩', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 4, verse: 5, locationNameZh: '叙加', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 4, verse: 5, locationNameZh: '示剑', mentionType: 'MENTIONED' },
  { bookId: 'John', chapter: 4, verse: 46, locationNameZh: '迦拿', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 5, verse: 2, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 6, verse: 1, locationNameZh: '加利利湖', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 6, verse: 17, locationNameZh: '迦百农', mentionType: 'JOURNEY_POINT' },
  { bookId: 'John', chapter: 7, verse: 10, locationNameZh: '耶路撒冷', mentionType: 'JOURNEY_POINT' },
  { bookId: 'John', chapter: 8, verse: 1, locationNameZh: '橄榄山', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 9, verse: 1, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 10, verse: 40, locationNameZh: '约旦河', mentionType: 'JOURNEY_POINT' },
  { bookId: 'John', chapter: 11, verse: 1, locationNameZh: '伯大尼', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 12, verse: 1, locationNameZh: '伯大尼', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 18, verse: 1, locationNameZh: '汲沦溪', mentionType: 'JOURNEY_POINT' },
  { bookId: 'John', chapter: 18, verse: 1, locationNameZh: '客西马尼园', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 19, verse: 17, locationNameZh: '各各他', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 20, verse: 1, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'John', chapter: 21, verse: 1, locationNameZh: '加利利湖', mentionType: 'EVENT_OCCURRED' },

  // ==================== 使徒行传 ====================
  { bookId: 'Acts', chapter: 1, verse: 12, locationNameZh: '橄榄山', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 2, verse: 1, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 3, verse: 1, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 7, verse: 58, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 8, verse: 5, locationNameZh: '撒马利亚', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 8, verse: 26, locationNameZh: '迦萨', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 8, verse: 40, locationNameZh: '该撒利亚', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 9, verse: 3, locationNameZh: '大马士革', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 9, verse: 32, locationNameZh: '吕大', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 9, verse: 36, locationNameZh: '约帕', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 10, verse: 1, locationNameZh: '该撒利亚', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 11, verse: 19, locationNameZh: '安提阿', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 13, verse: 1, locationNameZh: '安提阿', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 13, verse: 4, locationNameZh: '居比路', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 13, verse: 13, locationNameZh: '别加', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 13, verse: 14, locationNameZh: '彼西底安提阿', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 14, verse: 1, locationNameZh: '以哥念', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 14, verse: 8, locationNameZh: '路司得', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 14, verse: 20, locationNameZh: '特庇', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 15, verse: 36, locationNameZh: '安提阿', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 16, verse: 1, locationNameZh: '特庇', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 16, verse: 1, locationNameZh: '路司得', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 16, verse: 8, locationNameZh: '特罗亚', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 16, verse: 12, locationNameZh: '腓立比', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 17, verse: 1, locationNameZh: '帖撒罗尼迦', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 17, verse: 10, locationNameZh: '庇哩亚', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 17, verse: 16, locationNameZh: '雅典', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 18, verse: 1, locationNameZh: '哥林多', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 18, verse: 19, locationNameZh: '以弗所', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 18, verse: 22, locationNameZh: '耶路撒冷', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 18, verse: 22, locationNameZh: '安提阿', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 19, verse: 1, locationNameZh: '以弗所', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 20, verse: 6, locationNameZh: '特罗亚', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 20, verse: 17, locationNameZh: '米利都', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 21, verse: 8, locationNameZh: '该撒利亚', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 21, verse: 17, locationNameZh: '耶路撒冷', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 23, verse: 33, locationNameZh: '该撒利亚', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 27, verse: 5, locationNameZh: '每拉', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 27, verse: 8, locationNameZh: '佳澳', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 28, verse: 1, locationNameZh: '马耳他', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Acts', chapter: 28, verse: 12, locationNameZh: '叙拉古', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 28, verse: 13, locationNameZh: '部丢利', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Acts', chapter: 28, verse: 16, locationNameZh: '罗马', mentionType: 'EVENT_OCCURRED' },

  // ==================== 其他需要补充的地点 ====================
  { bookId: 'Gen', chapter: 4, verse: 16, locationNameZh: '挪得', mentionType: 'MENTIONED' },
  { bookId: 'Gen', chapter: 10, verse: 10, locationNameZh: '巴比伦', mentionType: 'MENTIONED' },
  { bookId: 'Gen', chapter: 10, verse: 19, locationNameZh: '所多玛', mentionType: 'MENTIONED' },
  { bookId: 'Gen', chapter: 10, verse: 19, locationNameZh: '蛾摩拉', mentionType: 'MENTIONED' },
  { bookId: 'Gen', chapter: 14, verse: 1, locationNameZh: '示拿', mentionType: 'MENTIONED' },
  { bookId: 'Gen', chapter: 36, verse: 31, locationNameZh: '以东', mentionType: 'MENTIONED' },
  { bookId: 'Exod', chapter: 3, verse: 1, locationNameZh: '西奈山', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Num', chapter: 21, verse: 1, locationNameZh: '南地', mentionType: 'MENTIONED' },
  { bookId: 'Deut', chapter: 34, verse: 1, locationNameZh: '尼波山', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Josh', chapter: 18, verse: 1, locationNameZh: '示罗', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Judg', chapter: 1, verse: 19, locationNameZh: '迦南', mentionType: 'MENTIONED' },
  { bookId: 'Judg', chapter: 6, verse: 11, locationNameZh: '俄弗拉', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Ruth', chapter: 1, verse: 1, locationNameZh: '伯利恒', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Ruth', chapter: 1, verse: 1, locationNameZh: '摩押', mentionType: 'MENTIONED' },
  { bookId: '1Sam', chapter: 1, verse: 3, locationNameZh: '示罗', mentionType: 'EVENT_OCCURRED' },
  { bookId: '1Sam', chapter: 16, verse: 1, locationNameZh: '伯利恒', mentionType: 'EVENT_OCCURRED' },
  { bookId: '1Sam', chapter: 17, verse: 1, locationNameZh: '梭哥', mentionType: 'EVENT_OCCURRED' },
  { bookId: '2Sam', chapter: 2, verse: 1, locationNameZh: '希伯仑', mentionType: 'EVENT_OCCURRED' },
  { bookId: '2Sam', chapter: 5, verse: 7, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: '1Kgs', chapter: 3, verse: 4, locationNameZh: '基遍', mentionType: 'EVENT_OCCURRED' },
  { bookId: '1Kgs', chapter: 6, verse: 1, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: '2Kgs', chapter: 17, verse: 6, locationNameZh: '亚述', mentionType: 'MENTIONED' },
  { bookId: '2Kgs', chapter: 25, verse: 11, locationNameZh: '巴比伦', mentionType: 'MENTIONED' },
  { bookId: 'Ezra', chapter: 1, verse: 3, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Neh', chapter: 2, verse: 1, locationNameZh: '书珊城', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Esth', chapter: 1, verse: 2, locationNameZh: '书珊城', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Dan', chapter: 1, verse: 1, locationNameZh: '耶路撒冷', mentionType: 'EVENT_OCCURRED' },
  { bookId: 'Dan', chapter: 1, verse: 1, locationNameZh: '巴比伦', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Jonah', chapter: 1, verse: 3, locationNameZh: '他施', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Jonah', chapter: 1, verse: 3, locationNameZh: '约帕', mentionType: 'JOURNEY_POINT' },
  { bookId: 'Mic', chapter: 5, verse: 2, locationNameZh: '伯利恒', mentionType: 'MENTIONED' },
  { bookId: 'Zech', chapter: 9, verse: 9, locationNameZh: '耶路撒冷', mentionType: 'MENTIONED' },
  { bookId: 'Mal', chapter: 1, verse: 1, locationNameZh: '以色列', mentionType: 'MENTIONED' },
];

// 需要补充的地点
const ADDITIONAL_LOCATIONS = [
  {
    nameZh: '客西马尼园',
    nameEn: 'Garden of Gethsemane',
    nameOriginal: 'Γεθσημανή',
    aliases: ['客西马尼'],
    latitude: 31.7783,
    longitude: 35.2411,
    region: '耶路撒冷',
    modernCountry: '以色列',
    description: '位于橄榄山脚下，耶稣在此祷告。',
    significance: '耶稣在受难前在此痛苦祷告，被犹大出卖被捕。',
  },
  {
    nameZh: '各各他',
    nameEn: 'Golgotha',
    nameOriginal: 'Γολγοθᾶ',
    aliases: ['骷髅地', '加略山'],
    latitude: 31.7780,
    longitude: 35.2297,
    region: '耶路撒冷',
    modernCountry: '以色列',
    description: '耶稣被钉十字架的地方，位于耶路撒冷城外。',
    significance: '耶稣在此为世人的罪被钉十字架。',
  },
  {
    nameZh: '迦南',
    nameEn: 'Canaan',
    nameOriginal: 'כְּנַעַן',
    aliases: ['应许之地'],
    latitude: 32.0000,
    longitude: 35.0000,
    region: '迦南',
    modernCountry: '以色列/巴勒斯坦',
    description: '神应许给亚伯拉罕及其后裔的土地。',
    significance: '以色列人出埃及后进入此地，是神赐给他们的产业。',
  },
  {
    nameZh: '所多玛',
    nameEn: 'Sodom',
    nameOriginal: 'סְדֹם',
    aliases: [],
    latitude: 31.2500,
    longitude: 35.4000,
    region: '死海附近',
    modernCountry: '以色列',
    description: '位于死海南部的古城，因罪恶被神毁灭。',
    significance: '罗得住在此城，神降火烧灭此城。耶稣以此城为警戒。',
  },
  {
    nameZh: '蛾摩拉',
    nameEn: 'Gomorrah',
    nameOriginal: 'עֲמֹרָה',
    aliases: [],
    latitude: 31.2000,
    longitude: 35.4500,
    region: '死海附近',
    modernCountry: '以色列',
    description: '与所多玛一同被毁灭的城。',
    significance: '因罪恶甚重，与所多玛一同被神毁灭。',
  },
  {
    nameZh: '摩利亚山',
    nameEn: 'Mount Moriah',
    nameOriginal: 'הַר הַמֹּרִיָּה',
    aliases: ['圣殿山'],
    latitude: 31.7780,
    longitude: 35.2356,
    region: '耶路撒冷',
    modernCountry: '以色列',
    description: '亚伯拉罕献以撒的地方，后来圣殿建在此山上。',
    significance: '亚伯拉罕在此献以撒。所罗门在此建圣殿。',
  },
  {
    nameZh: '沙微谷',
    nameEn: 'Valley of Shaveh',
    nameOriginal: 'עֵמֶק שָׁוֵה',
    aliases: ['王谷'],
    latitude: 31.7500,
    longitude: 35.1500,
    region: '犹大',
    modernCountry: '以色列',
    description: '亚伯拉罕战胜四王后，撒冷王麦基洗德在此迎接他。',
    significance: '麦基洗德在此为亚伯拉罕祝福。',
  },
  {
    nameZh: '挪得',
    nameEn: 'Nod',
    nameOriginal: 'נוֹד',
    aliases: [],
    latitude: 33.0000,
    longitude: 44.0000,
    region: '伊甸东边',
    modernCountry: '不详',
    description: '该隐杀亚伯后流放之地。',
    significance: '该隐在此地流浪，远离神的面。',
  },
  {
    nameZh: '示拿',
    nameEn: 'Shinar',
    nameOriginal: 'שִׁנְעָר',
    aliases: ['巴比伦'],
    latitude: 32.5000,
    longitude: 44.5000,
    region: '巴比伦',
    modernCountry: '伊拉克',
    description: '巴别塔建造的地方。',
    significance: '人在此建造巴别塔，神变乱他们的口音。',
  },
  {
    nameZh: '以东',
    nameEn: 'Edom',
    nameOriginal: 'אֱדוֹם',
    aliases: ['西珥'],
    latitude: 30.5000,
    longitude: 35.5000,
    region: '以东',
    modernCountry: '约旦',
    description: '以扫的后代居住的地方。',
    significance: '以色列人出埃及时不准经过此地。俄巴底亚书预言其灭亡。',
  },
  {
    nameZh: '尼波山',
    nameEn: 'Mount Nebo',
    nameOriginal: 'הַר נְבוֹ',
    aliases: ['毗斯迦山'],
    latitude: 31.7697,
    longitude: 35.7208,
    region: '摩押',
    modernCountry: '约旦',
    description: '摩西观看应许之地的地方。',
    significance: '摩西在此观看迦南地后去世。',
  },
  {
    nameZh: '俄弗拉',
    nameEn: 'Ophrah',
    nameOriginal: 'עָפְרָה',
    aliases: [],
    latitude: 32.1000,
    longitude: 35.3000,
    region: '玛拿西',
    modernCountry: '以色列',
    description: '基甸的家乡。',
    significance: '神在此向基甸显现，呼召他拯救以色列人。',
  },
  {
    nameZh: '梭哥',
    nameEn: 'Socoh',
    nameOriginal: 'שׂוֹכֹה',
    aliases: [],
    latitude: 31.7167,
    longitude: 35.0000,
    region: '犹大',
    modernCountry: '以色列',
    description: '犹大低地的城市。',
    significance: '非利士人歌利亚在此向以色列军队挑战。',
  },
  {
    nameZh: '基遍',
    nameEn: 'Gibeon',
    nameOriginal: 'גִּבְעוֹן',
    aliases: [],
    latitude: 31.8500,
    longitude: 35.1833,
    region: '便雅悯',
    modernCountry: '巴勒斯坦',
    description: '基遍人用计与约书亚立约的地方。',
    significance: '所罗门在此求智慧。日头在此停住。',
  },
  {
    nameZh: '亚述',
    nameEn: 'Assyria',
    nameOriginal: 'אַשּׁוּר',
    aliases: [],
    latitude: 36.5000,
    longitude: 43.5000,
    region: '亚述',
    modernCountry: '伊拉克',
    description: '古代近东的强国。',
    significance: '亚述灭亡了北国以色列，将百姓掳走。',
  },
  {
    nameZh: '他施',
    nameEn: 'Tarshish',
    nameOriginal: 'תַּרְשִׁישׁ',
    aliases: [],
    latitude: 36.0000,
    longitude: -5.5000,
    region: '西班牙',
    modernCountry: '西班牙',
    description: '地中海西端的地方。',
    significance: '约拿逃往他施躲避神的呼召。',
  },
  {
    nameZh: '迦萨',
    nameEn: 'Gaza',
    nameOriginal: 'עַזָּה',
    aliases: [],
    latitude: 31.5000,
    longitude: 34.4667,
    region: '非利士',
    modernCountry: '巴勒斯坦',
    description: '非利士人的主要城市之一。',
    significance: '腓利在此向埃塞俄比亚太监传道。',
  },
  {
    nameZh: '吕大',
    nameEn: 'Lydda',
    nameOriginal: 'Λύδδα',
    aliases: ['罗德'],
    latitude: 31.9500,
    longitude: 34.9000,
    region: '犹大',
    modernCountry: '以色列',
    description: '耶路撒冷以西的城市。',
    significance: '彼得在此医治以尼雅。',
  },
  {
    nameZh: '约帕',
    nameEn: 'Joppa',
    nameOriginal: 'יָפוֹ',
    aliases: ['雅法', '特拉维夫'],
    latitude: 32.0500,
    longitude: 34.7500,
    region: '犹大',
    modernCountry: '以色列',
    description: '地中海沿岸的港口城市。',
    significance: '彼得在此使多加复活，在此看见大布的异象。',
  },
  {
    nameZh: '格拉森',
    nameEn: 'Gerasa',
    nameOriginal: 'Γέρασα',
    aliases: ['加大拉'],
    latitude: 32.4333,
    longitude: 35.9000,
    region: '低加波利',
    modernCountry: '约旦',
    description: '加利利湖东岸的城市。',
    significance: '耶稣在此医治被鬼附的人，鬼进入猪群投海。',
  },
  {
    nameZh: '革尼撒勒',
    nameEn: 'Gennesaret',
    nameOriginal: 'Γεννησαρέτ',
    aliases: [],
    latitude: 32.8667,
    longitude: 35.5167,
    region: '加利利',
    modernCountry: '以色列',
    description: '加利利湖西北岸的平原。',
    significance: '耶稣在此医治许多病人。',
  },
  {
    nameZh: '伯赛大',
    nameEn: 'Bethsaida',
    nameOriginal: 'בֵּית צַיְדָא',
    aliases: [],
    latitude: 32.9167,
    longitude: 35.6167,
    region: '加利利',
    modernCountry: '以色列',
    description: '加利利湖东北岸的城市。',
    significance: '彼得、安得烈、腓力的家乡。耶稣在此医治瞎子。',
  },
  {
    nameZh: '哀嫩',
    nameEn: 'Aenon',
    nameOriginal: 'Αινών',
    aliases: [],
    latitude: 32.4000,
    longitude: 35.5000,
    region: '撒马利亚',
    modernCountry: '巴勒斯坦',
    description: '撒马利亚地区的水泉。',
    significance: '施洗约翰在此施洗。',
  },
  {
    nameZh: '汲沦溪',
    nameEn: 'Kidron Valley',
    nameOriginal: 'נַחַל קִדְרוֹן',
    aliases: ['汲沦谷'],
    latitude: 31.7750,
    longitude: 35.2400,
    region: '耶路撒冷',
    modernCountry: '以色列',
    description: '耶路撒冷东面的山谷。',
    significance: '耶稣过此谷到客西马尼园。',
  },
];

async function main() {
  console.log('开始种子经文-地点关联数据...\n');

  // 步骤1：添加额外的地点
  console.log('=== 步骤1：添加额外地点 ===');
  for (const location of ADDITIONAL_LOCATIONS) {
    try {
      const created = await prisma.bibleLocation.create({
        data: location,
      });
      console.log(`创建地点: ${created.nameZh}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`地点已存在: ${location.nameZh}`);
      } else {
        console.error(`创建地点失败 ${location.nameZh}:`, error.message);
      }
    }
  }

  // 步骤2：获取所有地点的映射
  console.log('\n=== 步骤2：获取地点映射 ===');
  const locations = await prisma.bibleLocation.findMany();
  const locationMap = new Map<string, string>();
  for (const loc of locations) {
    locationMap.set(loc.nameZh, loc.id);
  }
  console.log(`找到 ${locations.length} 个地点`);

  // 步骤3：创建经文-地点关联
  console.log('\n=== 步骤3：创建经文-地点关联 ===');
  let created = 0;
  let skipped = 0;
  let notFound = 0;

  for (const vl of VERSE_LOCATION_DATA) {
    const locationId = locationMap.get(vl.locationNameZh);
    if (!locationId) {
      console.log(`  警告：找不到地点 "${vl.locationNameZh}"`);
      notFound++;
      continue;
    }

    try {
      await prisma.bibleVerseLocation.create({
        data: {
          locationId,
          bookId: vl.bookId,
          chapter: vl.chapter,
          verse: vl.verse,
          mentionType: vl.mentionType,
        },
      });
      created++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        skipped++;
      } else {
        console.error(`创建关联失败 ${vl.bookId} ${vl.chapter}:${vl.verse}:`, error.message);
      }
    }
  }

  // 统计
  const totalAssociations = await prisma.bibleVerseLocation.count();
  const totalLocations = await prisma.bibleLocation.count();

  console.log('\n=== 经文-地点关联种子完成 ===');
  console.log(`创建: ${created}`);
  console.log(`跳过(已存在): ${skipped}`);
  console.log(`地点未找到: ${notFound}`);
  console.log(`总关联数: ${totalAssociations}`);
  console.log(`总地点数: ${totalLocations}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });