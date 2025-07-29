// 📁 app/api/partner/verify-token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/token/verifyToken';
import { env } from '@/lib/env/readEnv';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      console.warn('[AXPT] 🚫 Token missing or invalid input:', token);
      return NextResponse.json(
        { success: false, error: 'Token missing or invalid' },
        { status: 400 }
      );
    }

    const result = await verifyToken(token);
    if (!result.valid) {
      console.error('[AXPT] ❌ Token verification failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    const {
      partner,
      tier,
      docs,
      displayName,
      greeting,
      popupMessage,
      userId,
      email,
    } = result.payload;

    // ✨ Auto-onboard user if missing
    const user = await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        username: partner,
        email: email || `${partner}@axpt.io`,
        passwordHash: '',
        tier,
        partnerSlug: partner,
        displayName: displayName ?? null,
      },
      update: {
        tier,
        partnerSlug: partner,
        displayName: displayName ?? undefined,
      },
    });

    console.log('[AXPT] 👤 User onboarded or updated:', user.id);

    // 🧾 Log session event
    await prisma.sessionLog.create({
      data: {
        user: { connect: { id: userId } },
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
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}