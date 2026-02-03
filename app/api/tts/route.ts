// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);
export const runtime = 'nodejs'; 

export async function POST(req: NextRequest) {
  let tempFilePath = '';
  
  try {
    const { text } = await req.json();
    if (!text) return new NextResponse('Missing text', { status: 400 });

    const safeText = text.slice(0, 5000).replace(/"/g, '\\"');
    const fileName = `tts-${randomUUID()}.mp3`;
    const tempDir = process.platform === 'win32' ? path.join(process.cwd(), '.next/cache') : '/tmp';
    
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    tempFilePath = path.join(tempDir, fileName);
    const scriptPath = path.join(process.cwd(), 'scripts/tts.py');

    await execAsync(`python3 "${scriptPath}" "${safeText}" "${tempFilePath}"`);

    const audioBuffer = fs.readFileSync(tempFilePath);
    fs.unlink(tempFilePath, () => {}); // 异步清理

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('TTS Error:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    return new NextResponse(JSON.stringify({ error: 'TTS Failed' }), { status: 500 });
  }
}