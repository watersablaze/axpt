// app/api/bridge-account/upgrade/handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';
import { createSessionCookie } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const { email, pin, tier } = await req.json();
    const cookieStore = cookies();
    const session = cookieStore.get('axpt_session');

    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode JWT to extract userId
    let userId: string | null = null;
    try {
      const decoded: any = jwt.decode(session.value);
      userId = decoded?.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    const hashedPin = await hash(pin, 10);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        email,
        pinHash: hashedPin,
        upgraded: true,
        tier,
      },
    });

    const newSession = await createSessionCookie({
      userId: updated.id,
      name: updated.name || '',
      tier: updated.tier,
    });

    cookies().set('axpt_session', newSession);

    return NextResponse.json({
      success: true,
      redirectTo: `/account/dashboard/${updated.tier.toLowerCase()}`,
    });
  } catch (err) {
    console.error('Upgrade error:', err);
    return NextResponse.json({ error: 'Internal error during upgrade' }, { status: 500 });
  }
}