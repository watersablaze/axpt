// File: app/api/partner/verify-token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/utils/readEnv';
import partnerTiers from '@/config/partnerTiers.json';
import tierDocs from '@/config/tierDocs.json';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const PARTNER_SECRET = getEnv('PARTNER_SECRET');
const partners = partnerTiers as Record<string, { tier: string; displayName?: string; greeting?: string }>;
const tierToDocs = tierDocs as Record<string, string[]>;

const isProd = process.env.NODE_ENV === 'production';

const getLogPath = () => {
  const today = new Date().toISOString().split('T')[0];
  const logDir = isProd ? '/tmp' : path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  return path.join(logDir, `token-verify-${today}.log`);
};

const logUsage = (entry: string) => {
  const line = `[${new Date().toISOString()}] ${entry}\n`;
  try {
    fs.appendFileSync(getLogPath(), line);
  } catch (err) {
    console.warn('⚠️ Logging failed:', err);
  }
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const ipHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = ipHits.get(ip) || [];
  const recent = attempts.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  ipHits.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_ATTEMPTS;
}

function verifyTokenPayload(token: string): { isValid: boolean; payload?: any } {
  const [encodedPayload, providedSig] = token.split(':');
  if (!encodedPayload || !providedSig) return { isValid: false };

  try {
    const payloadRaw = Buffer.from(encodedPayload, 'base64').toString('utf8');
    const payload = JSON.parse(payloadRaw);

    // ✅ Fix: Use JSON.stringify(payload) to match token generator
    const expectedSig = crypto
      .createHmac('sha256', PARTNER_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    return { isValid: expectedSig === providedSig, payload };
  } catch (err) {
    console.error('❌ Token decode/verify error:', err);
    return { isValid: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('host') || 'unknown-ip';

    if (isRateLimited(ip)) {
      logUsage(`🚫 [${ip}] Rate limit exceeded`);
      return NextResponse.json({ success: false, message: 'Too many attempts. Please try again shortly.' }, { status: 429 });
    }

    if (!token) {
      logUsage(`❌ [${ip}] Missing token`);
      return NextResponse.json({ success: false, message: 'Missing token.' }, { status: 400 });
    }

    const { isValid, payload } = verifyTokenPayload(token);

    if (!isValid || !payload) {
      logUsage(`❌ [${ip}] Invalid or malformed token`);
      return NextResponse.json({ success: false, message: 'Invalid or malformed token.' }, { status: 401 });
    }

    const { partner, tier } = payload;
    if (!partner || !tier) {
      logUsage(`❌ [${ip}] Token missing partner or tier fields`);
      return NextResponse.json({ success: false, message: 'Invalid token structure.' }, { status: 403 });
    }

    const partnerEntry = partners[partner];
    if (!partnerEntry) {
      logUsage(`⚠️ [${ip}] No matching partner entry → ${partner}`);
      return NextResponse.json({ success: false, message: 'Partner not registered.' }, { status: 403 });
    }

    const allowedDocs = Array.isArray(payload.docs)
    ? payload.docs
    : tierToDocs[tier] || [];
    const displayName = partnerEntry.displayName || partner;
    const greeting = partnerEntry.greeting || `Welcome, ${displayName}`;

    logUsage(`✅ [${ip}] ${partner} → ${tier} (${allowedDocs.length} docs)`);

    return NextResponse.json({
      success: true,
      message: 'Token is valid.',
      partner,
      tier,
      allowedDocs,
      displayName,
      greeting,
    });
  } catch (err) {
    console.error('❌ Unexpected server error:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}