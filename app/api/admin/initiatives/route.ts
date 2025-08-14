import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export async function GET() {
  try {
    await requireElderServer();

    const initiatives = await prisma.initiative.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, slug: true, title: true, category: true, status: true, createdAt: true },
    });

    // Compute totals in one shot
    const totals = await prisma.initiativeFunding.groupBy({
      by: ['initiativeId'],
      _sum: { amount: true },
      where: { initiativeId: { in: initiatives.map(i => i.id) } },
    });
    const totalsMap = new Map(
      totals.map(t => [t.initiativeId, (t._sum.amount as any)?.toNumber?.() ?? Number(t._sum.amount) ?? 0])
    );

    const items = initiatives.map(i => ({
      ...i,
      fundingReceived: totalsMap.get(i.id) ?? 0,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Forbidden' }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await requireElderServer();
    const raw = await req.json().catch(() => ({}));

    const slug = String(raw.slug || '').trim().toLowerCase();
    const title = String(raw.title || '').trim();
    const summary = String(raw.summary || '').trim();
    const rawCategory = String(raw.category || '').trim().toUpperCase();
    const rawStatus = String(raw.status || '').trim().toUpperCase();

    if (!slug || !title || !summary) {
      return NextResponse.json({ ok: false, error: 'slug, title, summary are required' }, { status: 400 });
    }

    // Allow only defined enum literals
    const category = (['ENERGY','FINTECH','DATA','SECURITY','OTHER'] as const).includes(rawCategory as any)
      ? rawCategory
      : 'OTHER';
    const status = (['DRAFT','ACTIVE','PAUSED','COMPLETED','ARCHIVED'] as const).includes(rawStatus as any)
      ? rawStatus
      : 'ACTIVE';

    const saved = await prisma.initiative.upsert({
      where: { slug },
      update: { title, summary, category: category as any, status: status as any },
      create: { slug, title, summary, category: category as any, status: status as any },
      select: { id: true, slug: true, title: true, category: true, status: true },
    });

    return NextResponse.json({ ok: true, item: saved });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Forbidden' }, { status: 403 });
  }
}