// app/api/bridge-account/upgrade/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSessionCookie } from '@/lib/auth/createSessionCookie';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, pin, tier } = body;

    // 🔍 Validate required fields
    if (!email || !pin || !tier) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, pin, tier' },
        { status: 400 }
      );
    }

    // 🧠 Optional: Validate tier value
    const allowedTiers = ['Investor', 'Nomad', 'Farmer', 'Merchant'];
    if (!allowedTiers.includes(tier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tier selected' },
        { status: 400 }
      );
    }

    // 👥 Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // 🔐 Create user
    const user = await prisma.user.create({
      data: {
        email,
        pin,
        tier,
      },
    });

    // 🍪 Create secure session cookie
    const { jwt, cookie } = await createSessionCookie({
      userId: user.id,
      tier: user.tier,
      displayName: user.email,
    });

    const res = NextResponse.json({
      success: true,
      user,
      session: jwt,
    });

    res.headers.set('Set-Cookie', cookie);
    return res;

  } catch (err) {
    console.error('[AXPT] ❌ Error in upgrade handler:', err);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}