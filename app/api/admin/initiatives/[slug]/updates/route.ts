// app/api/admin/initiatives/[slug]/updates/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireElderServer();
    const { slug } = await ctx.params;

    const initiative = await prisma.initiative.findUnique({
      where: { slug },
      select: {
        id: true,
        updates: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, body: true, createdAt: true, authorId: true },
        },
      },
    });

    if (!initiative) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, updates: initiative.updates });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { user } = await requireElderServer();
    const { slug } = await ctx.params;

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === 'string' ? body.title.trim() : undefined;
    const text  = typeof body?.body  === 'string' ? body.body.trim()  : '';
    if (!text) return NextResponse.json({ ok: false, error: '`body` is required' }, { status: 400 });

    const initiative = await prisma.initiative.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!initiative) {
      return NextResponse.json({ ok: false, error: 'Initiative not found' }, { status: 404 });
    }

    const upd = await prisma.initiativeUpdate.create({
      data: {
        initiativeId: initiative.id,
        title: title && title.length ? title : null,
        body: text,
        authorId: user?.id ?? null,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, id: upd.id, createdAt: upd.createdAt.toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unauthorized' }, { status: 401 });
  }
}