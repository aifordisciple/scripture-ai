// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { randomUUID } from 'crypto';

const execFileAsync = promisify(execFile);
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let tempFilePath = '';

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') return new NextResponse('Missing text', { status: 400 });

    const safeText = text.slice(0, 5000);
    const fileName = `tts-${randomUUID()}.mp3`;
    const tempDir = process.platform === 'win32' ? path.join(process.cwd(), '.next/cache') : '/tmp';

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    tempFilePath = path.join(tempDir, fileName);
    const scriptPath = path.join(process.cwd(), 'scripts/tts.py');

    // 优先使用项目 venv 中的 python，回退到系统 python3
    const venvPython = path.join(process.cwd(), '.venv/bin/python3');
    const pythonBin = fs.existsSync(venvPython) ? venvPython : 'python3';
    const { stderr } = await execFileAsync(pythonBin, [scriptPath, safeText, tempFilePath], { timeout: 30000 });
    if (stderr) console.warn('[TTS] Python stderr:', stderr);

    const audioBuffer = fs.readFileSync(tempFilePath);
    fs.unlink(tempFilePath, () => {}); // 异步清理

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('TTS Error:', error?.message || error);
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    return new NextResponse(JSON.stringify({ error: 'TTS Failed', detail: error?.message || String(error) }), { status: 500 });
  }
}