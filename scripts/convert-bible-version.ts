// scripts/convert-bible-version.ts
// Utility script to convert Bible verse data between versions
// Usage: npx tsx scripts/convert-bible-version.ts --from CUV --to KJV --input data.json

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const fromVersion = args[args.indexOf('--from') + 1] || 'CUV';
  const toVersion = args[args.indexOf('--to') + 1] || 'KJV';
  const inputFile = args[args.indexOf('--input') + 1];

  if (!inputFile) {
    console.error('Usage: npx tsx scripts/convert-bible-version.ts --from CUV --to KJV --input data.json');
    process.exit(1);
  }

  console.log(`Converting from ${fromVersion} to ${toVersion}...`);

  // Read input file
  const fs = await import('fs');
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

  if (!Array.isArray(data)) {
    console.error('Input file must contain an array of verses');
    process.exit(1);
  }

  // Prepare verses for insertion
  const verses = data.map((v: any) => ({
    bookId: v.bookId || v.book,
    bookName: v.bookName || v.book,
    chapter: v.chapter,
    verse: v.verse,
    content: v.content,
    version: toVersion,
  }));

  // Insert in batches
  const BATCH_SIZE = 1000;
  let inserted = 0;
  for (let i = 0; i < verses.length; i += BATCH_SIZE) {
    const batch = verses.slice(i, i + BATCH_SIZE);
    await prisma.bibleVerse.createMany({ data: batch });
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${verses.length} verses`);
  }

  console.log(`Done! Inserted ${inserted} verses for version ${toVersion}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());