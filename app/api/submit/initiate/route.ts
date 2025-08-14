// app/api/submit/initiate/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // ✅ named import
import { createResidentWallet } from '@/lib/wallet/createResidentWallet';
import { switchToResidentSession } from '@/lib/auth/switchToResidentSession';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, tier } = body;

    // 1) Find or create user (keep your existing logic for username/passwordHash, etc.)
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: email.split('@')[0] + '-' + Math.random().toString(36).slice(2, 6),
          passwordHash: 'INIT_PLACEHOLDER', // replace with your real hash flow when ready
          name: name ?? null,
          tier: tier ?? null,
        },
      });
    }

    // 2) Birth/ensure wallet + core balances (AXG/NMP)
    await createResidentWallet(user.id);

    // 3) Promote session to resident (JWT cookie)
    await switchToResidentSession({
    userId: user.id,
    email: user.email,
    tier: user.tier ?? undefined,
    });

    return NextResponse.json(
      { ok: true, next: '/portal/initiation' },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'initiation failed' },
      { status: 500 }
    );
  }
}