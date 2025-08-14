// app/api/dev/reseed-residents/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createResidentWallet } from '@/lib/wallet/createResidentWallet';
import { creditAxg } from '@/lib/wallet/creditAxg';

const A = 'resident.a@example.com';
const B = 'resident.b@example.com';
const DEV_PASS = 'dev-pass-axpt';

function notAllowed() {
  return NextResponse.json({ ok: false, error: 'Not allowed in production' }, { status: 403 });
}
function isTrue(v: string | null) {
  return v === '1' || v === 'true' || v === 'yes';
}

async function previewForEmails(emails: string[]) {
  const existing = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true }
  });

  return {
    existingCount: existing.length,
    existingEmails: existing.map(u => u.email),
    willDelete: existing.map(u => ({
      email: u.email,
      relatedTables: [
        'transaction', 'balance', 'blockchainWallet', 'wallet',
        'session', 'sessionLog', 'sessionActionLog', 'revokedToken',
        'nFTBadge', 'stake', 'simProfile', 'nodeSyncStatus', 'user'
      ]
    })),
  };
}

async function hardDeleteByEmails(emails: string[]) {
  const existing = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const ids = existing.map(u => u.id);
  if (!ids.length) return { deletedUsers: 0 };

  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId: { in: ids } } }),
    prisma.balance.deleteMany({ where: { userId: { in: ids } } }),
    prisma.blockchainWallet.deleteMany({ where: { userId: { in: ids } } }),
    prisma.wallet.deleteMany({ where: { userId: { in: ids } } }),
    prisma.session.deleteMany({ where: { userId: { in: ids } } }),
    prisma.sessionLog.deleteMany({ where: { userId: { in: ids } } }),
    prisma.sessionActionLog.deleteMany({ where: { userId: { in: ids } } }),
    prisma.revokedToken.deleteMany({ where: { userId: { in: ids } } }),
    prisma.nFTBadge.deleteMany({ where: { userId: { in: ids } } }),
    prisma.stake.deleteMany({ where: { userId: { in: ids } } }),
    prisma.simProfile.deleteMany({ where: { userId: { in: ids } } }),
    prisma.nodeSyncStatus.deleteMany({ where: { userId: { in: ids } } }),
    prisma.user.deleteMany({ where: { id: { in: ids } } }),
  ]);

  return { deletedUsers: ids.length };
}

async function createResident(email: string, displayName: string) {
  const username = email.split('@')[0].replace(/[^a-z0-9._-]/gi, '').toLowerCase();
  const passwordHash = await bcrypt.hash(DEV_PASS, 10);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      name: displayName,
      tier: 'resident',
      isAdmin: false,
    },
    select: { id: true, email: true },
  });

  await createResidentWallet(user.id);
  await creditAxg(user.id, 1000, 'Initial dev seed');

  return { email, created: true, toppedTo: 1000 };
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') return notAllowed();

  const url = new URL(req.url);
  const dry = isTrue(url.searchParams.get('dry'));
  const force = isTrue(url.searchParams.get('force'));
  const emails = [A, B];

  // Build preview either way (used in dry-only or dry+force)
  const preview = await previewForEmails(emails);

  // Mode 1: dry only
  if (dry && !force) {
    return NextResponse.json({ ok: true, mode: 'dry-run', preview });
  }

  // Mode 2: force only
  if (!dry && force) {
    // execute reseed
    await hardDeleteByEmails(emails);
    const residents = [
      await createResident(A, 'Resident A'),
      await createResident(B, 'Resident B'),
    ];
    return NextResponse.json({ ok: true, mode: 'reseed', residents });
  }

  // Mode 3: dry + force (preview + execute in one call)
  if (dry && force) {
    await hardDeleteByEmails(emails);
    const residents = [
      await createResident(A, 'Resident A'),
      await createResident(B, 'Resident B'),
    ];
    return NextResponse.json({ ok: true, mode: 'dry-run+reseed', preview, residents });
  }

  // Default: warn
  return NextResponse.json(
    { ok: false, error: 'Destructive route. Use ?dry=1 to preview, or ?force=1 to reseed, or both.' },
    { status: 403 }
  );
}