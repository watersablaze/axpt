import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireResidentServer } from '@/lib/auth/requireResidentServer';
import { transferToken, WalletError } from '@/engines/wallet';
import type { Currency } from '@/engines/wallet';

function getIdempotencyKey(req: Request) {
  return req.headers.get('Idempotency-Key')?.trim() || null;
}

export async function POST(req: Request) {
  const { userId: fromUserId } = await requireResidentServer();
  const idempotencyKey = getIdempotencyKey(req);

  if (!idempotencyKey) {
    return NextResponse.json({ ok: false, error: 'Missing Idempotency-Key header' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { toUserId: rawToUserId, toEmail, amount, note, feeBps, feeMode } = body || {};

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

    // Phase 6: tokenType when available (AXG for this route’s current semantics)
    const tokenType: Currency = 'AXG';

    const result = await transferToken({
      fromUserId,
      toUserId,
      amount,
      tokenType,
      note: note ?? null,
      idempotencyKey,
      source: 'api',
      feeBps: typeof feeBps === 'number' ? feeBps : 0,
      feeMode: feeMode ?? 'SENDER_PAYS',
    });

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (e: any) {
    if (e instanceof WalletError) {
      return NextResponse.json({ ok: false, code: e.code, error: e.message }, { status: e.status });
    }
    return NextResponse.json({ ok: false, error: e?.message || 'transfer failed' }, { status: 500 });
  }
}
