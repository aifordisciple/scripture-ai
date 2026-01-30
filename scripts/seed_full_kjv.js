// scripts/seed_kjv.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// 书卷名映射：KJV 英文名 -> 数据库 ID (必须与 seed_full.js 中的 ID 一致)
const BOOK_NAME_MAP = {
  // Pentateuch
  "Genesis": "Gen", "Exodus": "Exo", "Leviticus": "Lev", "Numbers": "Num", "Deuteronomy": "Deu",
  // History
  "Joshua": "Jos", "Judges": "Jdg", "Ruth": "Rut",
  "1 Samuel": "1Sa", "I Samuel": "1Sa", "2 Samuel": "2Sa", "II Samuel": "2Sa",
  "1 Kings": "1Ki", "I Kings": "1Ki", "2 Kings": "2Ki", "II Kings": "2Ki",
  "1 Chronicles": "1Ch", "I Chronicles": "1Ch", "2 Chronicles": "2Ch", "II Chronicles": "2Ch",
  "Ezra": "Ezr", "Nehemiah": "Neh", "Esther": "Est",
  // Wisdom
  "Job": "Job", "Psalms": "Psa", "Proverbs": "Pro", "Ecclesiastes": "Ecc", "Song of Solomon": "Sng", "Song of Songs": "Sng",
  // Major Prophets
  "Isaiah": "Isa", "Jeremiah": "Jer", "Lamentations": "Lam", "Ezekiel": "Eze", "Daniel": "Dan",
  // Minor Prophets
  "Hosea": "Hos", "Joel": "Jol", "Amos": "Amo", "Obadiah": "Oba", "Jonah": "Jon", "Micah": "Mic", 
  "Nahum": "Nah", "Habakkuk": "Hab", "Zephaniah": "Zep", "Haggai": "Hag", "Zechariah": "Zec", "Malachi": "Mal",
  // Gospels
  "Matthew": "Mat", "Mark": "Mrk", "Luke": "Luk", "John": "Jhn",
  // History
  "Acts": "Act", "The Acts": "Act",
  // Pauline Epistles
  "Romans": "Rom", 
  "1 Corinthians": "1Co", "I Corinthians": "1Co", "2 Corinthians": "2Co", "II Corinthians": "2Co",
  "Galatians": "Gal", "Ephesians": "Eph", "Philippians": "Php", "Colossians": "Col",
  "1 Thessalonians": "1Th", "I Thessalonians": "1Th", "2 Thessalonians": "2Th", "II Thessalonians": "2Th",
  "1 Timothy": "1Ti", "I Timothy": "1Ti", "2 Timothy": "2Ti", "II Timothy": "2Ti",
  "Titus": "Tit", "Philemon": "Phm",
  // General Epistles
  "Hebrews": "Heb", "James": "Jas",
  "1 Peter": "1Pe", "I Peter": "1Pe", "2 Peter": "2Pe", "II Peter": "2Pe",
  "1 John": "1Jn", "I John": "1Jn", "2 John": "2Jn", "II John": "2Jn", "3 John": "3Jn", "III John": "3Jn",
  "Jude": "Jud", 
  // Prophecy
  "Revelation": "Rev"
};

async function main() {
  console.log('🚀 开始 KJV 英文圣经导入程序...');

  const filePath = path.join(__dirname, '../data/KJV.json');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 错误：找不到文件 ${filePath}`);
    process.exit(1);
  }

  console.log('📖 读取 KJV 文件...');
  // 读取大文件时建议使用流，但为了简单起见，这里直接读取（注意 Node.js 内存限制）
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const jsonData = JSON.parse(rawData);

  console.log(`ℹ️ 版本信息: ${jsonData.translation}`);

  const versesToInsert = [];
  let skippedBooks = [];

  console.log('🔄 解析数据结构...');

  // 1. 遍历每一卷书
  for (const book of jsonData.books) {
    const bookName = book.name.trim();
    const bookId = BOOK_NAME_MAP[bookName];

    if (!bookId) {
      skippedBooks.push(bookName);
      continue;
    }

    // 2. 遍历每一章
    // 你的 JSON 结构: "chapters": [ { "chapter": 1, "verses": [...] }, ... ]
    for (const chapterObj of book.chapters) {
      const chapterNum = chapterObj.chapter;

      // 3. 遍历每一节
      // 你的 JSON 结构: "verses": [ { "verse": 1, "text": "..." }, ... ]
      for (const verseObj of chapterObj.verses) {
        versesToInsert.push({
          bookId: bookId,
          bookName: bookName, // 这里存英文名，如 "Genesis"
          chapter: chapterNum,
          verse: verseObj.verse,
          content: verseObj.text,
          version: 'KJV' // ⚠️ 标记为 KJV 版本
        });
      }
    }
  }

  if (skippedBooks.length > 0) {
    console.warn('⚠️ 跳过未知书卷:', skippedBooks.join(', '));
  }

  console.log(`✅ 解析完成，准备插入 ${versesToInsert.length} 节 KJV 经文`);
  console.log('💾 正在写入数据库...');

  // 1. 清理旧 KJV 数据
  await prisma.bibleVerse.deleteMany({ where: { version: 'KJV' } });
  console.log('🧹 已清理旧 KJV 数据');

  // 2. 批量插入
  const batchSize = 2000;
  for (let i = 0; i < versesToInsert.length; i += batchSize) {
    const batch = versesToInsert.slice(i, i + batchSize);
    await prisma.bibleVerse.createMany({
      data: batch,
      skipDuplicates: true
    });
    process.stdout.write(`\r...进度: ${Math.min(i + batchSize, versesToInsert.length)} / ${versesToInsert.length}`);
  }

  console.log('\n\n🎉 KJV 导入成功！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });