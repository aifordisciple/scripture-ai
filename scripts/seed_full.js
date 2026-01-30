// scripts/seed_full.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// 完整的书卷映射表：英文名 -> [ID, 中文名]
// 必须确保 JSON 里的 name 能在这里找到对应的 Key
// scripts/seed_full.js 中需要替换的部分

const BOOK_MAP = {
  // --- 旧约 ---
  "Genesis": { id: "Gen", name: "创世记" },
  "Exodus": { id: "Exo", name: "出埃及记" },
  "Leviticus": { id: "Lev", name: "利未记" },
  "Numbers": { id: "Num", name: "民数记" },
  "Deuteronomy": { id: "Deu", name: "申命记" },
  "Joshua": { id: "Jos", name: "约书亚记" },
  "Judges": { id: "Jdg", name: "士师记" },
  "Ruth": { id: "Rut", name: "路得记" },
  
  // 修正：罗马数字 I, II
  "I Samuel": { id: "1Sa", name: "撒母耳记上" },
  "II Samuel": { id: "2Sa", name: "撒母耳记下" },
  "I Kings": { id: "1Ki", name: "列王纪上" },
  "II Kings": { id: "2Ki", name: "列王纪下" },
  "I Chronicles": { id: "1Ch", name: "历代志上" },
  "II Chronicles": { id: "2Ch", name: "历代志下" },
  
  "Ezra": { id: "Ezr", name: "以斯拉记" },
  "Nehemiah": { id: "Neh", name: "尼希米记" },
  "Esther": { id: "Est", name: "以斯帖记" },
  "Job": { id: "Job", name: "约伯记" },
  "Psalms": { id: "Psa", name: "诗篇" },
  "Proverbs": { id: "Pro", name: "箴言" },
  "Ecclesiastes": { id: "Ecc", name: "传道书" },
  "Song of Songs": { id: "Sng", name: "雅歌" },
  "Isaiah": { id: "Isa", name: "以赛亚书" },
  "Jeremiah": { id: "Jer", name: "耶利米书" },
  "Lamentations": { id: "Lam", name: "耶利米哀歌" },
  "Ezekiel": { id: "Eze", name: "以西结书" },
  "Daniel": { id: "Dan", name: "但以理书" },
  "Hosea": { id: "Hos", name: "何西阿书" },
  "Joel": { id: "Jol", name: "约珥书" },
  "Amos": { id: "Amo", name: "阿摩司书" },
  "Obadiah": { id: "Oba", name: "俄巴底亚书" },
  "Jonah": { id: "Jon", name: "约拿书" },
  "Micah": { id: "Mic", name: "弥迦书" },
  "Nahum": { id: "Nah", name: "那鸿书" },
  "Habakkuk": { id: "Hab", name: "哈巴谷书" },
  "Zephaniah": { id: "Zep", name: "西番雅书" },
  "Haggai": { id: "Hag", name: "哈该书" },
  "Zechariah": { id: "Zec", name: "撒迦利亚书" },
  "Malachi": { id: "Mal", name: "玛拉基书" },

  // --- 新约 ---
  "Matthew": { id: "Mat", name: "马太福音" },
  "Mark": { id: "Mrk", name: "马可福音" },
  "Luke": { id: "Luk", name: "路加福音" },
  "John": { id: "Jhn", name: "约翰福音" },
  "Acts": { id: "Act", name: "使徒行传" },
  "Romans": { id: "Rom", name: "罗马书" },
  
  // 修正：罗马数字 I, II
  "I Corinthians": { id: "1Co", name: "哥林多前书" },
  "II Corinthians": { id: "2Co", name: "哥林多后书" },
  "Galatians": { id: "Gal", name: "加拉太书" },
  "Ephesians": { id: "Eph", name: "以弗所书" },
  "Philippians": { id: "Php", name: "腓立比书" },
  "Colossians": { id: "Col", name: "歌罗西书" },
  "I Thessalonians": { id: "1Th", name: "帖撒罗尼迦前书" },
  "II Thessalonians": { id: "2Th", name: "帖撒罗尼迦后书" },
  "I Timothy": { id: "1Ti", name: "提摩太前书" },
  "II Timothy": { id: "2Ti", name: "提摩太后书" },
  "Titus": { id: "Tit", name: "提多书" },
  "Philemon": { id: "Phm", name: "腓利门书" },
  "Hebrews": { id: "Heb", name: "希伯来书" },
  "James": { id: "Jas", name: "雅各书" },
  "I Peter": { id: "1Pe", name: "彼得前书" },
  "II Peter": { id: "2Pe", name: "彼得后书" },
  "I John": { id: "1Jn", name: "约翰一书" },
  "II John": { id: "2Jn", name: "约翰二书" },
  
  // 修正：罗马数字 III
  "III John": { id: "3Jn", name: "约翰三书" },
  "Jude": { id: "Jud", name: "犹大书" },
  
  // 修正：特殊书卷名
  "Revelation of John": { id: "Rev", name: "启示录" },
  "Revelation": { id: "Rev", name: "启示录" } // 保留这个以防万一
};

async function main() {
  console.log('🚀 开始全本圣经导入程序...');

  // 1. 读取 JSON 文件
  // 请确保文件名大小写正确
  const filePath = path.join(__dirname, '../data/ChiUnJian.json'); 
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 错误：找不到文件 ${filePath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const jsonData = JSON.parse(rawData);
  
  console.log(`📖 读取成功，翻译版本: ${jsonData.translation}`);

  // 2. 转换数据格式
  const versesToInsert = [];
  let unknownBooks = [];

  console.log('🔄 正在处理数据结构...');

  // 遍历每一卷书
  for (const book of jsonData.books) {
    const mapInfo = BOOK_MAP[book.name];

    if (!mapInfo) {
      unknownBooks.push(book.name);
      console.warn(`⚠️ 警告：跳过未知书卷 "${book.name}" (请检查 BOOK_MAP)`);
      continue;
    }

    // 遍历每一章
    for (const chapter of book.chapters) {
      // 遍历每一节
      for (const verse of chapter.verses) {
        
        // 清洗文本：去掉多余的空格
        // 原文: "起初，　神 创造 天 地。" -> "起初，神创造天地。"
        const cleanContent = verse.text.replace(/\s+/g, '').trim();

        versesToInsert.push({
          bookId: mapInfo.id,
          bookName: mapInfo.name,
          chapter: chapter.chapter,
          verse: verse.verse,
          content: cleanContent,
          version: 'CUV' // 统一标记为和合本
        });
      }
    }
  }

  if (unknownBooks.length > 0) {
    console.log('❓ 未识别的书卷:', unknownBooks);
  }

  console.log(`✅ 数据处理完成，共准备插入 ${versesToInsert.length} 节经文。`);

  // 3. 批量插入数据库
  // 使用 createMany 提高性能 (比一条条插快得多)
  
  console.log('💾 正在写入数据库 (这可能需要几秒钟)...');

  // 为了安全，我们可以先清空 CUV 版本的数据（防止重复堆积）
  // 如果你想保留之前的数据，注释掉下面这行
  await prisma.bibleVerse.deleteMany({ where: { version: 'CUV' } });
  console.log('🧹 已清空旧的 CUV 数据');

  // Prisma createMany 
  const batchSize = 1000; // 分批插入，防止内存溢出
  for (let i = 0; i < versesToInsert.length; i += batchSize) {
    const batch = versesToInsert.slice(i, i + batchSize);
    await prisma.bibleVerse.createMany({
      data: batch,
      skipDuplicates: true // 如果有重复的就跳过
    });
    process.stdout.write(`\r...已插入 ${Math.min(i + batchSize, versesToInsert.length)} / ${versesToInsert.length}`);
  }

  console.log('\n🎉 全本圣经导入成功！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
