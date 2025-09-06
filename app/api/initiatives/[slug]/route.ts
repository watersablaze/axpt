import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  try {
    const item = await prisma.initiative.findUnique({
      where: { slug: params.slug },
      include: {
        updates: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!item) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

    return NextResponse.json({ ok: true, initiative: item });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}