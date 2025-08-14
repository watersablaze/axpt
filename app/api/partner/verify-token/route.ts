// 📁 app/api/partner/verify-token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/token/verifyToken';
import { env } from '@/lib/env/readEnv';
import { TokenPayload } from '@/types/token';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      console.warn('[AXPT] 🚫 Token missing or invalid input:', token);
      return NextResponse.json({ success: false, error: 'Token missing or invalid' }, { status: 400 });
    }

    const result = await verifyToken(token);
    if (!result.valid || !result.payload) {
      return NextResponse.json({ success: false, error: result.error || 'Invalid payload' }, { status: 401 });
    }

    const payload = result.payload as TokenPayload;
    const {
      partner,
      tier,
      docs,
      displayName,
      greeting,
      popupMessage,
      userId,
    } = payload;

    const email: string = typeof payload.email === 'string'
      ? payload.email
      : `${partner}@axpt.io`;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          username: partner,
          email,
          passwordHash: '',
          tier,
          partnerSlug: partner,
          displayName: displayName ?? null,
          viewedDocs: [],
        },
      });
      console.log('[AXPT] 👤 New user created:', user.id);
    } else {
      user = await prisma.user.update({
        where: { email },
        data: {
          lastLogin: new Date(),
          loginCount: { increment: 1 },
          tier,
          partnerSlug: partner,
          displayName: displayName ?? undefined,
        },
      });
      console.log('[AXPT] 🔁 Existing user updated:', user.id);
    }

    await prisma.sessionLog.create({
      data: {
        user: { connect: { id: user.id } },
        action: 'verified',
        path: '/api/partner/verify-token',
        ip: req.headers.get('x-forwarded-for') ?? '',
        device: req.headers.get('user-agent') ?? '',
      },
    });

    return NextResponse.json({
      success: true,
      partner,
      tier,
      docs,
      displayName,
      greeting,
      popupMessage,
    });
  } catch (err) {
    console.error('[AXPT] 🔥 Unexpected error in verify-token route:', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}