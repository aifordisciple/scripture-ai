const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seed() {
  console.log('开始导入数据...');
  const filePath = path.join(__dirname, '../data/bible_sample.json');
  const verses = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  for (const v of verses) {
    await prisma.bibleVerse.upsert({
      where: {
        bookId_chapter_verse_version: {
          bookId: v.book_id,
          chapter: v.chapter,
          verse: v.verse,
          version: 'CUV'
        }
      },
      update: {},
      create: {
        bookId: v.book_id,
        bookName: v.book_name,
        chapter: v.chapter,
        verse: v.verse,
        content: v.content,
        version: 'CUV'
      }
    });
  }
  console.log('导入完成！');
}

seed()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
