import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { creditAxg } from '@/lib/wallet/creditAxg';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export async function POST(req: Request) {
  await requireElderServer();

  try {
    const body = await req.json();
    const { userId: rawUserId, email, amount, note } = body || {};
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: 'amount (positive number) is required' }, { status: 400 });
    }

    let userId: string | null = rawUserId || null;
    if (!userId && email) {
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!user) return NextResponse.json({ ok: false, error: 'User not found for email' }, { status: 404 });
      userId = user.id;
    }
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId or email required' }, { status: 400 });
    }

    const result = await creditAxg(userId, amount, note);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'credit failed' }, { status: 500 });
  }
}