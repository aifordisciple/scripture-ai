// app/api/events/route.ts
// SSE endpoint for real-time communication

import { auth } from '@/lib/auth';
import { sseManager } from '@/lib/sse-manager';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  // Create a TransformStream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Register client with SSE manager
  sseManager.addClient(userId, stream.writable);

  // Send initial connection message
  try {
    await writer.write(encoder.encode(`event: connected\ndata: ${JSON.stringify({ userId, timestamp: Date.now() })}\n\n`));
  } catch (error) {
    console.error('[SSE] Error sending initial message:', error);
  }

  // Handle connection close
  const handleClose = () => {
    sseManager.removeClient(userId, stream.writable);
  };

  // Create response with the readable stream
  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });

  // Note: In Next.js App Router, we can't easily detect when the client disconnects
  // The connection will be cleaned up when the heartbeat fails or on server restart

  return response;
}