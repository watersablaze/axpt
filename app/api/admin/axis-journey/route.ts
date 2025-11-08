// app/api/admin/axis-journey/route.ts
import { NextResponse } from 'next/server';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/axis-journey
 * Query params:
 * - page (default: 1)
 * - limit (default: 20)
 * - search (email/origin match)
 * - filter (confirmed/unconfirmed/all)
 */
export async function GET(req: Request) {
  await requireElderServer();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const skip = (page - 1) * limit;

    // Build query filters dynamically
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { origin: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filter === 'confirmed') where.confirmed = true;
    if (filter === 'unconfirmed') where.confirmed = false;

    const [subscribers, totalCount] = await Promise.all([
      prisma.axisJourneySubscriber.findMany({
        where,
        orderBy: { joinedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          origin: true,
          confirmed: true,
          joinedAt: true,
        },
      }),
      prisma.axisJourneySubscriber.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      page,
      totalPages,
      totalCount,
      subscribers,
    });
  } catch (err) {
    console.error('❌ Error fetching Axis Journey subscribers:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscribers' },
      { status: 500 }
    );
  }
}