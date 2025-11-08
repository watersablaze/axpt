// app/api/admin/emails/route.ts
import { NextResponse } from 'next/server';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import { prisma } from '@/lib/prisma';
import {
  getRecentEmailLogs,
  countEmailsByType,
  searchEmailLogs,
} from '@/lib/email/emailLogService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/emails
 * Supports pagination and search
 * Example: /api/admin/emails?page=2&limit=25&search=welcome
 */
export async function GET(req: Request) {
  await requireElderServer();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    let emails;
    let totalCount;

    if (search) {
      // 🔍 Search path (with pagination)
      [emails, totalCount] = await Promise.all([
        searchEmailLogs(search, limit, skip),
        prisma.emailLog.count({
          where: {
            OR: [
              { to: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } },
            ],
          },
        }),
      ]);
    } else {
      // 📨 Default recent emails path (with pagination)
      [emails, totalCount] = await Promise.all([
        prisma.emailLog.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            type: true,
            to: true,
            from: true,
            subject: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.emailLog.count(),
      ]);
    }

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      page,
      totalPages,
      totalCount,
      emails,
    });
  } catch (err) {
    console.error('❌ Error fetching emails:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email logs' },
      { status: 500 }
    );
  }
}