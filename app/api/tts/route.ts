import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import { TTS_VOICES } from '@/lib/constants';
import {
  getTtsCacheKey,
  getCachedAudio,
  setCachedAudio,
  getInFlightPromise,
  setInFlightPromise,
} from '@/lib/tts-cache';

const execFileAsync = promisify(execFile);
export const runtime = 'nodejs';

const VALID_VOICES = new Set(TTS_VOICES.map(v => v.id));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voice } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const safeText = text.slice(0, 5000);
    const safeVoice = (voice && typeof voice === 'string' && VALID_VOICES.has(voice)) ? voice : '';
    const cacheKey = getTtsCacheKey(safeText, safeVoice);

    // 1. Check disk cache
    const cached = getCachedAudio(cacheKey);
    if (cached) {
      return new NextResponse(cached, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'X-TTS-Cache': 'HIT',
        },
      });
    }

    // 2. Check in-flight dedup
    const inFlight = getInFlightPromise(cacheKey);
    if (inFlight) {
      const buffer = await inFlight;
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'X-TTS-Cache': 'DEDUP',
        },
      });
    }

    // 3. Generate audio
    const generatePromise = generateAudio(safeText, safeVoice);
    setInFlightPromise(cacheKey, generatePromise);

    const audioBuffer = await generatePromise;

    // 4. Write to cache (non-blocking)
    setCachedAudio(cacheKey, audioBuffer);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'X-TTS-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('[TTS] Error:', error);
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
  }
}

async function generateAudio(text: string, voice: string): Promise<Buffer> {
  const tmpId = randomUUID();
  const tmpPath = `/tmp/tts-${tmpId}.mp3`;

  try {
    const args = [path.join(process.cwd(), 'scripts/tts.py'), text, tmpPath];
    if (voice) args.push(voice);

    await execFileAsync('python3', args, { timeout: 30000 });

    const buffer = fs.readFileSync(tmpPath);
    return buffer;
  } finally {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
  }
}
