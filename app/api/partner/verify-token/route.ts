import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import base64url from 'base64url';
import { createSessionCookie } from '@/lib/auth/createSessionCookie';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const SECRET = process.env.PARTNER_SECRET || (() => {
  console.warn('[AXPT] ⚠️ Using fallback PARTNER_SECRET. Set a secure one in .env.');
  return 'fallback-dev-secret';
})();

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    console.log('\n[AXPT] 🔍 Received token:', token);

    if (!token || typeof token !== 'string') {
      console.warn('[AXPT] ⚠️ Missing or non-string token');
      return NextResponse.json({ success: false, error: 'Token missing' }, { status: 400 });
    }

    if (token.includes(':')) {
      console.log('[AXPT] ✅ Detected AXPT-style token');

      const [payloadB64, signature] = token.split(':');

      if (!payloadB64 || !signature) {
        console.warn('[AXPT] ⚠️ Malformed token parts');
        return NextResponse.json({ success: false, error: 'Malformed token segments' }, { status: 400 });
      }

      const expectedSig = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('hex');
      console.log('[AXPT] 🔐 Calculated Signature:', expectedSig);
      console.log('[AXPT] 🧾 Provided Signature:', signature);

      if (signature !== expectedSig) {
        console.warn('[AXPT] ❌ Signature mismatch');
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
      }

      let payload: {
        partner: string;
        tier: string;
        docs: string[];
        displayName?: string;
        greeting?: string;
      } | null = null;

      try {
        const decoded = base64url.decode(payloadB64);
        payload = JSON.parse(decoded);
        console.log('[AXPT] 📦 Decoded payload:', payload);
      } catch (err) {
        console.error('[AXPT] ❌ Failed to parse token payload:', err);
        return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
      }

      if (!payload || typeof payload !== 'object') {
        console.warn('[AXPT] ⚠️ Invalid payload structure');
        return NextResponse.json({ success: false, error: 'Payload is not a valid object' }, { status: 422 });
      }

      const { partner, tier, docs, displayName, greeting } = payload;

      if (!partner || !tier || !Array.isArray(docs)) {
        console.warn('[AXPT] ⚠️ Incomplete payload fields');
        return NextResponse.json({ success: false, error: 'Incomplete payload' }, { status: 422 });
      }

      const sessionResult = await createSessionCookie({ userId: partner, tier });
      const cookie = typeof sessionResult === 'string' ? sessionResult : sessionResult.cookie;

      // ⚠️ Safely log access
      try {
        await prisma.tokenAccessLog.create({
          data: {
            token: crypto.createHash('sha256').update(token).digest('hex'),
            tier,
            partner,
            path: '/api/partner/verify-token',
          },
        });
      } catch (logErr) {
        console.error('[AXPT] ⚠️ Failed to log token access:', logErr);
      }

      const res = NextResponse.json({
        success: true,
        partner,
        tier,
        docs,
        displayName,
        greeting,
      });

      res.headers.set('Set-Cookie', cookie);
      console.log('[AXPT] ✅ Token verification success. Session cookie issued.\n');
      return res;
    }

    if (token.split('.').length === 3) {
      console.warn('[AXPT] ⚠️ JWT-style token detected. Unsupported.');
      return NextResponse.json({ success: false, error: 'JWT-style token unsupported (yet)' }, { status: 400 });
    }

    console.warn('[AXPT] ❌ Token is neither AXPT-style nor JWT-style');
    return NextResponse.json(
      { success: false, error: 'Token must be a valid AXPT or JWT format' },
      { status: 400 }
    );
  } catch (err) {
    console.error('[AXPT] 🔥 Unexpected error during verification:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}