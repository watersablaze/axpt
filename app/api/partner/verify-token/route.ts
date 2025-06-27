// app/api/verify-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, decodeToken, isTokenExpired } from '@/utils/token';
import { getSessionCookieServer } from '@/lib/auth/session';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string' || !token.includes(':')) {
      return NextResponse.json(
        { success: false, error: 'Missing or malformed token' },
        { status: 400 }
      );
    }

    const isValid = verifyToken(token);
    const decoded = decodeToken(token);
    const expired = isTokenExpired(token);

    if (!isValid || !decoded || expired) {
      return NextResponse.json(
        {
          success: false,
          error: expired ? 'Token expired' : 'Invalid signature or payload',
        },
        { status: 401 }
      );
    }

    const { partner, tier, docs } = decoded;

    if (!partner || !tier || !Array.isArray(docs)) {
      return NextResponse.json(
        { success: false, error: 'Incomplete token payload' },
        { status: 422 }
      );
    }

    // Log token verification
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const logEntry = {
      timestamp: new Date().toISOString(),
      partner,
      tier,
      docs,
      tokenHash,
      status: '✅ verified',
    };
    const logPath = path.join(process.cwd(), 'app/logs/token-verifications.jsonl');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');

    // Respond with verified data
    const res = NextResponse.json({
      success: true,
      payload: { partner, tier, docs },
      tokenHash,
    });

    // Attach session cookie
    res.headers.set('Set-Cookie', getSessionCookieServer(partner));
    return res;
  } catch (err) {
    console.error('[AXPT] ❌ Error verifying token:', err);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}