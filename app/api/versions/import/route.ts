// app/api/versions/import/route.ts
// Bible version import API - Import custom Bible versions

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/versions/import - Import Bible version from JSON
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const code = formData.get('code') as string;
    const name = formData.get('name') as string;
    const nameEn = formData.get('nameEn') as string | null;
    const language = formData.get('language') as string || 'zh';

    if (!file || !code || !name) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, code, name' 
      }, { status: 400 });
    }

    // Read file content
    const text = await file.text();
    let bibleData: Array<{
      book: string;
      bookId: string;
      chapter: number;
      verse: number;
      content: string;
    }>;

    try {
      bibleData = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    // Validate structure
    if (!Array.isArray(bibleData) || bibleData.length === 0) {
      return NextResponse.json({ error: 'Invalid Bible data format' }, { status: 400 });
    }

    // Check first item
    const firstVerse = bibleData[0];
    if (!firstVerse.book || !firstVerse.chapter || !firstVerse.verse || !firstVerse.content) {
      return NextResponse.json({ 
        error: 'Invalid verse structure. Required: book, chapter, verse, content' 
      }, { status: 400 });
    }

    // Check if version already exists
    const existing = await prisma.bibleVersion.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json({ 
        error: `Version ${code} already exists. Delete it first or use a different code.` 
      }, { status: 409 });
    }

    // Create version record
    const version = await prisma.bibleVersion.create({
      data: {
        code,
        name,
        nameEn,
        language,
        isPublic: false, // Custom versions are private by default
      },
    });

    // Prepare verses for bulk insert
    const verses = bibleData.map((v, index) => ({
      bookId: v.bookId || v.book,
      bookName: v.book,
      chapter: v.chapter,
      verse: v.verse,
      content: v.content,
      version: code,
    }));

    // Insert verses in batches
    const BATCH_SIZE = 1000;
    for (let i = 0; i < verses.length; i += BATCH_SIZE) {
      const batch = verses.slice(i, i + BATCH_SIZE);
      await prisma.bibleVerse.createMany({
        data: batch,
      });
    }

    return NextResponse.json({
      success: true,
      version: {
        code: version.code,
        name: version.name,
        verseCount: verses.length,
      },
    });
  } catch (error) {
    console.error('Import version error:', error);
    return NextResponse.json({ error: 'Failed to import version' }, { status: 500 });
  }
}

// DELETE /api/versions/import - Delete Bible version
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing version code' }, { status: 400 });
    }

    // Check if version exists and is not public (to allow deleting custom versions)
    const version = await prisma.bibleVersion.findUnique({
      where: { code },
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    if (version.isPublic) {
      return NextResponse.json({ 
        error: 'Cannot delete public version' 
      }, { status: 403 });
    }

    // Delete verses first
    await prisma.bibleVerse.deleteMany({
      where: { version: code },
    });

    // Delete version
    await prisma.bibleVersion.delete({
      where: { code },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete version error:', error);
    return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 });
  }
}
