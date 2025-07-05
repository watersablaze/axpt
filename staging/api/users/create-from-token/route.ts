import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromToken } from '@/lib/session/getSessionFromToken';
import { createInitialWallet } from '@/lib/wallet/createInitialWallet';

export async function POST(req: NextRequest) {
  try {
    const { name, email, token } = await req.json();

    if (!name || !email || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = getSessionFromToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        accessToken: token,
        partnerSlug: session.partner,
        tier: session.tier,
        isAdmin: false,
        username: email,
        password: '', // To be set via upgrade
      },
    });

    const wallet = await createInitialWallet(newUser.id);

    return NextResponse.json({
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      wallet,
    });
  } catch (err) {
    console.error('❌ Error creating user from token:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}