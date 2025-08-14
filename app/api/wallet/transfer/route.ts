import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireResidentServer } from '@/lib/auth/requireResidentServer';
import { transferAxg } from '@/lib/wallet/transferAxg';

export async function POST(req: Request) {
  const { userId: fromUserId } = await requireResidentServer();

  try {
    const body = await req.json();
    const { toUserId: rawToUserId, toEmail, amount, note } = body || {};

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: 'amount (positive number) is required' }, { status: 400 });
    }

    // Resolve recipient
    let toUserId: string | null = rawToUserId || null;
    if (!toUserId && toEmail) {
      const u = await prisma.user.findUnique({ where: { email: toEmail }, select: { id: true } });
      if (!u) return NextResponse.json({ ok: false, error: 'Recipient not found for email' }, { status: 404 });
      toUserId = u.id;
    }
    if (!toUserId) {
      return NextResponse.json({ ok: false, error: 'toUserId or toEmail is required' }, { status: 400 });
    }

    const result = await transferAxg({ fromUserId, toUserId, amount, note });

    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'transfer failed' }, { status: 500 });
  }
}