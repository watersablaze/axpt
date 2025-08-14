import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import { sendCouncilNotification, sendSlack } from '@/lib/notify';

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const { user } = await requireElderServer();

    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);
    const note = typeof body?.note === 'string' ? body.note : undefined;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid amount' }, { status: 400 });
    }

    const initiative = await prisma.initiative.findUnique({
      where: { slug: params.slug },
      select: { id: true, title: true, status: true },
    });
    if (!initiative) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }
    if (initiative.status !== 'ACTIVE') {
      return NextResponse.json({ ok: false, error: 'Initiative must be ACTIVE to fund' }, { status: 400 });
    }

    const funding = await prisma.initiativeFunding.create({
      data: { initiativeId: initiative.id, userId: user.id, amount, note },
      select: { id: true },
    });

    // Recompute total from ledger rows (no cached column).
    const agg = await prisma.initiativeFunding.aggregate({
      where: { initiativeId: initiative.id },
      _sum: { amount: true },
    });
    const fundingReceived =
      (agg._sum.amount as any)?.toNumber?.() ?? Number(agg._sum.amount) ?? 0;

    // Best‑effort notifications (non-blocking).
    const subject = `New pledge for ${initiative.title}`;
    const html = `<p>${user?.email ?? 'A resident'} pledged <b>${amount.toFixed(2)} AXG</b> to ${initiative.title}.</p>${
      note ? `<p>Note: ${note}</p>` : ''
    }`;

    // Fire and forget
    sendCouncilNotification(subject, html).catch(() => {});
    sendSlack(`:zap: New pledge: ${amount.toFixed(2)} AXG → ${initiative.title} by ${user?.email ?? 'resident'}`).catch(() => {});

    return NextResponse.json({ ok: true, fundingId: funding.id, fundingReceived });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Forbidden' }, { status: 403 });
  }
}