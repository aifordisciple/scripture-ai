// app/api/sync/offline/route.ts
// Offline-first sync with conflict resolution

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/sync/offline - Offline sync with conflict resolution
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { 
      mode = 'merge', // 'merge' | 'overwrite' | 'last-write-wins'
      clientData,
      lastSyncTime 
    } = data;

    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      include: {
        settings: true,
        highlights: { where: { updatedAt: { gt: new Date(lastSyncTime || 0) } } },
        notes: { where: { updatedAt: { gt: new Date(lastSyncTime || 0) } } },
        interactions: true,
        planProgress: true,
        badges: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Server data with timestamps
    const serverData = {
      settings: user.settings,
      highlights: user.highlights,
      notes: user.notes,
      interactions: user.interactions,
      activePlans: user.planProgress,
      badges: user.badges,
      streakCount: user.streakCount,
      lastActiveDate: user.lastActiveDate,
      updatedAt: new Date().toISOString()
    };

    // Conflict resolution based on mode
    let mergedData = serverData;

    if (mode === 'merge') {
      mergedData = mergeData(serverData, clientData);
    } else if (mode === 'overwrite') {
      mergedData = clientData;
    } 
    // last-write-wins is handled by client choosing what to send

    // Save merged data to server
    await saveUserData(user.id, mergedData);

    return NextResponse.json({
      success: true,
      data: mergedData,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Offline sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// Merge data with conflict resolution
function mergeData(server: any, client: any): any {
  return {
    // Settings: take latest
    settings: mergeSettings(server.settings, client.settings),
    
    // Highlights: merge by ID, keep latest
    // Highlights: merge by composite key (bookId-chapter-verse), keep latest
    highlights: mergeById(server.highlights || [], client.highlights || [], 'id', (item: any) => `${item.bookId}-${item.chapter}-${item.verse}`),
    
    // Notes: merge by ID, keep latest
    notes: mergeById(server.notes || [], client.notes || [], 'id'),
    
    // Interactions: sum counts
    interactions: mergeInteractions(server.interactions || [], client.interactions || []),
    
    // Plans: merge by planId
    activePlans: mergePlans(server.activePlans || [], client.activePlans || []),
    
    // Badges: union
    badges: mergeBadges(server.badges || [], client.badges || []),
    
    // Streak: take highest
    streakCount: Math.max(server.streakCount || 0, client.streakCount || 0),
    lastActiveDate: server.lastActiveDate > client.lastActiveDate 
      ? server.lastActiveDate 
      : client.lastActiveDate
  };
}

function mergeSettings(server: any, client: any): any {
  if (!server) return client;
  if (!client) return server;
  
  // Take more recent
  return new Date(server.updatedAt) > new Date(client.updatedAt) ? server : client;
}

function mergeById<T extends { id?: string }>(server: T[], client: T[], idField: string): T[] {
  const merged = new Map();
  
  // Add server items
  for (const item of server) {
    const key = item[idField] || item.id;
    merged.set(key, { ...item, source: 'server' });
  }
  
  // Merge client items (client wins on conflict)
  for (const item of client) {
    const key = item[idField] || item.id;
    const existing = merged.get(key);
    
    if (!existing || new Date(item.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
      merged.set(key, { ...item, source: 'client' });
    }
  }
  
  return Array.from(merged.values()).map(({ source, ...rest }) => rest);
}

function mergeInteractions(server: any[], client: any[]): any[] {
  const merged = new Map();
  
  for (const i of server) {
    const key = `${i.bookId}-${i.chapter}`;
    merged.set(key, i);
  }
  
  for (const i of client) {
    const key = `${i.bookId}-${i.chapter}`;
    const existing = merged.get(key);
    
    if (existing) {
      merged.set(key, {
        ...existing,
        count: (existing.count || 0) + (i.count || 0)
      });
    } else {
      merged.set(key, i);
    }
  }
  
  return Array.from(merged.values());
}

function mergePlans(server: any[], client: any[]): any[] {
  const merged = new Map();
  
  for (const p of server) {
    merged.set(p.planId, p);
  }
  
  for (const p of client) {
    const existing = merged.get(p.planId);
    if (!existing) {
      merged.set(p.planId, p);
    } else {
      // Merge completed tasks
      const mergedTasks = {
        ...JSON.parse(existing.completedTasks || '{}'),
        ...JSON.parse(p.completedTasks || '{}')
      };
      merged.set(p.planId, {
        ...existing,
        completedTasks: JSON.stringify(mergedTasks),
        savedDevotionals: JSON.stringify({
          ...JSON.parse(existing.savedDevotionals || '{}'),
          ...JSON.parse(p.savedDevotionals || '{}')
        })
      });
    }
  }
  
  return Array.from(merged.values());
}

function mergeBadges(server: any[], client: any[]): any[] {
  const merged = new Map();
  
  for (const b of server) {
    merged.set(b.type, b);
  }
  
  for (const b of client) {
    if (!merged.has(b.type)) {
      merged.set(b.type, b);
    }
  }
  
  return Array.from(merged.values());
}

async function saveUserData(userId: string, data: any): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Save settings
    if (data.settings) {
      await tx.userSetting.upsert({
        where: { userId },
        update: data.settings,
        create: { ...data.settings, userId }
      });
    }
    
    // Save highlights
    if (data.highlights) {
      for (const h of data.highlights) {
        await tx.highlight.upsert({
          where: {
            id: h.id || `highlight-${h.bookId}-${h.chapter}-${h.verse}`
          },
          update: h,
          create: { ...h, userId, id: h.id || `highlight-${h.bookId}-${h.chapter}-${h.verse}` }
        });
      }
    }
    
    // Save notes
    if (data.notes) {
      for (const n of data.notes) {
        await tx.note.upsert({
          where: { id: n.id },
          update: n,
          create: { ...n, userId }
        });
      }
    }
    
    // Save interactions
    if (data.interactions) {
      for (const i of data.interactions) {
        const key = `${i.bookId}-${i.chapter}`;
        await tx.interaction.upsert({
          where: {
            userId_bookId_chapter: { userId, bookId: i.bookId, chapter: i.chapter }
          },
          update: { count: { increment: i.count } },
          create: { userId, ...i }
        });
      }
    }
  });
}
