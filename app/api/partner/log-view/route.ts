// app/api/partner/log-view/route.ts
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyToken, decodeToken } from '@/utils/token';
import { getEnv } from '@/scripts/partner-tokens/utils/readEnv';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, route = '/partner/whitepaper', source = 'manual', userAgent } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), { status: 400 });
    }

    const payload = verifyToken(token);
    const decoded = decodeToken(token);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const logEntry = {
      timestamp: new Date().toISOString(),
      route,
      source,
      tokenHash,
      partner: payload?.partner ?? decoded?.partner ?? 'unknown',
      tier: payload?.tier ?? decoded?.tier ?? 'unknown',
      docs: payload?.docs ?? decoded?.docs ?? [],
      iat: payload?.iat ?? decoded?.iat ?? null,
      userAgent,
      verified: !!payload
    };

    const logsDir = path.join(process.cwd(), 'logs');
    const logPath = path.join(logsDir, 'partner-view-logs.jsonl');
    fs.mkdirSync(logsDir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Logging failed:', err);
    return new Response(JSON.stringify({ error: 'Logging failed' }), { status: 500 });
  }
}