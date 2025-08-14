// app/api/admin/initiatives/[slug]/updates/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const { user } = await requireElderServer();
    const { content } = await req.json().catch(() => ({} as any));

    const text = typeof content === 'string' ? content.trim() : '';
    if (!text) {
      return NextResponse.json({ ok: false, error: 'Content required' }, { status: 400 });
    }

    const initiative = await prisma.initiative.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });
    if (!initiative) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    // Cast to `any` to avoid Prisma type drift issues (field is `content` in your schema)
    const saved = await prisma.initiativeUpdate.create({
      data: ({
        initiativeId: initiative.id,
        authorId: user.id,
        content: text,
      } as any),
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, updateId: saved.id, createdAt: saved.createdAt });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Forbidden' }, { status: 403 });
  }
}