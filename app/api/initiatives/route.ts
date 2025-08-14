import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status'); // optional

    const where =
      statusFilter
        ? { status: statusFilter as any }
        : { status: { in: ['ACTIVE', 'COMPLETED'] as any } };

    const items = await prisma.initiative.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, initiatives: items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}