// app/api/versions/route.ts
// Bible versions API

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/versions - List available Bible versions
export async function GET() {
  try {
    const versions = await prisma.bibleVersion.findMany({
      orderBy: { name: 'asc' }
    });

    // If no versions in DB, return defaults
    if (versions.length === 0) {
      return NextResponse.json({
        versions: [
          { code: 'CUV', name: '和合本', language: 'zh', isDefault: true },
          { code: 'KJV', name: 'King James Version', language: 'en', isDefault: false }
        ]
      });
    }

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Get versions error:', error);
    return NextResponse.json({ error: 'Failed to get versions' }, { status: 500 });
  }
}

// POST /api/versions - Add new Bible version (admin only)
export async function POST(req: Request) {
  try {
    // TODO: Add admin authentication check
    
    const { code, name, nameEn, language = 'zh', isPublic = true } = await req.json();

    const version = await prisma.bibleVersion.create({
      data: {
        code,
        name,
        nameEn,
        language,
        isPublic
      }
    });

    return NextResponse.json({ version });
  } catch (error) {
    console.error('Add version error:', error);
    return NextResponse.json({ error: 'Failed to add version' }, { status: 500 });
  }
}
