// scripts/convert-bible-version.ts
// Convert Bible version from JSON to database format

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BibleVerseInput {
  book: string;
  chapter: number;
  verses: { verse: number; text: string }[];
}

interface BibleJson {
  version: string;
  name: string;
  books: BibleVerseInput[];
}

async function convertAndImport(
  jsonPath: string,
  versionCode: string,
  versionName: string,
  language: string = 'zh'
) {
  console.log(`📖 Loading ${versionName}...`);
  
  const content = fs.readFileSync(jsonPath, 'utf-8');
  const bible: BibleJson = JSON.parse(content);
  
  // Check if version exists
  let version = await prisma.bibleVersion.findUnique({
    where: { code: versionCode }
  });
  
  if (!version) {
    version = await prisma.bibleVersion.create({
      data: {
        code: versionCode,
        name: versionName,
        language,
        isDefault: versionCode === 'CUV',
        isPublic: true
      }
    });
    console.log(`✅ Created version: ${versionCode}`);
  }
  
  console.log(`📝 Importing verses for ${versionCode}...`);
  
  // Import verses in batches
  const batchSize = 500;
  let totalImported = 0;
  
  for (const book of bible.books) {
    const bookName = book.book;
    const bookId = getBookId(bookName);
    
    for (let i = 0; i < book.verses.length; i += batchSize) {
      const batch = book.verses.slice(i, i + batchSize);
      
      await prisma.$executeRawUnsafe(`
        INSERT INTO bible_verses (book_id, book_name, chapter, verse, content, version)
        VALUES ${batch.map((v, idx) => 
          `($${(idx * 5) + 1}, $${(idx * 5) + 2}, $${(idx * 5) + 3}, $${(idx * 5) + 4}, $${(idx * 5) + 5}, '${versionCode}')`
        ).join(', ')}
        ON CONFLICT (book_id, chapter, verse, version) DO NOTHING
      `, batch.flatMap(v => [
        bookId, bookName, book.chapter, v.verse, v.text
      ]));
      
      totalImported += batch.length;
    }
    
    console.log(`  - ${bookName}: ${book.verses.length} verses`);
  }
  
  console.log(`✅ Imported ${totalImported} verses for ${versionCode}\n`);
}

function getBookId(bookName: string): string {
  const bookMap: Record<string, string> = {
    '创世记': 'Gen', '出埃及记': 'Exo', '利未记': 'Lev', '民数记': 'Num', '申命记': 'Deu',
    '约书亚记': 'Jos', '士师记': 'Jdg', '路得记': 'Rut', '撒母耳记上': '1Sa', '撒母耳记下': '2Sa',
    '列王纪上': '1Ki', '列王纪下': '2Ki', '历代志上': '1Ch', '历代志下': '2Ch', '以斯拉记': 'Ezr',
    '尼希米记': 'Neh', '以斯帖记': 'Est', '约伯记': 'Job', '诗篇': 'Psa', '箴言': 'Pro',
    '传道书': 'Ecc', '雅歌': 'Sng', '以赛亚书': 'Isa', '耶利米书': 'Jer', '耶利米哀歌': 'Lam',
    '以西结书': 'Eze', '但以理书': 'Dan', '何西阿书': 'Hos', '约珥书': 'Jol', '阿摩司书': 'Amo',
    '俄巴底亚书': 'Oba', '约拿书': 'Jon', '弥迦书': 'Mic', '那鸿书': 'Nah', '哈巴谷书': 'Hab',
    '西番雅书': 'Zep', '哈该书': 'Hag', '撒迦利亚书': 'Zec', '玛拉基书': 'Mal',
    '马太福音': 'Mat', '马可福音': 'Mrk', '路加福音': 'Luk', '约翰福音': 'Jhn', '使徒行传': 'Act',
    '罗马书': 'Rom', '哥林多前书': '1Co', '哥林多后书': '2Co', '加拉太书': 'Gal', '以弗所书': 'Eph',
    '腓立比书': 'Php', '歌罗西书': 'Col', '帖撒罗尼迦前书': '1Th', '帖撒罗尼迦后书': '2Th',
    '提摩太前书': '1Ti', '提摩太后书': '2Ti', '提多书': 'Tit', '腓利门书': 'Phm',
    '希伯来书': 'Heb', '雅各书': 'Jas', '彼得前书': '1Pe', '彼得后书': '2Pe', '约翰一书': '1Jn',
    '约翰二书': '2Jn', '约翰三书': '3Jn', '犹大书': 'Jud', '启示录': 'Rev'
  };
  
  return bookMap[bookName] || bookName.substring(0, 3).toUpperCase();
}

async function main() {
  const dataDir = path.join(process.cwd(), 'data');
  
  try {
    // Import CUV (simplified Chinese)
    const cuvPath = path.join(dataDir, 'ChiUn.json');
    if (fs.existsSync(cuvPath)) {
      await convertAndImport(cuvPath, 'CUV', '和合本', 'zh');
    }
    
    // Import KJV (English)
    const kjvPath = path.join(dataDir, 'KJV.json');
    if (fs.existsSync(kjvPath)) {
      await convertAndImport(kjvPath, 'KJV', 'King James Version', 'en');
    }
    
    console.log('🎉 All Bible versions imported successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
