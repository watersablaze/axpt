// app/api/partner/redeem-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';

const signingSecret = process.env.SIGNING_SECRET;
const salt = process.env.ACCESS_CODE_SALT || signingSecret;

function sha256WithSalt(code: string, salt: string) {
  return crypto.createHash('sha256').update(code + salt).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing code' }, { status: 400 });
    }
    if (!signingSecret || !salt) {
      return NextResponse.json({ success: false, error: 'Server misconfigured' }, { status: 500 });
    }

    const codeHash = sha256WithSalt(code.trim(), salt);
    const rec = await prisma.accessCode.findUnique({ where: { codeHash }});
    if (!rec || !rec.enabled) {
      return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 401 });
    }
    if (rec.expiresAt && rec.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: 'Code expired' }, { status: 401 });
    }
    if (rec.usedCount >= rec.maxUses) {
      return NextResponse.json({ success: false, error: 'Code already used' }, { status: 401 });
    }

    // Issue JWT
    const enc = new TextEncoder().encode(signingSecret);
    const payload = {
      partner: rec.partner,
      tier: rec.tier,
      docs: rec.docs,
      displayName: rec.displayName || undefined,
      greeting: rec.greeting || undefined,
      popupMessage: rec.popupMessage || undefined,
      userId: `code-${rec.id}`,
      email: rec.email || `${rec.partner}@axpt.io`,
    };

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(enc);

    await prisma.accessCode.update({
      where: { id: rec.id },
      data: {
        usedCount: { increment: 1 },
        lastUsedAt: new Date(),
        lastUsedIp: req.headers.get('x-forwarded-for') ?? '',
      },
    });

    return NextResponse.json({ success: true, token: jwt, payload });
  } catch (e) {
    console.error('[redeem-code] error:', e);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}