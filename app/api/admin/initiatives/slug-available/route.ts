import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export async function GET(req: Request) {
  try {
    await requireElderServer();
    const { searchParams } = new URL(req.url);
    const slug = (searchParams.get('slug') || '').trim().toLowerCase();
    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Missing slug' }, { status: 400 });
    }

    const existing = await prisma.initiative.findUnique({ where: { slug }, select: { id: true } });
    return NextResponse.json({ ok: true, available: !existing });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Forbidden' }, { status: 403 });
  }
}