import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import {
  INITIATIVE_CATEGORIES,
  INITIATIVE_STATUSES,
  coerceEnum,
  type InitiativeCategoryLiteral,
  type InitiativeStatusLiteral,
} from '@/config/initiatives';

export async function GET() {
  try {
    await requireElderServer();

    const initiatives = await prisma.initiative.findMany({
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

    const totals = await prisma.initiativeFunding.groupBy({
      by: ['initiativeId'],
      _sum: { amount: true },
      where: { initiativeId: { in: initiatives.map(i => i.id) } },
    });

    const totalsMap = new Map(
      totals.map(t => [
        t.initiativeId,
        (t._sum.amount as any)?.toNumber?.() ?? Number(t._sum.amount) ?? 0,
      ])
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

    if (!slug || !title || !summary) {
      return NextResponse.json(
        { ok: false, error: 'slug, title, summary are required' },
        { status: 400 }
      );
    }

    const category = coerceEnum<InitiativeCategoryLiteral>(
      raw.category,
      INITIATIVE_CATEGORIES,
      'OTHER'
    );

    const status = coerceEnum<InitiativeStatusLiteral>(
      raw.status,
      INITIATIVE_STATUSES,
      'ACTIVE'
    );

    // Prefer create (avoid silent overwrite). If slug exists, 409.
    const exists = await prisma.initiative.findUnique({ where: { slug } });
    if (exists) {
      return NextResponse.json(
        { ok: false, error: 'Slug already exists' },
        { status: 409 }
      );
    }

    const created = await prisma.initiative.create({
      data: { slug, title, summary, category: category as any, status: status as any },
      select: { id: true, slug: true, title: true, category: true, status: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Forbidden' }, { status: 403 });
  }
}