// app/api/versions/route.ts
// Bible versions API - returns available Bible versions from constants

import { NextResponse } from 'next/server';
import { BIBLE_VERSIONS } from '@/lib/constants';

// GET /api/versions - List available Bible versions
export async function GET() {
  return NextResponse.json({
    versions: Object.values(BIBLE_VERSIONS)
  });
}