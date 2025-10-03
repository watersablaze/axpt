// app/api/partner/verify-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/token/verifyToken';
import type { TokenPayload } from '@/types/token';
import crypto from 'crypto';

export const runtime = 'nodejs';

const ACCESS_CODE_SALT = process.env.ACCESS_CODE_SALT || '';

function isAccessCodeFormat(s: string) {
  // e.g. AXPT-TESTONE-AX9Q-BA (lenient; you can tighten later)
  return /^[A-Z0-9]{3,5}-[A-Z0-9-]{6,}$/i.test(s);
}

function sha256Hex(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { token: rawToken } = await req.json().catch(() => ({} as any));
    const token = (rawToken ?? '').trim();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token missing' }, { status: 400 });
    }

    // ========= 1) ACCESS CODE PATH (first) =========
    if (ACCESS_CODE_SALT && isAccessCodeFormat(token)) {
      const codeHash = sha256Hex(`${token}:${ACCESS_CODE_SALT}`);

      const code = await prisma.accessCode.findUnique({ where: { codeHash } });
      if (!code) {
        return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
      }

      // validate lifecycle
      if (!code.enabled) {
        return NextResponse.json({ success: false, error: 'Code disabled' }, { status: 403 });
      }
      if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
        return NextResponse.json({ success: false, error: 'Code expired' }, { status: 403 });
      }
      if (code.usedCount >= code.maxUses) {
        return NextResponse.json({ success: false, error: 'Code already used' }, { status: 409 });
      }

      // create/update user
      const email = code.email ?? `${code.partner}@axpt.io`;
      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            username: code.partner,
            email,
            passwordHash: '',
            tier: code.tier,
            partnerSlug: code.partner,
            displayName: code.displayName ?? null,
            viewedDocs: [],
          },
        });
      } else {
        user = await prisma.user.update({
          where: { email },
          data: {
            lastLogin: new Date(),
            loginCount: { increment: 1 },
            tier: code.tier,
            partnerSlug: code.partner,
            displayName: code.displayName ?? undefined,
          },
        });
      }

      // consume one use
      await prisma.accessCode.update({
        where: { id: code.id },
        data: {
          usedCount: { increment: 1 },
          lastUsedAt: new Date(),
          lastUsedIp: req.headers.get('x-forwarded-for') ?? '',
        },
      });

      await prisma.sessionLog.create({
        data: {
          user: { connect: { id: user.id } },
          action: 'verified-access-code',
          path: '/api/partner/verify-token',
          ip: req.headers.get('x-forwarded-for') ?? '',
          device: req.headers.get('user-agent') ?? '',
        },
      });

      // Build a TokenPayload-shaped object so your client code is happy
      const payload: TokenPayload = {
        userId: user.id,                 // <- required by your type
        partner: code.partner,
        tier: code.tier as TokenPayload['tier'],
        docs: code.docs ?? [],
        displayName: code.displayName ?? undefined,
        greeting: undefined,
        popupMessage: code.popupMessage ?? undefined,
        email,
      };

      return NextResponse.json({
        success: true,
        ...payload,
      });
    }

    // ========= 2) JWT PATH (fallback) =========
    const result = await verifyToken(token);
    if (!result.valid || !result.payload) {
      return NextResponse.json({ success: false, error: result.error || 'Invalid or expired token' }, { status: 401 });
    }

    const p = result.payload as TokenPayload;

    const email =
      typeof p.email === 'string' && p.email.includes('@') ? p.email : `${p.partner}@axpt.io`;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: p.partner,
          email,
          passwordHash: '',
          tier: p.tier,
          partnerSlug: p.partner,
          displayName: p.displayName ?? null,
          viewedDocs: [],
        },
      });
    } else {
      user = await prisma.user.update({
        where: { email },
        data: {
          lastLogin: new Date(),
          loginCount: { increment: 1 },
          tier: p.tier,
          partnerSlug: p.partner,
          displayName: p.displayName ?? undefined,
        },
      });
    }

    await prisma.sessionLog.create({
      data: {
        user: { connect: { id: user.id } },
        action: 'verified-jwt',
        path: '/api/partner/verify-token',
        ip: req.headers.get('x-forwarded-for') ?? '',
        device: req.headers.get('user-agent') ?? '',
      },
    });

    return NextResponse.json({
      success: true,
      partner: p.partner,
      tier: p.tier,
      docs: p.docs ?? [],
      displayName: p.displayName ?? undefined,
      greeting: p.greeting ?? undefined,
      popupMessage: p.popupMessage ?? undefined,
      userId: user.id,
      email,
    });
  } catch (err) {
    console.error('[verify-token] unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}