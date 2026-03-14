// lib/admin.ts
// Admin permission middleware and logging utilities

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Permission check result type
export interface AdminCheckResult {
  authorized: boolean;
  userId?: string;
  error?: NextResponse;
}

// Verify if current user is admin
export async function verifyAdmin(): Promise<AdminCheckResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        authorized: false,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'admin') {
      return {
        authorized: false,
        error: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
      };
    }

    return {
      authorized: true,
      userId: session.user.id
    };
  } catch (error) {
    console.error('Admin verification error:', error);
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    };
  }
}

// Admin action types
export type AdminAction = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE';
export type TargetType = 'USER' | 'CHURCH' | 'FEEDBACK' | 'ANNOUNCEMENT' | 'SYSTEM' | 'PLAN';

// Log admin action for audit trail
export async function logAdminAction(
  adminId: string,
  action: AdminAction,
  targetType: TargetType,
  options?: {
    targetId?: string;
    details?: string;
    ip?: string;
  }
): Promise<void> {
  try {
    await prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId: options?.targetId,
        details: options?.details,
        ip: options?.ip
      }
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failure shouldn't break the main operation
  }
}

// Get client IP from request
export function getClientIP(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || undefined;
}

// Helper to build audit details JSON
export function buildAuditDetails(
  action: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>
): string {
  return JSON.stringify({
    action,
    before: before || null,
    after: after || null,
    timestamp: new Date().toISOString()
  });
}

// Pagination helper
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  totalPages: number;
  totalItems: number;
}

export async function paginate(
  model: any,
  where: any = {},
  params: PaginationParams
): Promise<{ items: any[]; pagination: PaginationResult }> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    model.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    model.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      skip,
      take: limit,
      page,
      totalPages,
      totalItems: total
    }
  };
}

// Date range helper for statistics
export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRange(period: string): DateRange {
  const now = new Date();
  const end = new Date(now);
  let start: Date;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
  }

  return { start, end };
}