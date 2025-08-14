import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  try {
    await requireElderServer();
    const item = await prisma.initiative.findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, title: true, summary: true, category: true, status: true, createdAt: true, updatedAt: true },
    });
    if (!item) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

    const agg = await prisma.initiativeFunding.aggregate({
      where: { initiativeId: item.id },
      _sum: { amount: true },
    });
    const fundingReceived =
      (agg._sum.amount as any)?.toNumber?.() ?? Number(agg._sum.amount) ?? 0;

    return NextResponse.json({ ok: true, item: { ...item, fundingReceived } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Forbidden' }, { status: 403 });
  }
}

export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  try {
    await requireElderServer();
    const raw = await req.json().catch(() => ({}));

    const title = typeof raw.title === 'string' ? raw.title.trim() : undefined;
    const summary = typeof raw.summary === 'string' ? raw.summary.trim() : undefined;
    const rawCategory = typeof raw.category === 'string' ? raw.category.trim().toUpperCase() : undefined;
    const rawStatus = typeof raw.status === 'string' ? raw.status.trim().toUpperCase() : undefined;

    const data: any = {};
    if (title) data.title = title;
    if (summary) data.summary = summary;
    if (rawCategory && (['ENERGY','FINTECH','DATA','SECURITY','OTHER'] as const).includes(rawCategory as any)) {
      data.category = rawCategory as any;
    }
    if (rawStatus && (['DRAFT','ACTIVE','PAUSED','COMPLETED','ARCHIVED'] as const).includes(rawStatus as any)) {
      data.status = rawStatus as any;
    }

    const updated = await prisma.initiative.update({
      where: { slug: params.slug },
      data,
      select: { id: true, slug: true, title: true, summary: true, category: true, status: true, updatedAt: true },
    });

    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Forbidden' }, { status: 403 });
  }
}