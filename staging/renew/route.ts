import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookie, createSessionCookie } from '@/lib/auth/session';
import { verifyToken } from '@/lib/token/verifyToken';
import { signToken } from '@/lib/token/signToken';
import { TokenPayload } from '@/lib/token/tokenSchema';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';

/**
 * 🔄 Renew session token if it's still valid (not expired).
 */
export async function POST(req: NextRequest) {
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  const { valid, payload } = await verifyToken(token);

  if (!valid || !payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  const tokenExp = payload.exp ?? 0;

  if (tokenExp < now) {
    return NextResponse.json(
      { error: 'Token already expired. Please re-authenticate.' },
      { status: 403 }
    );
  }

  // ✅ Renew with updated expiration
  const newExp = now + 60 * 60 * 24 * 30; // 30 days
  const newPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: newExp,
  };

  const renewedToken = await signToken(newPayload);
  await createSessionCookie(renewedToken);

  // 📝 Optional: log to file
  try {
    const logsDir = path.resolve(process.cwd(), 'logs');
    const logFile = path.join(logsDir, 'token-renewals.json');
    if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });

    const logEntry = {
      userId: payload.userId,
      partner: payload.partner,
      renewedAt: new Date().toISOString(),
      expiresAt: new Date(newExp * 1000).toISOString(),
      tier: payload.tier,
      docs: payload.docs,
    };

    const existing = existsSync(logFile)
      ? JSON.parse(readFileSync(logFile, 'utf-8'))
      : [];

    const updatedLogs = [logEntry, ...existing];
    writeFileSync(logFile, JSON.stringify(updatedLogs, null, 2));
  } catch (err) {
    console.error('[AXPT] ⚠️ Failed to log token renewal:', err);
  }

  return NextResponse.json({
    success: true,
    renewedToken,
    newExp,
  });
}