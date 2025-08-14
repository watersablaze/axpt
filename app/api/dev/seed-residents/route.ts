import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createResidentWallet } from '@/lib/wallet/createResidentWallet';
import { creditAxg } from '@/lib/wallet/creditAxg';

async function seed() {
  const A_EMAIL = 'resident.a@example.com';
  const B_EMAIL = 'resident.b@example.com';

  const [A, B] = await Promise.all([
    prisma.user.upsert({
      where: { email: A_EMAIL },
      create: {
        email: A_EMAIL,
        username: 'resident_a',
        passwordHash: 'DEV_PLACEHOLDER',
        name: 'Resident A',
        tier: 'Nomad',
      },
      update: {},
      select: { id: true, email: true, tier: true, name: true },
    }),
    prisma.user.upsert({
      where: { email: B_EMAIL },
      create: {
        email: B_EMAIL,
        username: 'resident_b',
        passwordHash: 'DEV_PLACEHOLDER',
        name: 'Resident B',
        tier: 'Nomad',
      },
      update: {},
      select: { id: true, email: true, tier: true, name: true },
    }),
  ]);

  await Promise.all([createResidentWallet(A.id), createResidentWallet(B.id)]);

  const Awallet = await prisma.wallet.findUnique({
    where: { userId: A.id },
    include: { balances: true },
  });
  const axg = Awallet?.balances.find((b) => b.tokenType === 'AXG');
  const needs = Math.max(0, 10 - (axg?.amount ?? 0));
  if (needs > 0) {
    await creditAxg(A.id, needs, 'DEV seed');
  }

  return { A, B };
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Not allowed in production' }, { status: 403 });
  }
  try {
    const out = await seed();
    return NextResponse.json({ ok: true, ...out });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'seed failed' }, { status: 500 });
  }
}

export async function POST() {
  // same as GET for convenience
  return GET();
}