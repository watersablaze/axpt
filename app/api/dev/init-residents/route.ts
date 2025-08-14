import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createResidentWallet } from '@/lib/wallet/createResidentWallet';
import { creditAxg } from '@/lib/wallet/creditAxg';

const A = 'resident.a@example.com';
const B = 'resident.b@example.com';
const DEV_PASS = 'dev-pass-axpt';
const TARGET_AXG = 1000;

async function ensureResident(email: string, displayName: string) {
  const base = email.split('@')[0].replace(/[^a-z0-9._-]/gi, '').toLowerCase();
  const username = base;
  const passwordHash = await bcrypt.hash(DEV_PASS, 10);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      username,
      passwordHash,
      name: displayName,
      tier: 'resident',
      isAdmin: false,
    },
    update: {
      name: displayName,
      tier: 'resident',
    },
    select: { id: true, email: true },
  });

  await createResidentWallet(user.id);

  const wallet = await prisma.wallet.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!wallet) return email;

  const axg = await prisma.balance.findFirst({
    where: { walletId: wallet.id, userId: user.id, tokenType: 'AXG' },
    select: { id: true, amount: true },
  });

  if (!axg) {
    await prisma.balance.create({
      data: { walletId: wallet.id, userId: user.id, tokenType: 'AXG', amount: 0 },
    });
  }

  const current = axg?.amount ?? 0;
  if (current < TARGET_AXG) {
    await creditAxg(user.id, TARGET_AXG - current, 'DEV top-up to 1000 AXG');
  }

  return email;
}

async function maybeForceReset(force: boolean) {
  if (!force) return;

  // Only clears the dev impersonation/session cookies’ effect; does NOT delete users
  // If you truly want to delete A/B and all their data, we can add a careful cascaded delete here.
}

async function seed(force: boolean) {
  await maybeForceReset(force);
  const created: string[] = [];
  created.push(await ensureResident(A, 'Resident A'));
  created.push(await ensureResident(B, 'Resident B'));
  return created;
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Not allowed in production' }, { status: 403 });
  }
  const force = new URL(req.url).searchParams.get('force') ? true : false;
  const created = await seed(force);
  return NextResponse.json({ ok: true, created });
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Not allowed in production' }, { status: 403 });
  }
  const force = new URL(req.url).searchParams.get('force') ? true : false;
  const created = await seed(force);
  return NextResponse.json({ ok: true, created });
}